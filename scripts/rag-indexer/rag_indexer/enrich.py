"""Stage 2: enrich each chunk via Claude Sonnet.

Reads chunks.jsonl, groups by document, sends batches of chunks per request so the
model sees neighbouring fragments and can produce a tight contextual_prefix.

Output: enriched.jsonl — one record per chunk = original chunk fields + enrichment.
"""
from __future__ import annotations

import json
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Iterable

from anthropic import Anthropic, RateLimitError
from tqdm import tqdm

from .config import Config, load_config
from .utils import read_jsonl

SYSTEM_PROMPT = """You enrich documentation chunks for a hybrid retrieval system over a MERN e-commerce project (ProShop). Queries arrive in Russian and English; the source documents are in English.

For each chunk you receive, produce:
- summary: ONE concise sentence (≤25 words) describing what this chunk covers.
- questions: 4–6 natural-language questions that this chunk fully answers. Half English, half Russian. Mix question styles ("how do I...", "what happens when...", "почему...", "что делать если...").
- tags: 6–12 short keywords/phrases. Include both English and Russian forms for the same concept where it helps recall (e.g. ["paypal", "оплата", "double-charge", "идемпотентность"]). Lowercase, no punctuation.
- contextual_prefix: 1–2 sentences placing the chunk inside its parent document — the document's purpose plus where this fragment sits ("Section X of the Orders API reference, covering Y."). This prefix will be prepended to the chunk before embedding, so it must read naturally and add real context, not repeat the chunk.

Return STRICT JSON: a single object {"chunks": [...]} where each item has fields chunk_index, summary, questions, tags, contextual_prefix. The chunk_index MUST match the input. Do not add commentary outside the JSON."""


def _build_user_message(document: dict, batch: list[dict]) -> str:
    header = (
        f"Document title: {document['document_title']}\n"
        f"Document type: {document['doc_type']}\n"
        f"File path: {document['file_path']}\n"
        f"Total chunks in this document: {document['chunk_count']}\n"
    )
    parts = [header, "Enrich the following chunks. Respond with the JSON described in the system prompt."]
    for ch in batch:
        section = " > ".join(ch["section_path"]) if ch["section_path"] else "(no section)"
        parts.append(
            f"\n--- chunk_index={ch['chunk_index']} | section={section} ---\n{ch['content']}"
        )
    return "\n".join(parts)


_JSON_FENCE = re.compile(r"^```(?:json)?\s*|\s*```$", re.MULTILINE)


def _parse_response(text: str) -> list[dict]:
    cleaned = _JSON_FENCE.sub("", text).strip()
    data = json.loads(cleaned)
    if isinstance(data, dict) and "chunks" in data:
        return data["chunks"]
    if isinstance(data, list):
        return data
    raise ValueError(f"unexpected enrichment response shape: {type(data).__name__}")


def _call_with_backoff(client: Anthropic, **kwargs) -> object:
    """Retry on RateLimitError with exponential backoff (the SDK only retries a few times)."""
    delay = 8.0
    for attempt in range(8):
        try:
            return client.messages.create(**kwargs)
        except RateLimitError:
            if attempt == 7:
                raise
            time.sleep(delay)
            delay = min(delay * 1.6, 90.0)
    raise RuntimeError("unreachable")


def _enrich_batch(
    client: Anthropic,
    model: str,
    document: dict,
    batch: list[dict],
) -> list[dict]:
    user_msg = _build_user_message(document, batch)
    response = _call_with_backoff(
        client,
        model=model,
        max_tokens=4096,
        system=[
            {
                "type": "text",
                "text": SYSTEM_PROMPT,
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=[{"role": "user", "content": user_msg}],
    )
    if response.stop_reason == "max_tokens":
        raise ValueError(
            f"output truncated at max_tokens for {document['file_path']} "
            f"(batch of {len(batch)} chunks) — lower ENRICH_BATCH_SIZE"
        )
    text = "".join(block.text for block in response.content if block.type == "text")
    items = _parse_response(text)
    by_index = {item["chunk_index"]: item for item in items}
    enriched: list[dict] = []
    for ch in batch:
        info = by_index.get(ch["chunk_index"])
        if info is None:
            raise ValueError(
                f"missing enrichment for chunk_index={ch['chunk_index']} in {document['file_path']}"
            )
        merged = dict(ch)
        merged["summary"] = info.get("summary", "").strip()
        merged["questions"] = [q.strip() for q in info.get("questions", []) if q.strip()]
        merged["tags"] = [t.strip().lower() for t in info.get("tags", []) if t.strip()]
        merged["contextual_prefix"] = info.get("contextual_prefix", "").strip()
        enriched.append(merged)
    return enriched


def _enrich_document(
    client: Anthropic,
    model: str,
    document: dict,
    chunks: list[dict],
    batch_size: int,
) -> list[dict]:
    out: list[dict] = []
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i : i + batch_size]
        out.extend(_enrich_batch(client, model, document, batch))
    return out


def _load_done_doc_ids(path: Path) -> set[str]:
    if not path.exists():
        return set()
    done: set[str] = set()
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                done.add(json.loads(line)["document_id"])
    return done


def enrich_all(cfg: Config) -> int:
    """Enrich every chunk. Resumable: documents already present in enriched.jsonl
    are skipped. Each document is appended atomically once all its chunks are ready,
    so a crash mid-run only loses the in-flight document."""
    if not cfg.anthropic_api_key:
        raise RuntimeError("ANTHROPIC_API_KEY is not set — see .env.example")
    client = Anthropic(api_key=cfg.anthropic_api_key, max_retries=4)

    documents_by_id = {d["document_id"]: d for d in read_jsonl(cfg.documents_path)}
    chunks_by_doc: dict[str, list[dict]] = {}
    for ch in read_jsonl(cfg.chunks_path):
        chunks_by_doc.setdefault(ch["document_id"], []).append(ch)

    done = _load_done_doc_ids(cfg.enriched_path)
    pending = {doc_id: chunks for doc_id, chunks in chunks_by_doc.items() if doc_id not in done}
    if done:
        print(f"resume: {len(done)} documents already enriched, {len(pending)} to go")

    cfg.enriched_path.parent.mkdir(parents=True, exist_ok=True)
    total_written = sum(len(chunks_by_doc[d]) for d in done)

    with cfg.enriched_path.open("a", encoding="utf-8") as out_fh:
        with ThreadPoolExecutor(max_workers=max(1, cfg.enrich_parallelism)) as pool:
            futures = {
                pool.submit(
                    _enrich_document,
                    client,
                    cfg.anthropic_model,
                    documents_by_id[doc_id],
                    sorted(chunks, key=lambda c: c["chunk_index"]),
                    cfg.enrich_batch_size,
                ): doc_id
                for doc_id, chunks in pending.items()
            }
            for fut in tqdm(as_completed(futures), total=len(futures), desc="enrich"):
                doc_id = futures[fut]
                try:
                    enriched_chunks = fut.result()
                except Exception as e:
                    fp = documents_by_id[doc_id]["file_path"]
                    print(f"\n[error] {fp}: {e}")
                    continue
                for ch in enriched_chunks:
                    out_fh.write(json.dumps(ch, ensure_ascii=False) + "\n")
                out_fh.flush()
                total_written += len(enriched_chunks)

    return total_written


def main() -> None:
    cfg = load_config()
    n = enrich_all(cfg)
    print(f"enrich: {n} chunks → {cfg.enriched_path}")


if __name__ == "__main__":
    main()