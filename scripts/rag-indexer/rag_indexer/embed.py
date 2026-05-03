"""Stage 3: embed enriched chunks locally with BGE-M3.

Uses the official `FlagEmbedding` library so we get BGE-M3's native multi-functional
output in one pass: dense (1024d) + sparse lexical weights. On Apple Silicon the
model runs on the MPS device (Metal). FP16 keeps memory low and is what BAAI
recommends for inference.

Output:
  - vectors_chunks.jsonl     — one record per chunk: dense / sparse / questions_dense
  - vectors_documents.jsonl  — one record per document: dense
"""
from __future__ import annotations

from typing import Iterable

import torch
from FlagEmbedding import BGEM3FlagModel
from tqdm import tqdm

from .config import Config, load_config
from .utils import read_jsonl, write_jsonl

MODEL_NAME = "BAAI/bge-m3"
DOC_TEXT_LIMIT = 1500
ENCODE_BATCH = 8
MAX_LENGTH = 512


def _pick_device() -> str:
    if torch.backends.mps.is_available():
        return "mps"
    if torch.cuda.is_available():
        return "cuda"
    return "cpu"


def _document_embed_text(doc: dict) -> str:
    body = doc["full_text"][:DOC_TEXT_LIMIT]
    return f"{doc['document_title']}\n\n{body}"


def _chunk_embed_text(chunk: dict) -> str:
    prefix = chunk.get("contextual_prefix", "").strip()
    if prefix:
        return f"{prefix}\n\n{chunk['content']}"
    return chunk["content"]


def _questions_embed_text(chunk: dict) -> str:
    questions = chunk.get("questions") or []
    return " | ".join(questions) if questions else chunk.get("summary", chunk["content"][:200])


def _to_sparse(lex_weights: dict) -> dict:
    """BGE-M3 lexical_weights ({token_id_str: weight}) → Qdrant sparse format."""
    return {
        "indices": [int(k) for k in lex_weights.keys()],
        "values": [float(v) for v in lex_weights.values()],
    }


def _encode(model: BGEM3FlagModel, texts: list[str], *, return_sparse: bool) -> dict:
    return model.encode(
        texts,
        batch_size=ENCODE_BATCH,
        max_length=MAX_LENGTH,
        return_dense=True,
        return_sparse=return_sparse,
        return_colbert_vecs=False,
    )


def _batched(seq: list, size: int) -> Iterable[list]:
    for i in range(0, len(seq), size):
        yield seq[i : i + size]


def embed_all(cfg: Config) -> tuple[int, int]:
    device = _pick_device()
    print(f"loading {MODEL_NAME} on device={device} (fp16)…")
    model = BGEM3FlagModel(MODEL_NAME, use_fp16=True, device=device)

    chunks = list(read_jsonl(cfg.enriched_path))
    chunk_texts = [_chunk_embed_text(c) for c in chunks]
    question_texts = [_questions_embed_text(c) for c in chunks]

    print(f"encoding {len(chunks)} chunks (dense + sparse)…")
    dense_vecs: list[list[float]] = []
    sparse_vecs: list[dict] = []
    for batch in tqdm(list(_batched(chunk_texts, 32)), desc="chunks"):
        out = _encode(model, batch, return_sparse=True)
        dense_vecs.extend(v.tolist() for v in out["dense_vecs"])
        sparse_vecs.extend(_to_sparse(w) for w in out["lexical_weights"])

    print(f"encoding {len(chunks)} HyDE question vectors…")
    question_dense: list[list[float]] = []
    for batch in tqdm(list(_batched(question_texts, 32)), desc="questions"):
        out = _encode(model, batch, return_sparse=False)
        question_dense.extend(v.tolist() for v in out["dense_vecs"])

    chunk_records = [
        {
            "chunk_id": c["chunk_id"],
            "dense": dense_vecs[i],
            "sparse": sparse_vecs[i],
            "questions_dense": question_dense[i],
        }
        for i, c in enumerate(chunks)
    ]
    n_chunks = write_jsonl(cfg.vectors_chunks_path, chunk_records)

    documents = list(read_jsonl(cfg.documents_path))
    doc_texts = [_document_embed_text(d) for d in documents]
    print(f"encoding {len(documents)} documents (dense)…")
    doc_dense: list[list[float]] = []
    for batch in tqdm(list(_batched(doc_texts, 16)), desc="docs"):
        out = _encode(model, batch, return_sparse=False)
        doc_dense.extend(v.tolist() for v in out["dense_vecs"])

    doc_records = [
        {"document_id": d["document_id"], "dense": doc_dense[i]}
        for i, d in enumerate(documents)
    ]
    n_docs = write_jsonl(cfg.vectors_documents_path, doc_records)

    return n_chunks, n_docs


def main() -> None:
    cfg = load_config()
    n_chunks, n_docs = embed_all(cfg)
    print(f"embed: {n_chunks} chunk vectors, {n_docs} document vectors")
    print(f"  chunks:    {cfg.vectors_chunks_path}")
    print(f"  documents: {cfg.vectors_documents_path}")


if __name__ == "__main__":
    main()