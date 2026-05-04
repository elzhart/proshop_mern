# proshop-docs MCP server

One-tool MCP server: `search_project_docs(query, top_k)` — hybrid semantic + lexical search over `docs/` in this repo.

Backend: Qdrant collections `proshop_docs_chunks` (364 points, 1024d BGE-M3 dense + sparse + HyDE-questions vector) and `proshop_docs_documents` (49 points), built by `scripts/rag-indexer/`. RRF fusion across the three channels gives multilingual (RU+EN) recall.

## Setup

The server reuses `scripts/rag-indexer/.venv` so the BGE-M3 weights (~2.3 GB) and PyTorch are not duplicated. Just add `fastmcp`:

```bash
cd /path/to/proshop_mern
scripts/rag-indexer/.venv/bin/pip install -r mcp-server-docs/requirements.txt
```

Make sure Qdrant is up:

```bash
docker compose up -d qdrant
```

If you haven't built the index yet, run it once:

```bash
cd scripts/rag-indexer
.venv/bin/python -m rag_indexer all
```

## Register with Claude Code

Already wired in the repo's `.mcp.json` (project scope — committed to git):

```json
{
  "mcpServers": {
    "proshop-docs": {
      "type": "stdio",
      "command": "/Users/arturelzhanov/IdeaProjects/proshop_mern/scripts/rag-indexer/.venv/bin/python",
      "args": [
        "/Users/arturelzhanov/IdeaProjects/proshop_mern/mcp-server-docs/docs_search_server.py"
      ]
    }
  }
}
```

On first launch Claude Code will ask **Approve** for the new server. After that, `search_project_docs` is callable from any session.

For Claude Desktop or Cursor — the same `command`/`args` pair, just placed in their respective config files (`~/Library/Application Support/Claude/claude_desktop_config.json` for Desktop, `~/.cursor/mcp.json` for Cursor).

## Smoke test (without IDE)

```python
import asyncio
from fastmcp import Client
from docs_search_server import mcp

async def main():
    async with Client(mcp) as c:
        r = await c.call_tool(
            "search_project_docs",
            {"query": "Why MongoDB over Postgres?", "top_k": 3},
        )
        for ch in r.data["chunks"]:
            print(f"{ch['score']:.3f}  {ch['file_path']}")

asyncio.run(main())
```

In-memory client — no stdio process is spawned, BGE-M3 loads once.

## Tool contract

`search_project_docs(query: str, top_k: int = 5) -> dict`

Returns `{"query": str, "top_k": int, "chunks": [Chunk, ...]}` where each `Chunk` is:

| field | type | meaning |
|---|---|---|
| `source_file` | str | basename, e.g. `adr-001-mongodb-vs-postgres.md` |
| `file_path` | str | repo-relative path |
| `title` | str | H1 of the source document |
| `parent_headings` | list[str] | breadcrumbs (H1 → H2 → H3) |
| `score` | float | RRF fusion score, comparable within one query |
| `snippet` | str | ~200-char preview of the chunk content |
| `doc_type` | str | adr / api / feature / incident / page / runbook / reference / glossary / history |
| `chunk_id` | str | UUIDv5 of the chunk |
| `document_id` | str | UUIDv5 of the source document |

Error shape: `{"error": CODE, "message": str}` — `INVALID_QUERY`, `INVALID_TOP_K`, `QDRANT_UNAVAILABLE`.

## When to call / when NOT to call

See the docstring of `search_project_docs` in `docs_search_server.py`. Short version:
- **CALL** for any product/architecture/incident/ADR/runbook/glossary/history question. **MUST** be tried before falling back to grep/Read on `docs/`.
- **DO NOT CALL** for live feature-flag state (use `proshop-features` MCP), for reading source code (use Read/grep on `backend/`/`frontend/`), or for generic non-project questions.