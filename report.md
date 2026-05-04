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

---

### Как был сделан MCP-сервер (how-to для повтора)

Этот раздел — пошаговый референс для повторения в других проектах. Кто-то с другим feature-store или с другим конфиг-файлом сможет повторить, поменяв только пути и схему.

#### 1. Выбор стека: FastMCP (Python)

| Что | Почему |
|---|---|
| **FastMCP v3** (`pip install fastmcp`) | Декоратор `@mcp.tool()` + аннотации типов = самый короткий путь от нуля до рабочего сервера. Один файл — целый сервер. |
| **Python 3.12** | Совместим с FastMCP. На macOS — через системный `python3` + venv. |
| **stdio transport** | Дефолт для MCP. Клиенты (Claude Code, Claude Desktop, Cursor) запускают сервер как subprocess и общаются через stdin/stdout. Никаких портов. |

Альтернатива была — TypeScript SDK + Zod. Она хороша, если основной стек проекта на JS/TS. Тут проект MERN, но MCP-сервер живёт обособленно — в собственной venv, ему не нужен node_modules фронта/бэка. Поэтому Python проще.

#### 2. Структура файлов

```
proshop_mern/
├── features.json                    # источник данных (читает/пишет сервер)
├── features-descriptions.json       # доп. описания (read-only для UI)
├── .mcp.json                        # project-scoped MCP config — попадает в git
└── mcp-server/
    ├── feature_flags_server.py      # сам сервер: ~140 строк (≈70 кода + 70 docstrings)
    ├── requirements.txt             # одна строка: fastmcp>=3.0
    ├── README.md                    # инструкции подключения
    ├── .gitignore                   # .venv/, __pycache__/
    └── .venv/                       # локальное окружение (не в git)
```

#### 3. Минимальный шаблон сервера

```python
from datetime import date
from pathlib import Path
import json
from fastmcp import FastMCP

DATA_PATH = Path(__file__).resolve().parent.parent / "features.json"
mcp = FastMCP("proshop-feature-flags")

def _load() -> dict:
    return json.loads(DATA_PATH.read_text())

def _save(data: dict) -> None:                 # атомарная запись
    tmp = DATA_PATH.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(data, indent=2) + "\n")
    tmp.replace(DATA_PATH)

@mcp.tool()
def get_feature_info(feature_id: str) -> dict:
    """Что делает / WHEN TO CALL / WHEN NOT TO CALL / Args / Returns / Examples."""
    ...

if __name__ == "__main__":
    mcp.run()
```

Главное:
- Путь к данным — относительно `__file__`, чтобы сервер запускался из любой cwd.
- `_save` пишет в `tmp` и `replace` — атомарность на уровне POSIX.
- Декоратор `@mcp.tool()` сам читает docstring как описание для модели.

#### 4. Четыре tool'а — что и зачем

| Tool | Назначение | Hard rule |
|---|---|---|
| `list_features()` | обзор всех флагов одним списком (id, name, status, %, last_modified). Без него агент идёт grep'ать `features.json`. | — |
| `get_feature_info(id)` | полный объект флага + статусы зависимостей (`dependency_states`). | — |
| `set_feature_state(id, state)` | смена `status` + авто-коррекция `traffic_percentage` (Disabled→0, Enabled→100, Testing→keep 1..99 или дефолт 10). | **You MUST NOT** включить (`Enabled`), пока хотя бы одна dependency в `Disabled` → `DEPENDENCY_DISABLED` + список блокеров. |
| `adjust_traffic_rollout(id, percentage)` | сдвиг `traffic_percentage` ∈ [0..100] без смены статуса. | **You MUST NOT** поднять percentage выше 0 при `status=Disabled` → `DISABLED_LOCK`. |

Каждая запись обновляет `last_modified` на сегодняшнюю дату.

#### 5. Описания tools (по mcp-design-principles.md)

Docstring каждого tool'а содержит обязательные блоки:

```
Что делает (одна строка).

WHEN TO CALL: ... — критерии вызова.
WHEN NOT TO CALL: ... — анти-кейсы (чтобы не путали с соседним tool'ом).

HARD RULE — You MUST ... — императив для критичных ограничений.

Args: name: type — описание.
Returns: dict с такими-то ключами. Errors: список error-кодов.

Examples:
  tool_name(arg1, arg2)  # короткий комментарий
```

Это то, что модель **видит вместо документации**. Если в docstring чётко перечислены WHEN TO CALL / WHEN NOT TO CALL и приведены примеры — агент сам выстраивает корректную цепочку tool calls без подсказок в системном промпте.

#### 6. Валидация — error codes как контракт

Возврат `{"error": CODE, "message": ..., ...}` вместо raise. Коды:

- `FEATURE_NOT_FOUND` — нет такого ключа в JSON
- `INVALID_STATE` — state не из `Disabled|Testing|Enabled` (case-sensitive)
- `INVALID_PERCENTAGE` — не int или вне [0..100]
- `DEPENDENCY_DISABLED` — попытка `Enable` с заблокированной зависимостью (+ `blocking_dependencies: [...]`)
- `DISABLED_LOCK` — попытка `percentage > 0` на Disabled-флаге

Модель видит коды и сама понимает, что делать дальше: `DEPENDENCY_DISABLED` → включить зависимость → ретрай. `DISABLED_LOCK` → вызвать `set_feature_state` сначала.

#### 7. Подключение к Claude Code: `.mcp.json` (project scope)

В корне репозитория:

```json
{
  "mcpServers": {
    "proshop-features": {
      "type": "stdio",
      "command": "/abs/path/to/proshop_mern/mcp-server/.venv/bin/python",
      "args": ["/abs/path/to/proshop_mern/mcp-server/feature_flags_server.py"]
    }
  }
}
```

Project-scope — конфиг идёт в git, любой кто склонирует репо подхватит сервер. Claude Code при первом запуске спросит **Approve** для нового сервера (security guard).

