# Project Report

## Tooling & Workflow

**Primary IDE: Claude Code CLI**
All development tasks in this session were performed using [Claude Code](https://claude.ai/code) as the primary IDE — writing code, running commands, debugging startup issues, and generating project documentation.

Project documentation: [CLAUDE.md](./CLAUDE.md)

**Code viewer: WebStorm**
WebStorm (JetBrains) was used alongside Claude Code as a familiar environment for browsing and reviewing results. Preferred due to background as a Java developer accustomed to the JetBrains ecosystem.

**External tool: ChatGPT (OpenAI)**
ChatGPT was used to assist with correctly setting up a PayPal developer/sandbox account required for the payment integration in this project.

**Local run confirmed:** проект запущен локально через `docker compose up -d` (MongoDB) + `npm run dev` (backend :5001, frontend :3000).

---

## Rules Diff

What was added to `CLAUDE.md` beyond the auto-generated content, and why:

- **Critical Flows** — explicitly called out that Checkout (Cart → Shipping → Payment → PlaceOrder → Order) and Auth (Login → JWT → Protected Routes) must not break, and require manual validation if touched. Auto-generated docs described *what* they are, but not that they are high-risk change zones.

- **PR & Commit Conventions** — added `feat/fix/refactor` naming and the rule "one PR = one logical change". Keeps the git history readable and avoids mixing unrelated changes in the same diff.

- **Decision Rules** — instructed Claude to prefer the smallest possible diff and reuse existing patterns (Redux, routes, controllers) rather than introducing new abstractions. Important for a legacy codebase where consistency matters more than cleverness.

- **Self-Check Checklist** — a pre-answer checklist (checkout flow, auth/JWT, DB reseed, frontend compile, API contracts). Reduces the chance of Claude producing a correct-looking answer that silently breaks an adjacent flow.

- **Known Gotchas (expanded)** — added explicit project-specific traps: reseed DB after schema changes, clearing localStorage after auth state changes, PayPal sandbox-only rule, file uploads not being persistent in production. These are non-obvious from reading the code and are the most common sources of silent bugs in this stack.

---

## M3

### Feature flags MCP

Задача: проверить состояние фичи `search_v2`; если она в `Disabled` — перевести в `Testing`; установить трафик 25%; подтвердить финальное состояние.

Использованный MCP-сервер: `proshop-features`.

#### Шаг 1 — чтение текущего состояния

Tool call: `mcp__proshop-features__get_feature_info`
Аргументы:
```json
{ "feature_id": "search_v2" }
```
Ответ MCP:
```json
{
  "feature_id": "search_v2",
  "name": "New Search Algorithm",
  "status": "Testing",
  "traffic_percentage": 15,
  "last_modified": "2026-03-10",
  "targeted_segments": ["beta_users", "internal"],
  "rollout_strategy": "canary",
  "dependency_states": []
}
```

Вывод: фича уже в статусе `Testing`, не `Disabled` — шаг `set_feature_state(Testing)` пропускается по условию задачи. Нужен только апдейт трафика 15% → 25%.

#### Шаг 2 — изменение трафика

Tool call: `mcp__proshop-features__adjust_traffic_rollout`
Аргументы:
```json
{ "feature_id": "search_v2", "percentage": 25 }
```
Ответ MCP:
```json
{
  "feature_id": "search_v2",
  "name": "New Search Algorithm",
  "status": "Testing",
  "traffic_percentage": 25,
  "last_modified": "2026-05-03",
  "targeted_segments": ["beta_users", "internal"],
  "rollout_strategy": "canary"
}
```

#### Шаг 3 — подтверждение финального состояния

Tool call: `mcp__proshop-features__get_feature_info`
Аргументы:
```json
{ "feature_id": "search_v2" }
```
Ответ MCP:
```json
{
  "feature_id": "search_v2",
  "name": "New Search Algorithm",
  "status": "Testing",
  "traffic_percentage": 25,
  "last_modified": "2026-05-03",
  "targeted_segments": ["beta_users", "internal"],
  "rollout_strategy": "canary",
  "dependency_states": []
}
```

#### Итоговое состояние `search_v2`

| Поле | Значение |
|---|---|
| feature_id | search_v2 |
| name | New Search Algorithm |
| status | Testing |
| traffic_percentage | 25% |
| last_modified | 2026-05-03 |
| targeted_segments | beta_users, internal |
| rollout_strategy | canary |
| dependency_states | — (пусто) |

Изменения: `traffic_percentage` 15 → 25, `last_modified` 2026-03-10 → 2026-05-03. Статус не менялся.