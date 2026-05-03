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

## RAG Smoke Test — 3 запроса

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