Альтернативы:
- **User scope** — `claude mcp add ... --scope user` (доступно во всех проектах юзера, не в git'е)
- **Local scope** — `--scope local` (только текущий проект, не в git'е)

#### 8. Smoke-test без IDE

Полезно прогнать сразу после написания, до подключения к клиенту:

```python
import asyncio
from fastmcp import Client
from feature_flags_server import mcp

async def main():
    async with Client(mcp) as c:
        tools = await c.list_tools()
        print("tools:", [t.name for t in tools])
        r = await c.call_tool("get_feature_info", {"feature_id": "search_v2"})
        print(r.data)

asyncio.run(main())
```

`fastmcp.Client(mcp)` подключается к серверу in-memory — без подъёма stdio-процесса. Идеально для CI и regression-проверок: смог бы быстро прогнать все error-paths (`INVALID_STATE`, `DEPENDENCY_DISABLED`, `DISABLED_LOCK`) программно.

#### 9. Runtime-интеграция флагов в продукт (опциональная, но логичная)

Чтобы изменение флага через MCP **немедленно** меняло поведение приложения, в проекте сделано:

| Слой | Что |
|---|---|
| **Backend** | `GET /api/features` (snapshot), `GET /api/features/stream` (SSE с `fs.watchFile`), `GET /api/features/descriptions` (статичный файл с расширенными метаданными). Атомарная запись MCP'ом → `fs.watchFile` ловит изменение → SSE пушит новый snapshot всем клиентам. |
| **nodemon.json** | `"ignore": ["features.json"]` — иначе nodemon перезапускает Express при каждой записи MCP, и SSE-соединения рвутся. |
| **Frontend** | `FeaturesProvider` (Context + EventSource подписка), хук `useFeature(id)` с семплингом по `traffic_percentage` и стабильным bucket 0..99 в localStorage. `Enabled` → всегда; `Testing` → `bucket < traffic_percentage`; `Disabled` → никогда. |
| **Wired фичи** | 3 примера реальной интеграции: `image_lazy_loading` (атрибут `loading` на `<img>`), `paypal_express_buttons` (kill switch для PayPal-кнопки), `product_recommendations` (секция «Customers also bought»). |
| **UI-дашборд** | `/dashboard-features` — live-таблица с прогресс-барами, бейджами, **колонкой «For me»** (показывает результат семплинга для текущего bucket'а) и popover с расширенным описанием из `features-descriptions.json`. |

Эта обвязка не требуется самим MCP-сервером, но даёт видимый эффект: меняешь флаг через `mcp__proshop-features__adjust_traffic_rollout` → ProgressBar в браузере ползёт без F5.

#### 10. Чек-лист для повторения в новом проекте

1. `mkdir mcp-server && cd mcp-server && python3 -m venv .venv && .venv/bin/pip install fastmcp`
2. Написать сервер по шаблону §3, заменив схему данных на свою.
3. Описать каждый tool по схеме §5 (WHEN TO CALL / WHEN NOT TO / HARD RULE / examples).
4. Закодировать error-codes по §6 — модели проще ретраиться по коду, чем по тексту.
5. Прогнать smoke-test §8 — должно пройти **до** подключения к IDE.
6. Создать `.mcp.json` в корне (§7), перезапустить Claude Code, нажать Approve.
7. (Опц.) Сделать runtime-обвязку §9, если хочется live-эффекта в продукте.

Полный код этого сервера — в [`mcp-server/feature_flags_server.py`](./mcp-server/feature_flags_server.py), README с конфигами для Claude Desktop/Cursor/Inspector — в [`mcp-server/README.md`](./mcp-server/README.md).

---

### Search-docs MCP

Прогон трёх вопросов через `mcp__search-docs__search_project_docs` (BGE-M3 dense + sparse + HyDE-questions, RRF fusion, индекс — 364 чанка / 49 документов на 2026-05-04). Запросы шли в Claude Code MCP-клиента, без префиксов и без ручного fallback на `grep`/`Read`.

#### Q1 — «Какая БД используется и почему?»

**Запрос:** `Какая БД используется в проекте и почему её выбрали?` (`top_k=5`)

**Top-K чанков (id / score / source_file / фрагмент):**

| # | score | source_file | chunk_id (head) | snippet |
|---|-------|-------------|-----------------|---------|
| 1 | 1.000 | `adr-001-mongodb-vs-postgres.md` | `1ffb5b70…` | «# ADR-001: Use MongoDB (via Mongoose) as the Primary Database. **Status:** Accepted. **Date:** 2023-01-10. … Before the f…» |
| 2 | 0.533 | `adr-001-mongodb-vs-postgres.md` | `cc363d0e…` | «## Alternatives Considered ### PostgreSQL (with Sequelize or Prisma ORM) — full ACID, multi-table tx…» |
| 3 | 0.500 | `dev-history.md` | `cf680da2…` | «### Decision 1: MongoDB over PostgreSQL. Made in January 2023 … product catalog has variable attributes (electronics have wattage/vol…)» |
| 4 | 0.500 | `features/admin.md` | `5173be53…` | (нерелевантно — про edge case в admin) |
| 5 | 0.333 | `features/payments.md` | `0a58614b…` | (нерелевантно — про PayPal config endpoint) |

**Как сформулирован ответ:** релевантны #1–#3, причём #1 и #2 — головной чанк ADR-001 и блок «Alternatives Considered» того же ADR; #3 — пересказ решения в `dev-history.md`. Они дают цепочку «что выбрали → что отвергли → почему именно так в январе 2023». #4 и #5 я отбросил как шум (нерелевантные совпадения по слову «БД»/payments).

**Ответ:** в `proshop_mern` используется **MongoDB** (через ODM **Mongoose 5**) — решение зафиксировано в ADR-001 от 2023-01-10. Причины:
- каталог товаров электроники имеет переменный набор атрибутов (wattage / volume / совместимость), под которые гибкая document-схема Mongo подходит лучше реляционной;
- стандартный MERN-стек: команда уже владела Mongoose, не нужен дополнительный ORM (Sequelize/Prisma) и DBA-экспертиза;
- быстрый старт прототипа важнее многотабличных транзакций — финансовые расчёты делаются на сервере при создании заказа, а не разнесены по нескольким таблицам.
PostgreSQL рассматривался (ACID, joins, мощные миграции) и был отвергнут как «слишком тяжёлый для скорости итераций на момент старта».

#### Q2 — «Какие фичи зависят от `semantic_search`?»

**Запрос 1:** `какие фичи зависят от semantic_search dependencies` (`top_k=6`)

| # | score | source_file | chunk_id (head) | snippet |
|---|-------|-------------|-----------------|---------|
| 1 | 1.500 | `feature-flags-spec.md` | `5e69abee…` | «### Search & Discovery → `search_v2` — New Search Algorithm. **Default state:** Testing (15%). … MongoDB `$regex` …» |
| 2 | 0.917 | `feature-flags-spec.md` | `96c956db…` | «**System impact:** новый backend route `/api/products/suggest`, минорное расширение `SearchBox` … No DB schema changes.» |
| 3 | 0.476 | `features/catalog.md` | `b63eceeb…` | (нерелевантно — про reviews dependencies) |
| 4 | 0.417 | `feature-flags-spec.md` | `11e6f180…` | (Optional Fields в формате `features.json`) |
| 5 | 0.400 | `feature-flags-spec.md` | `6a07bdb3…` | (контракт `set_feature_state`) |
| 6 | 0.321 | `features/catalog.md` | `993964da…` | (edge cases поиска) |

**Запрос 2 (профиль самой фичи):** `Semantic Vector Search embedding cosine similarity natural-language queries headphones` (`top_k=5`)

| # | score | source_file | chunk_id (head) | snippet |
|---|-------|-------------|-----------------|---------|
| 1 | 1.500 | `feature-flags-spec.md` | `5e69abee…` | тот же блок Search & Discovery (включает описание `search_v2` — обязательной зависимости `semantic_search`) |
| 2 | 0.917 | `api/products.md` | `939e9e3e…` | «GET /api/products — keyword search filtering, MongoDB regex текущий бэкенд…» |
| 3 | 0.694 | `best-practices.md` | `20ca1e40…` | (нерелевантно — про embed vs reference в Mongoose) |
| 4 | 0.450 | `api/products.md` | `f23d23a5…` | (GET /api/products/:id) |
| 5 | 0.388 | `features/catalog.md` | `1685e6ce…` | «Feature 2: Product Search — Полнотекстовый поиск по названию через URL-параметр…» |

**Кросс-проверка через feature-flags MCP:**

```
mcp__feature-flags__get_feature_info(feature_id="semantic_search")
```
→ `dependencies: ["search_v2"]`, `dependency_states: [{feature_id: "search_v2", status: "Testing"}]`.

`list_features()` → ни в одной из 25 записей `dependencies` не упоминается `semantic_search` (т. е. обратных зависимостей нет).

**Как сформулирован ответ:** оба поиска поднимают чанк `5e69abee…` (Search & Discovery) — это родительский раздел, в котором `semantic_search` описан рядом с `search_v2`. Прямого вопроса «кто зависит ОТ semantic_search» в RAG-чанках нет, потому что обратных зависимостей **нет** ни в каталоге, ни в `features.json`. Зато явно зафиксирована прямая (forward) зависимость: `semantic_search → search_v2`, и это подтвердил MCP через `dependency_states`.

**Ответ:** **ни одна фича в `features.json` не объявляет `semantic_search` в своём `dependencies`** — обратных зависимостей нет (проверено `list_features()` — все 25 записей просканированы). Сама `semantic_search` зависит от `search_v2` («Requires search_v2 to be Enabled first» — из описания фичи). На текущий момент `search_v2` находится в `Testing`, поэтому переключать `semantic_search` в `Testing` MCP позволяет; но повышать до `Enabled` MCP заблокирует (`DEPENDENCY_DISABLED`), пока `search_v2` сам не будет `Enabled`.

#### Q3 — «Что случилось во время последнего incident с checkout?»

**Запрос 1:** `последний инцидент checkout что произошло` (`top_k=6`)

| # | score | source_file | chunk_id (head) | snippet |
|---|-------|-------------|-----------------|---------|
| 1 | 0.631 | `runbooks/incident-response.md` | `e691b448…` | postmortem-шаблон («PayPal Payment Processor Outage», **Date: 2024-04-15** — это пример внутри runbook’а, не реальный инцидент) |
| 2 | 0.600 | `incidents/i-001-paypal-double-charge.md` | `e7a75207…` | «# Incident i-001: PayPal Sandbox Webhook Double-Charge. **Severity:** P1. **Date detected:** 2023-11-04…» |
| 3 | 0.569 | `runbooks/incident-response.md` | `2449021c…` | (шаблон customer-communication письма) |
| 4 | 0.567 | `features/checkout.md` | `c077ede8…` | «## Feature 4: Order Review & Place Order — финальный шаг checkout…» |
| 5 | 0.381 | `feature-flags-spec.md` | `22dd4971…` | флаг `express_checkout` |
| 6 | 0.357 | `features/checkout.md` | `6d61f693…` | (edge cases checkout) |

**Запрос 2 (уточнение по списку инцидентов):** `incidents list даты все инциденты checkout PayPal Mongo JWT` (`top_k=8`)

| # | score | source_file | chunk_id (head) | snippet |
|---|-------|-------------|-----------------|---------|
| 1 | 1.250 | `incidents/i-003-jwt-secret-leak.md` | `016e0a9b…` | «## Exposed Credentials. JWT_SECRET, MONGO_URI…» |
| 2 | 0.893 | `incidents/i-003-jwt-secret-leak.md` | `12355559…` | «# Incident i-003: JWT Secret Committed to Git Repository. **Severity:** P1. **Date detected:** 2024-07-18…» |
| 3 | 0.700 | `runbooks/incident-response.md` | `e691b448…` | (тот же postmortem-шаблон) |
| 4 | 0.483 | `dev-history.md` | `aead8b2e…` | «### v2.0 — Security Hardening Release (2024-08-12) — helmet.js, rate-limit, cors lockdown…» |
| 5 | 0.417 | `incidents/i-001-paypal-double-charge.md` | `e7a75207…` | (header i-001) |
| 6 | 0.417 | `incidents/i-001-paypal-double-charge.md` | `e45e3cec…` | (timeline i-001) |
| 7 | 0.343 | `best-practices.md` | `921c9a86…` | (refs про PayPal webhooks) |
| 8 | 0.292 | `incidents/i-001-paypal-double-charge.md` | `723575f1…` | «## Impact — 7 orders с дублированными paymentResult, 3 продукта с countInStock ниже фактического…» |

**Запрос 3 (детали i-002):** `i-002 Mongo connection pool exhaustion checkout заказы не создавались` (`top_k=6`)

| # | score | source_file | chunk_id (head) | snippet |
|---|-------|-------------|-----------------|---------|
| 1 | 1.167 | `incidents/i-002-mongo-connection-pool-exhaustion.md` | `c55a4b9c…` | «## Timeline. 2023-11-24 08:00 — Black Friday sale begins; marketing email sent to ~1,200 subscribers…» |
| 2 | 1.167 | `incidents/i-002-mongo-connection-pool-exhaustion.md` | `e2c8f364…` | «# Incident i-002: MongoDB Connection Pool Exhaustion — Black Friday 2023. **Severity:** P0. Detected 2023-11-24 08:47 UTC…» |
| 3 | 0.700 | `incidents/i-002-mongo-connection-pool-exhaustion.md` | `5dd8151f…` | «## Impact. Downtime: 2h 43m (08:47–11:30 UTC), full 500 на всех роутах. ~340 уникальных сессий…» |
| 4 | 0.593 | `incidents/i-002-mongo-connection-pool-exhaustion.md` | `281b9e50…` | «## Resolution. Mongoose maxPoolSize=25; Atlas M2 → M10 (dedicated)…» |
| 5 | 0.583 | `incidents/i-002-mongo-connection-pool-exhaustion.md` | `48fba953…` | «## Lessons. Load testing — 20-минутный k6 при 50 RPS поймал бы лимит за 90с…» |
| 6 | 0.435 | `incidents/i-002-mongo-connection-pool-exhaustion.md` | `8f7b4e0f…` | «### Request anatomy: каждый product page = 3 sequential queries (findById, find by category, отзывы)…» |

**Как сформулирован ответ:** в индексе три инцидента — `i-001` (2023-11-04, PayPal double-charge), `i-002` (2023-11-24, Mongo pool, Black Friday), `i-003` (2024-07-18, JWT leak). Самый поздний по дате — `i-003`, но он про утечку секрета в git и checkout не ломает. **Самый последний инцидент, прямо затрагивающий checkout** — это `i-002`: при пике Black Friday Mongoose `maxPoolSize` (default 5) исчерпался, все роуты, включая `POST /api/orders` и PayPal-платежи, отдавали 500 в течение 2ч 43м. Postmortem-шаблон в `incident-response.md` (date 2024-04-15) — это **пример внутри runbook’а**, а не реальный инцидент; индексатор честно отдал его как top-1 по тексту, но я отбросил по контексту (это шаблон, не файл из `incidents/`).

**Ответ:** последний инцидент, ломавший checkout — **i-002 «MongoDB Connection Pool Exhaustion — Black Friday 2023»** (2023-11-24, severity **P0**). Маркетинговая рассылка по ~1 200 подписчикам в 08:00 UTC подняла RPS с базовых ~5 до пиковых ~80. Каждый product-page issue’ил 3 последовательных запроса в Mongo, и при `maxPoolSize=5` (default Mongoose) пул мгновенно исчерпался → таймауты `MongooseServerSelectionError` → весь сервис отвечал 500 на любом роуте, включая `POST /api/orders` (создание заказа) и PayPal-платежи. Downtime 08:47–11:30 UTC = **2 часа 43 минуты**, ~340 уникальных пользовательских сессий получили ошибку, заказы за окно создать было невозможно. Резолюция: hot-fix `maxPoolSize=25` через env, апгрейд Atlas M2 (shared) → M10 (dedicated), плюс урок про обязательный k6-нагрузочный прогон перед любым маркетинг-эвентом. Ранее (2023-11-04) был `i-001` PayPal sandbox double-charge — тоже про checkout, но более ранний; и позже (2024-07-18) был `i-003` JWT secret leak — security-инцидент, на checkout не влиял.

---

### End-to-end

Сценарий, который связывает оба MCP в одну цепочку, прогнан на реально существующей в `features.json` фиче **`semantic_search`**: «найди в документации фичу и её зависимости (search-docs) → проверь рантайм-состояние (feature-flags) → если она в `Disabled` и зависимости не в `Disabled`, переведи в `Testing` 25% → процитируй из доки, зачем она нужна». Запись в `features.json` шла только через MCP — никаких ручных правок ни в документации, ни в `features.json`.

#### Шаг 1 — поиск описания фичи и её зависимостей (search-docs MCP)

**Call 1.**
```
mcp__search-docs__search_project_docs(
    query="semantic_search feature flag описание зависимости что это",
    top_k=8
)
```

Top-K (выборка):

| # | score | source_file | chunk_id (head) | snippet |
|---|-------|-------------|-----------------|---------|
| 1 | 1.091 | `feature-flags-spec.md` | `5e69abee…` | «### Search & Discovery → `search_v2` — New Search Algorithm. **Default state:** Testing (15%). MongoDB `$regex` …» |
| 2 | 0.700 | `feature-flags-spec.md` | `96c956db…` | «**System impact:** новый backend route `/api/products/suggest`, минорное расширение `SearchBox` …» |
| 3 | 0.667 | `glossary.md` | `122f264e…` | «### Feature Flag — boolean/percentage toggle …» |
| 4 | 0.605 | `feature-flags-spec.md` | `11e6f180…` | (Optional Fields в `features.json`) |
| 5 | 0.488 | `feature-flags-spec.md` | `ab9ab215…` | (контракт `get_feature_info`) |
| 6 | 0.429 | `feature-flags-spec.md` | `6a07bdb3…` | (контракт `set_feature_state`) |
| 7 | 0.400 | `runbooks/feature-flag-toggle.md` | `5f26a9d5…` | «Pre-Rollout Preparation → Code Implementation — flag-protected old/new path …» |
| 8 | 0.302 | `best-practices.md` | `df2b1b49…` | «8.5 Kill switches — каждая значимая фича едет с kill switch …» |

**Call 2 (профиль самой фичи).**
```
mcp__search-docs__search_project_docs(
    query="Semantic Vector Search embedding cosine similarity natural-language queries headphones",
    top_k=5
)
```

| # | score | source_file | chunk_id (head) | snippet |
|---|-------|-------------|-----------------|---------|
| 1 | 1.500 | `feature-flags-spec.md` | `5e69abee…` | тот же раздел Search & Discovery (родитель `semantic_search` и `search_v2`) |
| 2 | 0.917 | `api/products.md` | `939e9e3e…` | «GET /api/products — keyword search через MongoDB regex …» |
| 3 | 0.694 | `best-practices.md` | `20ca1e40…` | (нерелевантно — Embed vs reference) |
| 4 | 0.450 | `api/products.md` | `f23d23a5…` | (GET /api/products/:id) |
| 5 | 0.388 | `features/catalog.md` | `1685e6ce…` | «Feature 2: Product Search — полнотекстовый поиск по URL-параметру …» |

**Промежуточный вывод по docs.** Раздел Search & Discovery в `feature-flags-spec.md` содержит и `search_v2`, и `semantic_search` в одном чанке — описание фичи и её прямой зависимости (`semantic_search → search_v2`) формально зафиксировано в каталоге, плюс runbook `feature-flag-toggle.md` подсказывает шаблон canary-выкатки.

#### Шаг 2 — проверка рантайм-состояния (feature-flags MCP)

**Call 3.**
```
mcp__feature-flags__get_feature_info(feature_id="semantic_search")
```

**Ответ MCP (initial):**
```json
{
  "feature_id": "semantic_search",
  "name": "Semantic Vector Search",
  "description": "Augments keyword search with embedding-based semantic similarity. Products are encoded at index time; queries are embedded at runtime and matched via cosine similarity. Requires search_v2 to be Enabled first. Significantly improves discovery for natural-language queries like 'good headphones for running'.",
  "status": "Disabled",
  "traffic_percentage": 0,
  "last_modified": "2026-02-14",
  "targeted_segments": ["internal"],
  "rollout_strategy": "canary",
  "dependencies": ["search_v2"],
  "dependency_states": [{"feature_id": "search_v2", "status": "Testing"}]
}
```

**Проверка предусловия:**
- `status == "Disabled"` ✅
- `dependencies == ["search_v2"]`; `search_v2.status == "Testing"` (не `Disabled`) ✅

Оба условия из задачи выполнены — можно делать переход в `Testing 25%`.

#### Шаг 3 — переход в Testing и установка трафика 25%

**Call 4.**
```
mcp__feature-flags__set_feature_state(feature_id="semantic_search", state="Testing")
```

**Ответ MCP:**
```json
{
  "feature_id": "semantic_search",
  "status": "Testing",
  "traffic_percentage": 10,
  "last_modified": "2026-05-04",
  "dependencies": ["search_v2"],
  "dependency_states": [{"feature_id": "search_v2", "status": "Testing"}]
}
```

Сервер при `Disabled → Testing` поднимает `traffic_percentage` до канонического дефолта **10%** (по контракту `set_feature_state`). Это ещё не целевые 25% — нужен второй вызов.

**Call 5.**
```
mcp__feature-flags__adjust_traffic_rollout(feature_id="semantic_search", percentage=25)
```

**Ответ MCP:**
```json
{
  "feature_id": "semantic_search",
  "status": "Testing",
  "traffic_percentage": 25,
  "last_modified": "2026-05-04",
  "dependencies": ["search_v2"]
}
```

`DISABLED_LOCK` не сработал, потому что фича уже в `Testing`. Трафик зафиксирован на 25%, `last_modified` обновлён.

**Call 6 — финальный snapshot.**
```
mcp__feature-flags__get_feature_info(feature_id="semantic_search")
```

```json
{
  "feature_id": "semantic_search",
  "name": "Semantic Vector Search",
  "status": "Testing",
  "traffic_percentage": 25,
  "last_modified": "2026-05-04",
  "targeted_segments": ["internal"],
  "rollout_strategy": "canary",
  "dependencies": ["search_v2"],
  "dependency_states": [{"feature_id": "search_v2", "status": "Testing"}]
}
```

#### Шаг 4 — цитата из документации, зачем нужна фича

**Цитата 1 — описание `semantic_search` через `get_feature_info` (источник: `features.json`, индексируется и в `feature-flags-spec.md` секция Search & Discovery):**

> *“Augments keyword search with embedding-based semantic similarity. Products are encoded at index time; queries are embedded at runtime and matched via cosine similarity. **Requires `search_v2` to be Enabled first.** Significantly improves discovery for natural-language queries like ‘good headphones for running’.”*

**Цитата 2 — Search & Discovery из `docs/project-data/feature-flags-spec.md` (chunk `5e69abee…`, score 1.500):**

> *“The current product search in `productController.getProducts` uses MongoDB `$regex` on the product `name` field. `search_v2` replaces this with a hybrid BM25 + TF-IDF ranking pipeline that improves relevance for multi-word queries and handles common misspellings via fuzzy matching.”*

`semantic_search` — следующая ступень: над уже улучшенным BM25+TF-IDF (это `search_v2`) добавляется vector-similarity слой, который ловит запросы вроде «good headphones for running», где керword-маткинг даёт нулевой результат. Поэтому в `dependencies` именно `search_v2`: без современной keyword-инфраструктуры embedding-слой нечего «дополнять».

#### Итоговое состояние `semantic_search`

| Поле | Было (initial) | Стало (final) |
|---|---|---|
| `status` | `Disabled` | **`Testing`** |
| `traffic_percentage` | `0` | **`25`** |
| `last_modified` | `2026-02-14` | **`2026-05-04`** |
| `dependencies` | `["search_v2"]` | `["search_v2"]` |
| `dependency_states` | `[{search_v2: Testing}]` | `[{search_v2: Testing}]` |

**Что писалось в `features.json`:** две атомарные записи MCP — `set_feature_state` и `adjust_traffic_rollout`, обе подтверждены финальным `get_feature_info`. Никаких ручных `Edit`/`Write` по файлу не делал.

**Цепочка tool calls (по порядку):**

1. `search_project_docs("semantic_search feature flag описание зависимости что это", top_k=8)` → top-1 — раздел Search & Discovery с `search_v2`/`semantic_search`
2. `search_project_docs("Semantic Vector Search embedding cosine similarity natural-language queries headphones", top_k=5)` → подтверждение того же чанка
3. `get_feature_info("semantic_search")` → `Disabled`, `0%`, `deps=[search_v2: Testing]` → предусловие выполнено
4. `set_feature_state("semantic_search", "Testing")` → `Testing 10%`
5. `adjust_traffic_rollout("semantic_search", 25)` → `Testing 25%`
6. `get_feature_info("semantic_search")` → финальный snapshot: `Testing 25%`, `last_modified=2026-05-04`

---

Прогон через `python -m rag_indexer query` поверх индекса:
- 41 документ из `docs/project-data/` → 330 чанков
- BGE-M3 (dense + sparse), questions_dense, RRF fusion, `--k 3`

**Артефакты индексации (приложены к отчёту):**
- [`report-artifacts/chunks-enriched.jsonl`](./report-artifacts/chunks-enriched.jsonl) — 364 чанка после Sonnet-обогащения, 1.1 МБ. Каждая строка содержит `chunk_id`, `document_id`, `file_path`, `doc_type`, `section_path`, `content`, `summary`, `questions` (HyDE), `tags` (RU+EN), `contextual_prefix`, `prev_id`/`next_id`, `chunk_index`/`total_chunks`, хеши и токены.
- [`report-artifacts/documents.jsonl`](./report-artifacts/documents.jsonl) — 49 исходных документов с `full_text` целиком, 458 КБ.

Это финальное состояние после расширения `DOCS_ROOTS` на `docs/adr/` (см. секцию ниже): 49 документов / 364 чанка. Числа 41 / 330 ниже — снимок до этого расширения.

### Q1 — `Какая БД используется в proshop_mern и почему именно она?`

**Команда:**
```bash
python -m rag_indexer query "Какая БД используется в proshop_mern и почему именно она?" --k 3
```

**Top-3:**

| # | score | source_file | section |
|---|---|---|---|
| 1 | 1.1429 | `docs/project-data/best-practices.md` | `> 1. Introduction: Why proshop_mern Is Deprecated` |
| 2 | 0.6762 | `docs/project-data/best-practices.md` | (root H1) |
| 3 | 0.6429 | `docs/project-data/dev-history.md` | `ProShop MERN — Development History` |

```
[1] score=1.1429  [reference]  docs/project-data/best-practices.md
    section: MERN E-commerce Best Practices 2026 > 1. Introduction: Why proshop_mern Is Deprecated
    summary: Explains why proshop_mern is deprecated, listing its outdated 2020-era choices and compares them to 2026 production equivalents.
    ## 1. Introduction: Why proshop_mern Is Deprecated
    The original `proshop_mern` fork (bradtraversy/proshop_mern) was built circa 2020–2022 with:
    - **React 17** — predates concurrent rendering and Server Components
    - **Create React App** — unmaintained since 2023, superseded by Vite
    - **Classic Redux** — hand-written action creators, action types, and reducers
    - **localStorage for JWT** — known XSS vector
    - **No TypeScript** — runtime errors catch what the compiler should
    - **Bootstrap 4** — not tree-shakeable, global CSS collisions
    - **Single flat Node process** — no clustering, no health c …

[2] score=0.6762  [reference]  docs/project-data/best-practices.md
    section: MERN E-commerce Best Practices 2026
    summary: Introduction and purpose of the MERN E-commerce Best Practices 2026 reference document for the proshop_mern project.

[3] score=0.6429  [history]  docs/project-data/dev-history.md
    section: ProShop MERN — Development History
    summary: Introduces the ProShop MERN dev history document and describes Phase 0 prototype work from January–February 2023.
```

**Оценка релевантности: ❌ ПРОВАЛ.**

Ожидался хит из `adr-001-mongodb-vs-postgres.md`, но **ADR-файлы не проиндексированы** — они лежат в `docs/adr/`, а `DOCS_ROOT=docs/project-data` (см. `.env.example`). В корпусе индексера ни одного ADR нет, поэтому ретривер выдал семантически ближайшее — общие разделы про deprecation и историю.

**Вывод:** добавить `docs/adr/` в индексер (или объединить с `docs/project-data/adrs/` как было в плане CLAUDE.md). После этого переиндексировать (`python -m rag_indexer all`).

### Q2 — `Какие фичи зависят от payment_stripe_v3?`

**Команда:**
```bash
python -m rag_indexer query "Какие фичи зависят от payment_stripe_v3?" --k 3
```

**Top-3:**

| # | score | source_file | section |
|---|---|---|---|
| 1 | 1.0333 | `docs/project-data/feature-flags-spec.md` | `> 4. Feature Flag Catalog > Payments` |
| 2 | 0.8095 | `docs/project-data/pages/payment.md` | (whole file) |
| 3 | 0.6917 | `docs/project-data/dev-history.md` | `> 4. Lessons Learned > What we'd do differently` |

```
[1] score=1.0333  [reference]  docs/project-data/feature-flags-spec.md
    section: Feature Flags Specification — ProShop MERN > 4. Feature Flag Catalog > Payments
    summary: Describes three Payments feature flags — paypal_express_buttons, apple_pay, and stripe_alternative — covering their states, dependencies, and rollout strategies.
    ### Payments
    #### `paypal_express_buttons` — PayPal Express Checkout Buttons
    ...

[2] score=0.8095  [page]  docs/project-data/pages/payment.md
    section: (root)
    summary: Describes the /payment route: UI, Redux state, navigation guards, and payment method selection logic in ProShop checkout.

[3] score=0.6917  [history]  docs/project-data/dev-history.md
    section: ProShop MERN — Development History > 4. Lessons Learned > What we'd do differently
    summary: Retrospective lessons on six architectural mistakes the ProShop team would fix from day one if rebuilding.
```

**Оценка релевантности: ⚠ ЧАСТИЧНО.**

`grep -r "payment_stripe_v3"` по `docs/project-data/` — **0 совпадений**. Такого флага в корпусе нет (фактически есть `stripe_alternative` в `feature-flags-spec.md`). Top-1 — раздел "Payments" из feature-flags-spec, в нём перечислены `paypal_express_buttons`, `apple_pay`, `stripe_alternative`. Ретривер сделал максимум возможного: вернул именно тот раздел, где описан Stripe-флаг и его зависимости.

**Вывод:** для multi-hop "что зависит от X" RAG возвращает основной чанк про X, но "лес зависимостей" не видит — нужен либо graph-индекс по `dependencies:` в feature-flags-spec, либо follow-up запрос ("что зависит от stripe_alternative"). На уровне retrieval — это нормальное поведение, на уровне ответа агенту нужно дочитать `full_text` документа из `proshop_docs_documents`.

### Q3 — `Что случилось во время последнего incident с checkout?` (`--type incident`)

**Команда:**
```bash
python -m rag_indexer query "Что случилось во время последнего incident с checkout?" --k 3 --type incident
```

**Top-3:**

| # | score | source_file | section |
|---|---|---|---|
| 1 | 1.0000 | `docs/project-data/incidents/i-001-paypal-double-charge.md` | `> Timeline` |
| 2 | 0.9242 | `docs/project-data/incidents/i-002-mongo-connection-pool-exhaustion.md` | `> Impact` |
| 3 | 0.8214 | `docs/project-data/incidents/i-001-paypal-double-charge.md` | (root H1) |

```
[1] score=1.0000  [incident]  docs/project-data/incidents/i-001-paypal-double-charge.md
    section: Incident i-001: PayPal Sandbox Webhook Double-Charge > Timeline
    summary: Chronological timeline of the double-charge incident from initial PayPal callback to postmortem meeting.
    ## Timeline
    All times UTC.
    | Time | Event |
    |------|-------|
    | 2023-11-03 21:14 | PayPal sandbox receives payment for order `63c4a...` (test environment) |
    | 2023-11-03 21:14:02 | First `onApprove` callback fires; backend marks order paid, decrements stock |
    | 2023-11-03 21:14:04 | Second `onApprove` fires (2-second jitter from PayPal sandbox retry logic) |
    | 2023-11-03 21:14:04 | Backend processes second callback; order updated again, stock decremented again |
    ...

[2] score=0.9242  [incident]  docs/project-data/incidents/i-002-mongo-connection-pool-exhaustion.md
    section: Incident i-002: MongoDB Connection Pool Exhaustion — Black Friday 2023 > Impact
    summary: Quantified business and technical impact of the outage, plus explanation of Mongoose default pool size behavior and why it was never changed.

[3] score=0.8214  [incident]  docs/project-data/incidents/i-001-paypal-double-charge.md
    section: Incident i-001: PayPal Sandbox Webhook Double-Charge
    summary: Overview of incident i-001: PayPal sandbox double-charge causing duplicate payment records and inventory decrements over 38 hours.
```

**Оценка релевантности: ✅ УСПЕХ.**

Фильтр `--type incident` сузил кандидатов до 3 файлов в папке `incidents/`, RRF поднял до самого верха `i-001` Timeline (PayPal double-charge при чекауте) — это именно история о том, "что случилось" в чекаут-флоу. Второй хит `i-002` (Mongo pool exhaustion) тоже релевантен: отказ происходил на стадии оформления заказа во время Black Friday. Третий — overview того же `i-001`. Хорошо, что top-1 Timeline (фактологический раздел), а не Summary — он лучше отвечает на "что случилось".

В корпусе есть и `i-003-jwt-secret-leak.md` — он не попал в top-3, потому что не связан с checkout, и ретривер это правильно учёл.

### Сводка

| # | Релевантность | Где провал |
|---|---|---|
| Q1 (БД и почему) | ❌ | ADR-файлы не в `DOCS_ROOT` — индексер их не видит |
| Q2 (зависимости от флага) | ⚠ | флаг `payment_stripe_v3` не существует в корпусе; ретривер выдал ближайший real flag |
| Q3 (incident в checkout) | ✅ | top-1 — Timeline, top-2/3 — релевантные |

### Что чинить

1. **Расширить `DOCS_ROOT`** — либо добавить `docs/adr/` как второй источник, либо перенести ADR внутрь `docs/project-data/adrs/`. После этого `python -m rag_indexer all` возьмёт их в корпус (~8 файлов, +20-30 чанков).
2. **Multi-hop вопросы про зависимости** — отдельная задача (graph-traversal или итеративный follow-up); для базового retrieval это вне scope.
3. **Score-калибровка** — заметно, что фильтр `--type` поднимает абсолютные значения score (Q3 top-1 = 1.0). Это RRF-нормализация при меньшем кандидатном пуле, не реальное "идеальное совпадение". На пороги полагаться нельзя, ранжирование внутри одного запроса валидно.

---

## RAG Smoke Test — Q1 retest после расширения DOCS_ROOTS

**Что изменилось в индексере:** `DOCS_ROOT` → `DOCS_ROOTS` (csv-список путей). В `.env` теперь `DOCS_ROOTS=docs/project-data,docs/adr`. `detect_doc_type` распознаёт новый тип `adr` для всего, что лежит под `docs/adr/`.

**Прогон `python -m rag_indexer all`** — инкрементальный по `file_hash`:

```
=== split ===
split: 49 documents → 364 chunks    # было 41 → 330
=== enrich ===
resume: 41 documents already enriched, 8 to go
enrich: 364 chunks → data/enriched.jsonl
=== embed ===
embed: 364 chunk vectors, 49 document vectors
=== upsert ===
documents_upserted: 8
documents_skipped_unchanged: 41
chunks_upserted: 34
```

Состояние Qdrant подтверждено: `proshop_docs_chunks` = 364, `proshop_docs_documents` = 49.

### Q1 v2 — без фильтра, `--k 3`

```bash
python -m rag_indexer query "Какая БД используется в proshop_mern и почему именно она?" --k 3
```

| # | score | source_file | section |
|---|---|---|---|
| 1 | 1.1250 | `docs/project-data/best-practices.md` | `> 1. Introduction: Why proshop_mern Is Deprecated` |
| 2 | 0.6429 | `docs/project-data/best-practices.md` | (root H1) |
| 3 | 0.6111 | `docs/project-data/dev-history.md` | `ProShop MERN — Development History` |

И с `--k 5` ADR-001 в выдачу всё ещё не попадает — top-5 это `best-practices.md`, `dev-history.md`, `glossary.md`, `architecture.md`. Ситуация не изменилась относительно первого прогона.

**Почему так.** Чанк `best-practices.md > 1. Introduction` буквально перечисляет технологии "MongoDB / React / Bootstrap…" одним маркированным списком — это даёт максимальное dense-пересечение с фразой "какая БД". ADR-001 же выдержан в формате "Status / Date / Context / Decision" — слово MongoDB там идёт в нарративе ("Before the first commit, the team needed to select a database…"). RRF суммирует ранги по dense + sparse + questions_dense, и best-practices выигрывает на всех трёх каналах.

Это не баг ретривера, а особенность стиля ADR: сухая структура хуже матчится на разговорные вопросы вроде "какая X и почему".

### Q1 v2 — с фильтром `--type adr`, `--k 3`

```bash
python -m rag_indexer query "Какая БД используется в proshop_mern и почему именно она?" --k 3 --type adr
```

| # | score | source_file | section |
|---|---|---|---|
| 1 | 1.0000 | `docs/adr/adr-001-mongodb-vs-postgres.md` | `ADR-001: Use MongoDB (via Mongoose) as the Primary Database` |
| 2 | 0.8667 | `docs/adr/adr-002-redux-vs-context.md` | `ADR-002: Use Redux …` |
| 3 | 0.6736 | `docs/adr/adr-003-jwt-vs-session.md` | `> Alternatives Considered > Express-Session with MongoDB Session Store` |

```
[1] score=1.0000  [adr]  docs/adr/adr-001-mongodb-vs-postgres.md
    section: ADR-001: Use MongoDB (via Mongoose) as the Primary Database
    summary: ADR-001 records the context and decision to use MongoDB via Mongoose as ProShop's sole database, including rationale around variable product attributes and document embedding.
    # ADR-001: Use MongoDB (via Mongoose) as the Primary Database
    **Status:** Accepted
    **Date:** 2023-01-10
    **Decision Makers:** Engineering team (initial project setup)
    ---

    ## Context
    Before the first commit, the team needed to select a database for the ProShop e-commerce application. The two primary candidates were MongoDB and PostgreSQL. The team had more prior experience with PostgreSQL from a previous internal project, but MongoDB had been discussed as a learning goal for this project cycle.
    The domain under consideration: a product catalog, user accounts, shopping cart state, and or …
```

**Оценка: ✅ ADR-файлы теперь в индексе и работают.** Top-1 — именно тот ADR, который содержит обоснование выбора MongoDB. Score 1.0 — это RRF-нормализация при суженном кандидатном пуле (8 ADR-документов после фильтра), а не «идеальный матч».

### Итог по Q1

- Индексация ADR — **работает**: 8 документов / 34 чанка добавлены инкрементально, без передоплаты Anthropic за уже обогащённые файлы (`enriched.jsonl` resume-механизм пропустил 41 готовых документ).
- **Без фильтра** RAG отдаёт предпочтение best-practices.md — это нормальное поведение для разговорной формулировки вопроса. Чтобы ADR-документы стабильно попадали в top-K, либо использовать `--type adr` (когда тип запроса очевиден), либо переформулировать вопрос ближе к ADR-стилю ("Why was MongoDB chosen over PostgreSQL"), либо в реальной интеграции делать второй проход с фильтром после первичного ответа.
- **С фильтром `--type adr`** ADR-001 уверенно занимает первое место (1.0).

---

## Reflection

**Стек.** Pipeline на Python 3.12: LangChain `MarkdownHeaderTextSplitter` + `RecursiveCharacterTextSplitter` для детерминированного чанкинга, Claude Sonnet 4.6 (через Anthropic SDK) для обогащения каждого чанка `summary` / HyDE-`questions` / двуязычными `tags` / `contextual_prefix`, BGE-M3 через официальную библиотеку `FlagEmbedding` (PyTorch + MPS на Apple Silicon, fp16) для dense+sparse эмбеддингов одним проходом, Qdrant в Docker с двумя коллекциями (`proshop_docs_chunks` и `proshop_docs_documents`), named vectors `dense` + `sparse` + `questions_dense` и RRF-fusion для гибридного поиска.

**Почему так.** Python был естественным выбором — `qdrant-client`, `anthropic`, `FlagEmbedding` и `langchain-text-splitters` там самые зрелые. BGE-M3 покрывает смешанный RU/EN корпус и сразу даёт sparse, без отдельной BM25-модели. Детерминированный split + LLM-обогащение — компромисс: границы предсказуемы и дёшевы (можно перегенерить без оплаты API), а контекстные prefix'ы и HyDE-вопросы дают качество ретривера, которое одной голой модели не снять. Две коллекции (chunk-level и document-level) позволяют от точечного хита подтягивать целый исходник за один запрос.

**Что было сложно.** FastEmbed не оказался в каталоге BGE-M3 — пришлось сначала спускаться на `multilingual-e5-large` с `passage:`/`query:` префиксами, потом переключаться на `FlagEmbedding` (правильное решение, но через два захода). CoreMLExecutionProvider падал на ONNX-модели с external data — отказ от Metal в пользу CPU/MPS. Anthropic rate-limit 8000 output tokens/мин уронил первый прогон enrich: пришлось снизить `parallelism` с 4 до 1, `max_tokens` с 4096 до 2000 — а это в свою очередь стало обрезать JSON, и пришлось возвращать 4096 + снижать batch с 8 до 4. ADR-файлы лежали вне `DOCS_ROOT` — это вскрылось только на smoke-тесте. И, наконец, RRF без фильтра отдаёт предпочтение разговорным форматам (best-practices) над формальными (ADR), даже когда ADR содержит точный ответ.

**Что бы изменили.** Сразу заложили бы `DOCS_ROOTS` (csv-список) вместо одного корня — расширение корпуса было неизбежным. Resume-checkpoint в `enrich.py` нужно было делать с первой версии, а не после падения rate-limit (потеряли первый прогон). Перед написанием `embed.py` стоило проверить `TextEmbedding.list_supported_models()` FastEmbed — это сэкономило бы один цикл переписывания. На стороне ретривера добавил бы re-ranking через cross-encoder (`bge-reranker-v2-m3`) поверх top-20 — это починит сценарий «формальный ADR vs разговорный best-practices» лучше, чем фильтр по типу. И в перспективе — query expansion (генерация 2–3 переформулировок вопроса перед поиском) для multi-hop кейсов вроде Q2.

---

## RAG как MCP-сервер `proshop-docs`

CLI `python -m rag_indexer query` обёрнут в FastMCP-сервер с одним tool — это даёт агенту прямой доступ к семантическому поиску без bash-вызовов. Стек тот же, что для feature-flags MCP в M3 (FastMCP v3 + Python 3.12 + stdio).

### Структура

```
proshop_mern/
├── .mcp.json                        # обновлён — добавлен proshop-docs
├── mcp-server-docs/
│   ├── docs_search_server.py        # сервер: ~150 строк, один tool
│   ├── requirements.txt             # fastmcp>=3.0
│   ├── README.md
│   └── .gitignore
└── scripts/rag-indexer/.venv/        # переиспользуем — там уже FlagEmbedding,
                                     # qdrant-client, torch и BGE-M3 веса
```

Чтобы не дублировать ~2.3 ГБ модели и PyTorch, MCP-сервер запускается из **существующей** venv `scripts/rag-indexer/.venv` (`pip install fastmcp` поверх). Сам сервер импортирует `rag_indexer.query.search()` через `sys.path` — никакого дублирования логики.

### Tool

```
search_project_docs(query: str, top_k: int = 5) -> dict
```

Возвращает `{"query", "top_k", "chunks": [...]}`, где каждый chunk:

| field | description |
|---|---|
| `source_file` | basename, например `adr-001-mongodb-vs-postgres.md` |
| `file_path` | путь от корня репо |
| `title` | H1 исходного документа |
| `parent_headings` | breadcrumbs H1 → H2 → H3 |
| `score` | RRF fusion score (валиден внутри одного запроса) |
| `snippet` | ~200 первых символов чанка |
| `doc_type` | `adr` / `api` / `feature` / `incident` / `page` / `runbook` / `reference` / `glossary` / `history` |
| `chunk_id`, `document_id` | UUIDv5 для follow-up retrieval |

Error-коды: `INVALID_QUERY`, `INVALID_TOP_K`, `QDRANT_UNAVAILABLE`.

### Описание (по mcp-design-principles)

Docstring tool'а явно фиксирует:

- **WHEN TO CALL** — любой вопрос про продукт: архитектура, фича, инцидент, ADR, runbook, глоссарий, история, API-контракт. С примерами на RU и EN.
- **HARD RULE** — `You MUST` использовать этот tool **до** grep/Read по `docs/`. Голый grep не видит summary, contextual_prefix и HyDE-questions, которые сгенерил Sonnet — это потеря качества ретривера.
- **WHEN NOT TO CALL** — текущее runtime-состояние feature flag (это `proshop-features` MCP, `get_feature_info`); чтение/правка исходников (`Read`/`grep` по `backend/`/`frontend/`); generic вопросы вне темы продукта.

Полный текст — в docstring `search_project_docs` (см. [`mcp-server-docs/docs_search_server.py`](./mcp-server-docs/docs_search_server.py)).

### Регистрация

`.mcp.json` (project scope, в git):

```json
"proshop-docs": {
  "type": "stdio",
  "command": ".../scripts/rag-indexer/.venv/bin/python",
  "args": [".../mcp-server-docs/docs_search_server.py"]
}
```

При первом подъёме Claude Code попросит **Approve** для нового сервера. После — `mcp__proshop-docs__search_project_docs` доступен из любой сессии.

### Smoke-test (in-memory, без stdio)

Прогнан `fastmcp.Client(mcp)` напрямую. Выдача на запросе **«Why MongoDB over Postgres?»** (top_k=3):

```
1.250  [history]  docs/project-data/dev-history.md
       breadcrumbs: ProShop MERN — Development History > 3. Major Decisions > Decision 1: MongoDB over PostgreSQL
0.917  [adr]      docs/adr/adr-001-mongodb-vs-postgres.md
       breadcrumbs: ADR-001: Use MongoDB (via Mongoose) as the Primary Database > Consequences > Positive
0.750  [adr]      docs/adr/adr-001-mongodb-vs-postgres.md
       breadcrumbs: ADR-001: ... > Alternatives Considered > PostgreSQL (with Sequelize or Prisma ORM)
```

ADR-001 теперь стабильно попадает в top-3 на формальном английском запросе (две разные секции — Consequences и Alternatives Considered). Сравните с CLI Q1 v2 в разделе выше: на разговорной формулировке «Какая БД и почему» ADR не попадал даже в top-5 — это видно от формулировки, не от качества индекса. Тот же RAG, та же модель, разный язык запроса → разный ранг.

Validation отрабатывает: `{"query": "  "}` → `INVALID_QUERY`, `{"top_k": 0}` → `INVALID_TOP_K`. `QDRANT_UNAVAILABLE` сработает, если `docker compose up -d qdrant` не выполнен.