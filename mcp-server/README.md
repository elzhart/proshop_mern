# ProShop Feature Flags — MCP Server

MCP server that exposes the project's `features.json` to an AI assistant via three tools.

## Stack choice — FastMCP (Python)

Зафиксировано: **Python + [FastMCP](https://github.com/jlowin/fastmcp) v3.x**.

Почему именно так:
- Декоратор `@mcp.tool()` + аннотации типов — самый короткий путь от нуля до рабочего сервера.
- Docstring функции автоматически становится описанием инструмента для модели — ровно то, что требует mcp-design-principles.md (что делает / когда / формат / примеры / "You MUST").
- Один файл, ~140 строк (из них ~70 — обязательные docstring'и).

## Files

| File | Purpose |
|---|---|
| `feature_flags_server.py` | Single-file MCP server with 3 tools |
| `requirements.txt` | `fastmcp>=3.0` |

## Install & run

```bash
cd mcp-server
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt

# Run over stdio (this is what MCP clients launch)
.venv/bin/python feature_flags_server.py
```

The server reads/writes `../features.json` (relative to its own location). Writes are atomic (temp file + `replace`).

## Tools

### `list_features()`
Returns every flag as a list of `{feature_id, name, status, traffic_percentage, last_modified}`, sorted by `feature_id`. Use it for audits / overviews / when the user does not know the exact id — so the agent does not grep `features.json` directly.

### `get_feature_info(feature_id)`
Returns the full feature object plus a `dependency_states` array with the current status of every dependency. Use it before any write to confirm state and dependency health.

### `set_feature_state(feature_id, state)`
Changes `status` to `Disabled` / `Testing` / `Enabled`. Auto-adjusts `traffic_percentage`:
- `Disabled` → `0`
- `Enabled` → `100`
- `Testing` → keep current if 1..99, else default to `10`

**Hard rule:** cannot promote to `Enabled` while any dependency is `Disabled`. Returns `DEPENDENCY_DISABLED` with a `blocking_dependencies` list.

### `adjust_traffic_rollout(feature_id, percentage)`
Sets `traffic_percentage` to an integer `0..100`. Does not change `status`.

**Hard rule:** if status is `Disabled`, cannot raise `percentage` above `0`. Returns `DISABLED_LOCK`. Use `set_feature_state` first.

All writes update `last_modified` to today (`YYYY-MM-DD`).

## Wire it up

### Claude Code

```bash
claude mcp add proshop-features \
  -- /Users/arturelzhanov/IdeaProjects/proshop_mern/mcp-server/.venv/bin/python \
     /Users/arturelzhanov/IdeaProjects/proshop_mern/mcp-server/feature_flags_server.py
```

Verify: `claude mcp list` should show `proshop-features`. In a chat run `/mcp` to see the three tools.

### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "proshop-features": {
      "command": "/Users/arturelzhanov/IdeaProjects/proshop_mern/mcp-server/.venv/bin/python",
      "args": ["/Users/arturelzhanov/IdeaProjects/proshop_mern/mcp-server/feature_flags_server.py"]
    }
  }
}
```

Restart Claude Desktop. The hammer icon in the chat input shows the tools.

### Cursor

`~/.cursor/mcp.json` (or per-workspace `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "proshop-features": {
      "command": "/Users/arturelzhanov/IdeaProjects/proshop_mern/mcp-server/.venv/bin/python",
      "args": ["/Users/arturelzhanov/IdeaProjects/proshop_mern/mcp-server/feature_flags_server.py"]
    }
  }
}
```

### MCP Inspector (debug UI)

```bash
npx @modelcontextprotocol/inspector \
  /Users/arturelzhanov/IdeaProjects/proshop_mern/mcp-server/.venv/bin/python \
  /Users/arturelzhanov/IdeaProjects/proshop_mern/mcp-server/feature_flags_server.py
```

Open the printed URL — you'll see all three tools and can call them by hand.

## Test scenario

> Проверь состояние фичи `search_v2`. Если она в статусе `Disabled` — переведи в `Testing`. Установи трафик на 25%. Подтверди финальное состояние.

Expected tool-call chain:

1. `get_feature_info("search_v2")` — read current state
2. `set_feature_state("search_v2", "Testing")` *(only if it was Disabled)*
3. `adjust_traffic_rollout("search_v2", 25)` — set to 25%
4. `get_feature_info("search_v2")` — confirm

## Smoke test (no IDE needed)

```bash
.venv/bin/python -c "
import asyncio
from fastmcp import Client
from feature_flags_server import mcp

async def main():
    async with Client(mcp) as c:
        print(await c.call_tool('get_feature_info', {'feature_id': 'search_v2'}))
        print(await c.call_tool('set_feature_state', {'feature_id': 'search_v2', 'state': 'Testing'}))
        print(await c.call_tool('adjust_traffic_rollout', {'feature_id': 'search_v2', 'percentage': 25}))
        print(await c.call_tool('get_feature_info', {'feature_id': 'search_v2'}))

asyncio.run(main())
"
```

## Validated edge cases

| Case | Tool | Returns |
|---|---|---|
| Unknown flag | any | `FEATURE_NOT_FOUND` |
| Bad state string | `set_feature_state` | `INVALID_STATE` |
| Promote with `Disabled` dep | `set_feature_state` Enabled | `DEPENDENCY_DISABLED` + `blocking_dependencies` |
| `percentage > 0` on Disabled | `adjust_traffic_rollout` | `DISABLED_LOCK` |
| Non-int / out-of-range pct | `adjust_traffic_rollout` | `INVALID_PERCENTAGE` |