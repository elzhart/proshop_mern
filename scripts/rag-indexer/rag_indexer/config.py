"""Shared configuration loaded from .env."""
from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

PACKAGE_DIR = Path(__file__).resolve().parent
INDEXER_DIR = PACKAGE_DIR.parent
REPO_ROOT = INDEXER_DIR.parent.parent

load_dotenv(REPO_ROOT / ".env")
load_dotenv(INDEXER_DIR / ".env", override=True)


@dataclass(frozen=True)
class Config:
    docs_roots: tuple[Path, ...]
    data_dir: Path
    qdrant_url: str
    collection_documents: str
    collection_chunks: str
    anthropic_api_key: str | None
    anthropic_model: str
    chunk_target_tokens: int
    chunk_max_tokens: int
    chunk_overlap_tokens: int
    enrich_batch_size: int
    enrich_parallelism: int

    @property
    def chunks_path(self) -> Path:
        return self.data_dir / "chunks.jsonl"

    @property
    def documents_path(self) -> Path:
        return self.data_dir / "documents.jsonl"

    @property
    def enriched_path(self) -> Path:
        return self.data_dir / "enriched.jsonl"

    @property
    def vectors_chunks_path(self) -> Path:
        return self.data_dir / "vectors_chunks.jsonl"

    @property
    def vectors_documents_path(self) -> Path:
        return self.data_dir / "vectors_documents.jsonl"


def load_config() -> Config:
    raw_roots = os.getenv("DOCS_ROOTS") or os.getenv("DOCS_ROOT", "docs/project-data")
    docs_roots = tuple(
        (REPO_ROOT / p.strip()).resolve()
        for p in raw_roots.split(",")
        if p.strip()
    )
    data_dir = (INDEXER_DIR / os.getenv("DATA_DIR", "data")).resolve()
    data_dir.mkdir(parents=True, exist_ok=True)
    return Config(
        docs_roots=docs_roots,
        data_dir=data_dir,
        qdrant_url=os.getenv("QDRANT_URL", "http://localhost:6333"),
        collection_documents=os.getenv("COLLECTION_DOCUMENTS", "proshop_docs_documents"),
        collection_chunks=os.getenv("COLLECTION_CHUNKS", "proshop_docs_chunks"),
        anthropic_api_key=os.getenv("ANTHROPIC_API_KEY"),
        anthropic_model=os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6"),
        chunk_target_tokens=int(os.getenv("CHUNK_TARGET_TOKENS", "400")),
        chunk_max_tokens=int(os.getenv("CHUNK_MAX_TOKENS", "512")),
        chunk_overlap_tokens=int(os.getenv("CHUNK_OVERLAP_TOKENS", "80")),
        enrich_batch_size=int(os.getenv("ENRICH_BATCH_SIZE", "4")),
        enrich_parallelism=int(os.getenv("ENRICH_PARALLELISM", "1")),
    )