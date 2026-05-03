"""Hybrid search over the ProShop docs index.

Usage:
    python -m rag_indexer query "вопрос или query" [--k 5] [--type api]
                                                   [--json] [--full]
                                                   [--no-hyde]

Pipeline per query:
  1. Encode query with BGE-M3 → dense (1024d) + sparse lexical weights.
  2. Three Qdrant prefetches (dense / sparse / questions_dense), fused with RRF.
  3. Optional payload filter on doc_type.
  4. Top-K chunk hits returned with summary, section path, and a content snippet.

To pull the full source document for a hit, retrieve it from
proshop_docs_documents by `document_id` (see docs/rag.md).
"""
from __future__ import annotations

import argparse
import json
import sys
from typing import Any

import torch
from FlagEmbedding import BGEM3FlagModel
from qdrant_client import QdrantClient
from qdrant_client.http import models

from .config import Config, load_config
from .embed import MODEL_NAME

DENSE_NAME = "dense"
SPARSE_NAME = "sparse"
QUESTIONS_NAME = "questions_dense"
PREFETCH_LIMIT = 24


def _device() -> str:
    if torch.backends.mps.is_available():
        return "mps"
    if torch.cuda.is_available():
        return "cuda"
    return "cpu"


def _encode_query(model: BGEM3FlagModel, text: str) -> tuple[list[float], dict]:
    out = model.encode(
        [text],
        max_length=512,
        return_dense=True,
        return_sparse=True,
        return_colbert_vecs=False,
    )
    dense = out["dense_vecs"][0].tolist()
    lex = out["lexical_weights"][0]
    sparse = {
        "indices": [int(k) for k in lex.keys()],
        "values": [float(v) for v in lex.values()],
    }
    return dense, sparse


def search(
    cfg: Config,
    text: str,
    *,
    k: int = 5,
    hyde: bool = True,
    doc_type: str | None = None,
    model: BGEM3FlagModel | None = None,
    client: QdrantClient | None = None,
) -> list[dict[str, Any]]:
    model = model or BGEM3FlagModel(MODEL_NAME, use_fp16=True, device=_device())
    client = client or QdrantClient(url=cfg.qdrant_url)

    dense_q, sparse_q = _encode_query(model, text)

    prefetch = [
        models.Prefetch(query=dense_q, using=DENSE_NAME, limit=PREFETCH_LIMIT),
        models.Prefetch(
            query=models.SparseVector(indices=sparse_q["indices"], values=sparse_q["values"]),
            using=SPARSE_NAME,
            limit=PREFETCH_LIMIT,
        ),
    ]
    if hyde:
        prefetch.append(
            models.Prefetch(query=dense_q, using=QUESTIONS_NAME, limit=PREFETCH_LIMIT)
        )

    query_filter = None
    if doc_type:
        query_filter = models.Filter(
            must=[models.FieldCondition(key="doc_type", match=models.MatchValue(value=doc_type))]
        )

    result = client.query_points(
        collection_name=cfg.collection_chunks,
        prefetch=prefetch,
        query=models.FusionQuery(fusion=models.Fusion.RRF),
        query_filter=query_filter,
        limit=k,
        with_payload=True,
    )

    hits: list[dict[str, Any]] = []
    for point in result.points:
        p = point.payload or {}
        hits.append(
            {
                "score": point.score,
                "chunk_id": str(point.id),
                "document_id": p.get("document_id"),
                "document_title": p.get("document_title"),
                "doc_type": p.get("doc_type"),
                "file_path": p.get("file_path"),
                "section_path": p.get("section_path", []),
                "summary": p.get("summary"),
                "tags": p.get("tags", []),
                "content": p.get("content"),
            }
        )
    return hits


def _print_human(hits: list[dict], full: bool) -> None:
    if not hits:
        print("(no results)")
        return
    for i, h in enumerate(hits, 1):
        section = " > ".join(h.get("section_path") or []) or "(root)"
        print(f"\n[{i}] score={h['score']:.4f}  [{h['doc_type']}]  {h['file_path']}")
        print(f"    section: {section}")
        if h.get("summary"):
            print(f"    summary: {h['summary']}")
        body = h.get("content") or ""
        if not full and len(body) > 600:
            body = body[:600].rstrip() + " …"
        print("    " + body.replace("\n", "\n    "))


def main() -> None:
    parser = argparse.ArgumentParser(prog="rag_indexer query")
    parser.add_argument("text", nargs="+", help="query text (RU or EN)")
    parser.add_argument("--k", type=int, default=5)
    parser.add_argument(
        "--type",
        dest="doc_type",
        choices=["adr", "api", "feature", "incident", "page", "runbook", "reference", "glossary", "history"],
        default=None,
        help="restrict to a single doc_type",
    )
    parser.add_argument("--no-hyde", action="store_true", help="disable questions_dense prefetch")
    parser.add_argument("--json", action="store_true", help="emit JSON instead of human output")
    parser.add_argument("--full", action="store_true", help="print full chunk content (no truncation)")
    args = parser.parse_args(sys.argv[2:] if sys.argv[1:2] == ["query"] else None)

    cfg = load_config()
    text = " ".join(args.text)
    hits = search(cfg, text, k=args.k, hyde=not args.no_hyde, doc_type=args.doc_type)

    if args.json:
        print(json.dumps(hits, ensure_ascii=False, indent=2))
    else:
        _print_human(hits, full=args.full)


if __name__ == "__main__":
    main()