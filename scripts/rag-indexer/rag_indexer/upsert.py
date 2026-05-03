"""Stage 4: upsert documents and chunks into Qdrant.

Two collections:
  - proshop_docs_documents : 1 point per file, dense vector for doc-level retrieval.
  - proshop_docs_chunks    : 1 point per chunk, named vectors (dense / sparse / questions_dense).

Incremental: a file is re-indexed only when its sha1 changed since the last run.
"""
from __future__ import annotations

from typing import Iterable

from qdrant_client import QdrantClient
from qdrant_client.http import models
from tqdm import tqdm

from .config import Config, load_config
from .utils import read_jsonl

DENSE_DIM = 1024
DENSE_NAME = "dense"
SPARSE_NAME = "sparse"
QUESTIONS_NAME = "questions_dense"


def _ensure_collections(client: QdrantClient, cfg: Config) -> None:
    existing = {c.name for c in client.get_collections().collections}

    if cfg.collection_chunks not in existing:
        client.create_collection(
            collection_name=cfg.collection_chunks,
            vectors_config={
                DENSE_NAME: models.VectorParams(size=DENSE_DIM, distance=models.Distance.COSINE),
                QUESTIONS_NAME: models.VectorParams(size=DENSE_DIM, distance=models.Distance.COSINE),
            },
            sparse_vectors_config={
                SPARSE_NAME: models.SparseVectorParams(),
            },
        )
        for field, schema in (
            ("document_id", models.PayloadSchemaType.KEYWORD),
            ("doc_type", models.PayloadSchemaType.KEYWORD),
            ("file_path", models.PayloadSchemaType.KEYWORD),
            ("tags", models.PayloadSchemaType.KEYWORD),
        ):
            client.create_payload_index(cfg.collection_chunks, field, field_schema=schema)

    if cfg.collection_documents not in existing:
        client.create_collection(
            collection_name=cfg.collection_documents,
            vectors_config=models.VectorParams(size=DENSE_DIM, distance=models.Distance.COSINE),
        )
        for field, schema in (
            ("doc_type", models.PayloadSchemaType.KEYWORD),
            ("file_path", models.PayloadSchemaType.KEYWORD),
            ("file_hash", models.PayloadSchemaType.KEYWORD),
        ):
            client.create_payload_index(cfg.collection_documents, field, field_schema=schema)


def _existing_doc_hashes(client: QdrantClient, cfg: Config) -> dict[str, str]:
    """Map document_id → file_hash for everything currently in the documents collection."""
    out: dict[str, str] = {}
    next_offset = None
    while True:
        points, next_offset = client.scroll(
            collection_name=cfg.collection_documents,
            with_payload=["file_hash"],
            with_vectors=False,
            limit=256,
            offset=next_offset,
        )
        for p in points:
            file_hash = (p.payload or {}).get("file_hash")
            if file_hash:
                out[str(p.id)] = file_hash
        if next_offset is None:
            break
    return out


def _delete_chunks_for(client: QdrantClient, cfg: Config, document_ids: Iterable[str]) -> None:
    ids = list(document_ids)
    if not ids:
        return
    client.delete(
        collection_name=cfg.collection_chunks,
        points_selector=models.FilterSelector(
            filter=models.Filter(
                must=[models.FieldCondition(key="document_id", match=models.MatchAny(any=ids))]
            )
        ),
    )


def _document_point(doc: dict, vector: list[float]) -> models.PointStruct:
    payload = {
        "document_title": doc["document_title"],
        "file_path": doc["file_path"],
        "doc_type": doc["doc_type"],
        "file_hash": doc["file_hash"],
        "full_text": doc["full_text"],
        "chunk_count": doc["chunk_count"],
        "token_count": doc.get("token_count"),
        "updated_at": doc["updated_at"],
    }
    return models.PointStruct(id=doc["document_id"], vector=vector, payload=payload)


def _chunk_point(chunk: dict, vec: dict) -> models.PointStruct:
    payload = {
        "document_id": chunk["document_id"],
        "document_title": chunk["document_title"],
        "file_path": chunk["file_path"],
        "doc_type": chunk["doc_type"],
        "section_path": chunk["section_path"],
        "chunk_index": chunk["chunk_index"],
        "total_chunks": chunk["total_chunks"],
        "prev_id": chunk.get("prev_id"),
        "next_id": chunk.get("next_id"),
        "content": chunk["content"],
        "summary": chunk.get("summary"),
        "questions": chunk.get("questions", []),
        "tags": chunk.get("tags", []),
        "contextual_prefix": chunk.get("contextual_prefix"),
        "content_hash": chunk["content_hash"],
        "file_hash": chunk["file_hash"],
        "token_count": chunk.get("token_count"),
        "updated_at": chunk["updated_at"],
    }
    sparse = vec["sparse"]
    return models.PointStruct(
        id=chunk["chunk_id"],
        vector={
            DENSE_NAME: vec["dense"],
            QUESTIONS_NAME: vec["questions_dense"],
            SPARSE_NAME: models.SparseVector(
                indices=sparse["indices"], values=sparse["values"]
            ),
        },
        payload=payload,
    )


def _batched(seq: list, size: int) -> Iterable[list]:
    for i in range(0, len(seq), size):
        yield seq[i : i + size]


def upsert_all(cfg: Config) -> dict:
    client = QdrantClient(url=cfg.qdrant_url)
    _ensure_collections(client, cfg)

    documents = list(read_jsonl(cfg.documents_path))
    doc_vectors = {v["document_id"]: v["dense"] for v in read_jsonl(cfg.vectors_documents_path)}

    chunks = list(read_jsonl(cfg.enriched_path))
    chunk_vectors = {v["chunk_id"]: v for v in read_jsonl(cfg.vectors_chunks_path)}

    existing_hashes = _existing_doc_hashes(client, cfg)

    changed_docs = [d for d in documents if existing_hashes.get(d["document_id"]) != d["file_hash"]]
    skipped = len(documents) - len(changed_docs)
    changed_ids = {d["document_id"] for d in changed_docs}

    # purge old chunks for changed docs
    _delete_chunks_for(client, cfg, changed_ids)

    # upsert documents
    doc_points = [_document_point(d, doc_vectors[d["document_id"]]) for d in changed_docs]
    for batch in tqdm(list(_batched(doc_points, 64)), desc="docs upsert"):
        client.upsert(collection_name=cfg.collection_documents, points=batch)

    # upsert chunks for changed docs
    relevant_chunks = [c for c in chunks if c["document_id"] in changed_ids]
    chunk_points = [_chunk_point(c, chunk_vectors[c["chunk_id"]]) for c in relevant_chunks]
    for batch in tqdm(list(_batched(chunk_points, 64)), desc="chunks upsert"):
        client.upsert(collection_name=cfg.collection_chunks, points=batch)

    return {
        "documents_upserted": len(doc_points),
        "documents_skipped_unchanged": skipped,
        "chunks_upserted": len(chunk_points),
    }


def main() -> None:
    cfg = load_config()
    stats = upsert_all(cfg)
    for k, v in stats.items():
        print(f"  {k}: {v}")


if __name__ == "__main__":
    main()