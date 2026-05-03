"""Stage 1: split markdown documents into chunks.

Pure / deterministic — no LLM calls. Produces:
  - data/documents.jsonl  (one record per source file: full text + metadata)
  - data/chunks.jsonl     (one record per chunk)
"""
from __future__ import annotations

import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

import tiktoken
from langchain_text_splitters import (
    MarkdownHeaderTextSplitter,
    RecursiveCharacterTextSplitter,
)

from .config import Config, REPO_ROOT, load_config
from .utils import chunk_id, document_id, file_sha1, sha1, write_jsonl

HEADERS_TO_SPLIT = [
    ("#", "h1"),
    ("##", "h2"),
    ("###", "h3"),
]

_TOKENIZER = tiktoken.get_encoding("cl100k_base")


def count_tokens(text: str) -> int:
    return len(_TOKENIZER.encode(text, disallowed_special=()))


def detect_doc_type(rel_repo: str) -> str:
    """rel_repo is the file path relative to the repo root,
    e.g. 'docs/project-data/api/orders.md' or 'docs/adr/adr-001-mongodb-vs-postgres.md'."""
    if rel_repo.startswith("docs/adr/"):
        return "adr"
    prefix = "docs/project-data/"
    if not rel_repo.startswith(prefix):
        return "other"
    rest = rel_repo[len(prefix):]
    parts = rest.split("/")
    if len(parts) > 1:
        sub = parts[0]
        if sub == "api":
            return "api"
        if sub == "incidents":
            return "incident"
        if sub == "features":
            return "feature"
        if sub == "runbooks":
            return "runbook"
        if sub == "pages":
            return "page"
    name = parts[-1]
    if name == "glossary.md":
        return "glossary"
    if name == "dev-history.md":
        return "history"
    if name in {"architecture.md", "best-practices.md", "feature-flags-spec.md"}:
        return "reference"
    return "other"


def extract_title(text: str, fallback: str) -> str:
    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith("# "):
            return stripped[2:].strip()
    return fallback


def section_path_from_metadata(meta: dict) -> list[str]:
    return [meta[k] for k in ("h1", "h2", "h3") if k in meta and meta[k]]


def _strategy_for(doc_type: str) -> dict:
    """Override knobs per doc type.

    pack: greedily merge adjacent small header-sections up to target_tokens.
    subsplit_long: if a section exceeds max_tokens, recursively split it.
    """
    if doc_type == "page":
        # ~35-50 lines, self-contained — keep whole file as one chunk.
        return {"split_headers": False, "pack": False, "subsplit_long": False}
    if doc_type == "glossary":
        # 1 term = 1 chunk; merging would mix unrelated terms.
        return {"split_headers": True, "pack": False, "subsplit_long": False}
    # api / incident / feature / runbook / reference / history / other
    return {"split_headers": True, "pack": True, "subsplit_long": True}


def _header_split(text: str) -> list[dict]:
    splitter = MarkdownHeaderTextSplitter(
        headers_to_split_on=HEADERS_TO_SPLIT,
        strip_headers=False,
    )
    docs = splitter.split_text(text)
    return [
        {
            "content": d.page_content,
            "section_path": section_path_from_metadata(d.metadata),
        }
        for d in docs
    ]


def _greedy_pack(
    sections: list[dict],
    target_tokens: int,
    max_tokens: int,
) -> list[dict]:
    """Merge consecutive small sections until ~target_tokens.

    A section that already exceeds max_tokens is emitted unchanged (will be
    handled by _recursive_subsplit later). The merged chunk inherits the
    section_path of the first section in the run — good enough for retrieval
    since file_path is always present too.
    """
    out: list[dict] = []
    buf: list[str] = []
    buf_path: list[str] = []
    buf_tokens = 0

    def flush() -> None:
        nonlocal buf, buf_path, buf_tokens
        if buf:
            out.append({"content": "\n\n".join(buf), "section_path": buf_path})
            buf, buf_path, buf_tokens = [], [], 0

    for s in sections:
        tokens = count_tokens(s["content"])
        if tokens > max_tokens:
            flush()
            out.append(s)
            continue
        if buf_tokens + tokens > target_tokens and buf:
            flush()
        if not buf:
            buf_path = s["section_path"]
        buf.append(s["content"])
        buf_tokens += tokens

    flush()
    return out


