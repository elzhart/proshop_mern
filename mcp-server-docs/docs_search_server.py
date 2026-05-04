"""ProShop docs MCP server (FastMCP).

One tool: search_project_docs(query, top_k) — semantic + lexical hybrid search
over the project documentation, backed by Qdrant + BGE-M3.

The heavy lifting (embedding, hybrid prefetch, RRF fusion) lives in
scripts/rag-indexer/rag_indexer/query.py. This server is a thin MCP wrapper
that reuses that codebase and venv so we don't duplicate model weights or deps.
"""
from __future__ import annotations

import sys
from pathlib import Path

# Reuse the rag-indexer package: it owns the BGE-M3 + Qdrant client and already
# has FlagEmbedding/torch installed in its venv. We expect this server to be
# launched by that very venv — see .mcp.json / mcp-server-docs/README.md.
RAG_DIR = Path(__file__).resolve().parent.parent / "scripts" / "rag-indexer"
sys.path.insert(0, str(RAG_DIR))

from fastmcp import FastMCP

from rag_indexer.config import load_config
from rag_indexer.embed import MODEL_NAME
from rag_indexer.query import _device, search

SNIPPET_CHARS = 200
MAX_TOP_K = 50

mcp = FastMCP("proshop-docs")

# Lazy globals — first call pays the BGE-M3 load cost (~10 s on MPS), subsequent
# calls reuse the in-memory model and Qdrant client.
_cfg = None
_model = None
_client = None


def _ensure_loaded():
    global _cfg, _model, _client
    if _cfg is None:
        _cfg = load_config()
    if _model is None:
        from FlagEmbedding import BGEM3FlagModel
        _model = BGEM3FlagModel(MODEL_NAME, use_fp16=True, device=_device())
    if _client is None:
        from qdrant_client import QdrantClient
        _client = QdrantClient(url=_cfg.qdrant_url)
    return _cfg, _model, _client


def _format_chunk(hit: dict) -> dict:
    content = hit.get("content") or ""
    snippet = content[:SNIPPET_CHARS].rstrip()
    if len(content) > SNIPPET_CHARS:
        snippet += "…"
    file_path = hit.get("file_path") or ""
    return {
        "source_file": file_path.rsplit("/", 1)[-1] if file_path else "",
        "file_path": file_path,
        "title": hit.get("document_title", ""),
        "parent_headings": hit.get("section_path", []) or [],
        "score": hit.get("score"),
        "snippet": snippet,
        "doc_type": hit.get("doc_type"),
        "chunk_id": hit.get("chunk_id"),
        "document_id": hit.get("document_id"),
    }


@mcp.tool()
def search_project_docs(query: str, top_k: int = 5) -> dict:
    """Hybrid semantic + lexical search over the proshop_mern project documentation.

    Index covers everything under `docs/` in this repo: architecture, features,
    ADRs, runbooks, incidents, glossary, dev history, page specs, API reference,
    and feature-flags spec. 364 chunks across 49 documents (state on 2026-05-04).
    Ranking is RRF fusion of BGE-M3 dense, BGE-M3 sparse (lexical), and a
    HyDE-questions dense channel — multilingual, no query prefixes needed.

    WHEN TO CALL: any question about how this product works or has worked —
    architecture, a feature, a past incident, an ADR rationale, an API contract,
    a runbook step, a domain term, an admin/user flow, why a tech choice was
    made. Examples:
        - "How does the cart persist between sessions?"
        - "Why was MongoDB chosen over PostgreSQL?"
        - "Что произошло во время инцидента с PayPal double charge?"
        - "What does the feature_flag_toggle runbook say about ramping traffic?"
        - "Explain the checkout step sequence"

    HARD RULE — You MUST call this BEFORE grep / Read on `docs/`. The index has
    Sonnet-generated summaries, contextual prefixes, and HyDE-style questions on
    every chunk; raw grep cannot match those. Going to grep first wastes the
    BGE-M3 hybrid retrieval that was built specifically for product Q&A.

    WHEN NOT TO CALL:
        - Live state of a specific feature flag (status / traffic_percentage /
          last_modified) → use the proshop-features MCP (`get_feature_info` /
          `list_features`). This tool returns DOCUMENTATION about flags and
          their design intent, not their current runtime state.
        - Reading or modifying source code → use Read/grep on `backend/` or
          `frontend/`. The index does not cover code, only docs.
        - Generic non-project questions (Claude API usage, library docs of
          third-party packages, general MERN-stack tutorials).

    Args:
        query (str): natural-language question, English or Russian. No prefixes
            required — BGE-M3 accepts raw text.
        top_k (int): how many chunks to return. Default 5. Recommended 4-6 for
            focused questions, up to 10-12 for broader overviews. Clamped to
            [1..50].

    Returns: dict with keys:
        query (str): the input query, echoed.
        top_k (int): the effective k.
        chunks (list[dict]): hits sorted by score desc, each with:
            source_file (str)      — basename, e.g. "adr-001-mongodb-vs-postgres.md"
            file_path (str)        — repo-relative path, e.g. "docs/adr/adr-001-mongodb-vs-postgres.md"
            title (str)            — H1 of the source document
            parent_headings (list) — breadcrumbs of headings down to this chunk,
                                     e.g. ["Orders API Reference", "Endpoints",
                                           "POST /api/orders"]
            score (float)          — RRF fusion score; meaningful for ranking
                                     within this query, not as an absolute
                                     similarity threshold
            snippet (str)          — first ~200 chars of the chunk content,
                                     ellipsis appended if truncated
            doc_type (str)         — one of: adr, api, feature, incident, page,
                                     runbook, reference, glossary, history
            chunk_id (str)         — opaque UUID, stable across reindex
            document_id (str)      — opaque UUID linking back to the whole file
                                     in the proshop_docs_documents collection

    Errors: returns {"error": CODE, "message": str} on:
        INVALID_QUERY     — empty / whitespace-only / non-string query
        INVALID_TOP_K     — top_k not in [1..50]
        QDRANT_UNAVAILABLE — Qdrant at $QDRANT_URL is unreachable. The fix is
                            usually `docker compose up -d qdrant` from the repo
                            root.

    Examples:
        search_project_docs("How does ProShop persist the shopping cart?")
        search_project_docs("Why MongoDB over Postgres", top_k=3)
        search_project_docs("инцидент PayPal double charge")
        search_project_docs("checkout flow steps", top_k=8)
    """
    if not isinstance(query, str) or not query.strip():
        return {"error": "INVALID_QUERY", "message": "query must be a non-empty string"}
    if not isinstance(top_k, int) or top_k < 1 or top_k > MAX_TOP_K:
        return {
            "error": "INVALID_TOP_K",
            "message": f"top_k must be an int in [1..{MAX_TOP_K}]",
        }

    try:
        cfg, model, client = _ensure_loaded()
        hits = search(cfg, query.strip(), k=top_k, model=model, client=client)
    except Exception as e:
        return {
            "error": "QDRANT_UNAVAILABLE",
            "message": f"{type(e).__name__}: {e}",
        }

    return {
        "query": query.strip(),
        "top_k": top_k,
        "chunks": [_format_chunk(h) for h in hits],
    }


if __name__ == "__main__":
    mcp.run()