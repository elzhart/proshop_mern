"""Shared helpers: hashing, IDs, IO."""
from __future__ import annotations

import hashlib
import json
import uuid
from pathlib import Path
from typing import Iterable, Iterator


def sha1(text: str) -> str:
    return hashlib.sha1(text.encode("utf-8")).hexdigest()


def file_sha1(path: Path) -> str:
    h = hashlib.sha1()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def document_id(rel_path: str) -> str:
    """Stable UUIDv5 for a file path, usable as a Qdrant point ID."""
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"proshop-doc::{rel_path}"))


def chunk_id(rel_path: str, chunk_index: int) -> str:
    """Stable UUIDv5 for a chunk inside a file."""
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"proshop-chunk::{rel_path}::{chunk_index}"))


def write_jsonl(path: Path, records: Iterable[dict]) -> int:
    path.parent.mkdir(parents=True, exist_ok=True)
    count = 0
    with path.open("w", encoding="utf-8") as f:
        for record in records:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
            count += 1
    return count


def read_jsonl(path: Path) -> Iterator[dict]:
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                yield json.loads(line)