def _recursive_subsplit(
    section: dict,
    max_tokens: int,
    overlap_tokens: int,
) -> list[dict]:
    content = section["content"]
    if count_tokens(content) <= max_tokens:
        return [section]
    splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
        encoding_name="cl100k_base",
        chunk_size=max_tokens,
        chunk_overlap=overlap_tokens,
        separators=["\n\n", "\n", ". ", "? ", "! ", " ", ""],
    )
    parts = splitter.split_text(content)
    return [{"content": p, "section_path": section["section_path"]} for p in parts]


def _split_document(
    text: str,
    doc_type: str,
    cfg: Config,
) -> list[dict]:
    strat = _strategy_for(doc_type)

    if not strat["split_headers"]:
        return [{"content": text.strip(), "section_path": []}]

    sections = _header_split(text)
    if not sections:
        sections = [{"content": text.strip(), "section_path": []}]

    if strat["pack"]:
        sections = _greedy_pack(
            sections,
            target_tokens=cfg.chunk_target_tokens,
            max_tokens=cfg.chunk_max_tokens,
        )

    if not strat["subsplit_long"]:
        return [s for s in sections if s["content"].strip()]

    out: list[dict] = []
    for s in sections:
        out.extend(
            _recursive_subsplit(
                s,
                max_tokens=cfg.chunk_max_tokens,
                overlap_tokens=cfg.chunk_overlap_tokens,
            )
        )
    return [s for s in out if s["content"].strip()]


def _iter_markdown_files(docs_roots: tuple[Path, ...]) -> Iterable[Path]:
    seen: set[Path] = set()
    files: list[Path] = []
    for root in docs_roots:
        for p in root.rglob("*.md"):
            if p not in seen:
                seen.add(p)
                files.append(p)
    files.sort()
    for p in files:
        yield p


def split_all(cfg: Config) -> tuple[int, int]:
    """Split every markdown file under any of cfg.docs_roots.

    Returns (documents_written, chunks_written).
    """
    now = datetime.now(timezone.utc).isoformat()
    documents: list[dict] = []
    chunks: list[dict] = []

    for path in _iter_markdown_files(cfg.docs_roots):
        rel = path.relative_to(REPO_ROOT).as_posix()
        doc_type = detect_doc_type(rel)
        text = path.read_text(encoding="utf-8")
        title = extract_title(text, fallback=path.stem)
        f_hash = file_sha1(path)
        doc_id = document_id(rel)

        sections = _split_document(text, doc_type, cfg)
        total = len(sections)

        documents.append(
            {
                "document_id": doc_id,
                "document_title": title,
                "file_path": rel,
                "doc_type": doc_type,
                "file_hash": f_hash,
                "full_text": text,
                "chunk_count": total,
                "updated_at": now,
                "token_count": count_tokens(text),
            }
        )

        for idx, section in enumerate(sections):
            content = section["content"].strip()
            chunks.append(
                {
                    "chunk_id": chunk_id(rel, idx),
                    "document_id": doc_id,
                    "document_title": title,
                    "file_path": rel,
                    "doc_type": doc_type,
                    "section_path": section["section_path"],
                    "chunk_index": idx,
                    "total_chunks": total,
                    "prev_id": chunk_id(rel, idx - 1) if idx > 0 else None,
                    "next_id": chunk_id(rel, idx + 1) if idx < total - 1 else None,
                    "content": content,
                    "content_hash": sha1(content),
                    "file_hash": f_hash,
                    "updated_at": now,
                    "token_count": count_tokens(content),
                }
            )

    n_docs = write_jsonl(cfg.documents_path, documents)
    n_chunks = write_jsonl(cfg.chunks_path, chunks)
    return n_docs, n_chunks


def main() -> None:
    cfg = load_config()
    n_docs, n_chunks = split_all(cfg)
    print(f"split: {n_docs} documents → {n_chunks} chunks")
    print(f"  documents: {cfg.documents_path}")
    print(f"  chunks:    {cfg.chunks_path}")


if __name__ == "__main__":
    main()