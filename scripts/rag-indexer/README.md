# rag-indexer

Pipeline that splits the project documentation under `docs/project-data/`, enriches each chunk with Sonnet, embeds it locally with BGE-M3, and upserts the result into Qdrant.

## Pipeline

```
split  →  enrich  →  embed  →  upsert
chunks    enriched   vectors   Qdrant
.jsonl    .jsonl     .jsonl    (2 collections)
```

Each stage reads the previous stage's artifact from `data/`, so re-running embed/upsert does not re-call the Anthropic API.

## Setup

```bash
cd scripts/rag-indexer

# Python 3.11+ recommended
python3 -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt

# Configure
cp .env.example .env
# then put your real ANTHROPIC_API_KEY into .env
```

The first FastEmbed run downloads the BGE-M3 weights (~2.3 GB) into `~/.cache/fastembed/`.

Make sure Qdrant is running:

```bash
# from repo root
docker compose up -d qdrant
```

## Usage

```bash
# Run the full pipeline
python -m rag_indexer all

# Or individual stages
python -m rag_indexer split
python -m rag_indexer enrich
python -m rag_indexer embed
python -m rag_indexer upsert
```

## Collections

- **`proshop_docs_documents`** — one point per source file. Holds the full document text, title, hash, summary. Used to retrieve a whole document when a chunk hit needs broader context.
- **`proshop_docs_chunks`** — one point per chunk. Three named vectors:
  - `dense` (1024d, cosine) — embedding of `contextual_prefix + content`
  - `sparse` — BGE-M3 lexical weights (token-id → weight)
  - `questions_dense` (1024d, cosine) — embedding of HyDE questions joined with `|`

Both dense and sparse are produced in one pass by `BAAI/bge-m3` via the official `FlagEmbedding` library. On Apple Silicon the model runs on MPS (Metal) in fp16. BGE-M3 does not require any query/passage prefix — feed query text as-is at search time.

Each chunk payload carries `document_id`, `document_title`, `file_path`, `doc_type`, `section_path`, `chunk_index`, `prev_id`, `next_id`, `summary`, `tags`, `questions`, `contextual_prefix`, `content`, `file_hash`, `content_hash`, `updated_at`.

## Incremental updates

`upsert` compares each file's `sha1` to the hash stored on its document point. Unchanged files are skipped. Changed files have their old chunks deleted before new ones are inserted.