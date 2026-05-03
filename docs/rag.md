# ProShop Knowledge Base (Qdrant + BGE-M3)

Векторная база поверх `docs/project-data/` для семантического поиска по проектной документации. Используется для ответов на вопросы про функциональность, архитектуру, инциденты, API и runbook'и без ручного просмотра файлов.

## Что внутри

| Параметр | Значение |
|---|---|
| Vector DB | Qdrant 1.x в Docker (`docker compose up -d qdrant`) |
| HTTP API | `http://localhost:6333` |
| gRPC | `localhost:6334` |
| Web UI | `http://localhost:6333/dashboard` |
| Embedding model | `BAAI/bge-m3` через `FlagEmbedding` (PyTorch + MPS на Apple Silicon, fp16) |
| Размер dense-вектора | 1024d, cosine distance |
| Sparse | BGE-M3 lexical weights (token-id → вес, словарь XLM-RoBERTa) |
| Корпус | 41 markdown-файл из `docs/project-data/` → 330 чанков |

Чанкинг детерминированный (LangChain `MarkdownHeaderTextSplitter` + greedy-pack до ~400 токенов, overlap ~20%). Каждый чанк обогащён через Claude Sonnet 4.6: одностроковый `summary`, 4–6 двуязычных `questions` (HyDE), 6–12 двуязычных `tags`, `contextual_prefix` для retrieval contextual'a (Anthropic-style).

## Коллекции

### `proshop_docs_chunks` (330 точек)

Поисковая коллекция. Три именованных вектора:
- `dense` (1024d, cosine) — эмбеддинг `contextual_prefix + content`.
- `questions_dense` (1024d, cosine) — эмбеддинг сгенерированных HyDE-вопросов. Прибавляет recall на коротких вопросительных запросах.
- `sparse` — BGE-M3 lexical weights, лексический канал для гибрида.

Payload-индексы: `document_id`, `doc_type`, `file_path`, `tags` (keyword).

**Payload каждой точки:**

| Поле | Тип | Назначение |
|---|---|---|
| `document_id` | str (UUIDv5) | связь с `proshop_docs_documents` |
| `document_title` | str | заголовок исходного файла (H1) |
| `file_path` | str | `docs/project-data/...` |
| `doc_type` | str | `api` / `feature` / `incident` / `page` / `runbook` / `reference` / `glossary` / `history` |
| `section_path` | list[str] | путь по заголовкам, напр. `["Orders API", "POST /api/orders"]` |
| `chunk_index` / `total_chunks` | int | позиция чанка в документе |
| `prev_id` / `next_id` | str | соседи для расширения окна |
| `content` | str | сам markdown |
| `summary` | str | одно предложение |
| `questions` | list[str] | RU+EN вопросы, на которые чанк отвечает |
| `tags` | list[str] | RU+EN ключевые слова |
| `contextual_prefix` | str | контекст в документе (входил в эмбеддинг) |
| `content_hash` / `file_hash` | str | sha1 |
| `updated_at` | str | ISO timestamp |

### `proshop_docs_documents` (41 точка)

Документ-уровневая коллекция. Один `dense` (1024d, cosine), payload содержит `full_text` целого файла, `document_title`, `file_path`, `doc_type`, `file_hash`. Используется чтобы от чанк-хита подтянуть весь документ.

## Поиск (CLI)

Главная точка входа — модуль `rag_indexer.query`:

```bash
cd scripts/rag-indexer
.venv/bin/python -m rag_indexer query "почему PayPal списал двойной платёж" --k 5
```

Опции:

| Флаг | Назначение |
|---|---|
| `--k N` | сколько чанков вернуть (дефолт 5) |
| `--type {api,feature,incident,page,runbook,reference,glossary,history}` | фильтр по типу документа |
| `--no-hyde` | отключить prefetch на `questions_dense` |
| `--json` | machine-readable вывод |
| `--full` | не обрезать `content` |

Под капотом:
1. Запрос кодируется один раз в BGE-M3 → `dense` (1024d) + `sparse` (lexical weights).
2. Qdrant `query_points` с тремя `prefetch` (dense, sparse, questions_dense), каждый с лимитом 24.
3. Список объединяется через **RRF** (Reciprocal Rank Fusion) → top-K.
4. Опционально applies `query_filter` по `doc_type`.

Запросы могут быть на русском или английском — модель multilingual, корпус английский, рабочих кросс-язычных совпадений много. Префиксы (`query:` / `passage:`) **не нужны** — это была e5-специфика, BGE-M3 их не требует.

## Поиск (Python API)

```python
from rag_indexer.config import load_config
from rag_indexer.query import search

cfg = load_config()
hits = search(cfg, "как работает админка управления заказами", k=5)

for h in hits:
    print(h["score"], h["doc_type"], h["file_path"])
    print("  ", h["summary"])
    print("  ", h["section_path"])
```

`search()` лениво грузит модель и Qdrant-клиент при первом вызове. Если делаешь много запросов подряд, передай предсозданные `model=BGEM3FlagModel(...)` и `client=QdrantClient(...)`.

## Поиск (HTTP / curl)

Голый Qdrant `query_points` принимает уже посчитанный вектор — для curl-сценариев нужен отдельный эмбеддинг-сервис (или Python-однострочник). Простейший пример dense-only:

```bash
# 1) Получить вектор запроса (Python однострочник)
QUERY="how do I add a new product as admin"
DENSE=$(.venv/bin/python -c "
from FlagEmbedding import BGEM3FlagModel
import json, sys
m = BGEM3FlagModel('BAAI/bge-m3', use_fp16=True, device='mps')
v = m.encode(['$QUERY'])['dense_vecs'][0].tolist()
print(json.dumps(v))
")

# 2) Запрос в Qdrant
curl -s http://localhost:6333/collections/proshop_docs_chunks/points/query \
  -H 'content-type: application/json' \
  -d "{
    \"query\": $DENSE,
    \"using\": \"dense\",
    \"limit\": 5,
    \"with_payload\": true
  }" | jq '.result.points[] | {score, file_path: .payload.file_path, summary: .payload.summary}'
```

Для гибрида (dense + sparse + RRF) формат сложнее — пользуйся CLI или Python API.

## От чанка к документу

У каждого чанк-хита в payload есть `document_id`. Подтянуть полный исходный файл:

```bash
DOC_ID="<id из чанка>"
curl -s "http://localhost:6333/collections/proshop_docs_documents/points/$DOC_ID?with_payload=true" \
  | jq -r '.result.payload.full_text'
```

Или через Python:

```python
from qdrant_client import QdrantClient
client = QdrantClient(url="http://localhost:6333")
doc = client.retrieve(collection_name="proshop_docs_documents", ids=[doc_id], with_payload=True)[0]
print(doc.payload["full_text"])
```

## Расширение окна соседями

`prev_id` / `next_id` в payload чанка дают смежные чанки того же файла. Полезно когда top-K хит даёт нужное место, но обрезает важный соседний абзац:

```python
hit = hits[0]
neighbours = []
for nid in (hit.get("prev_id"), hit.get("next_id")):
    if nid:
        r = client.retrieve(collection_name="proshop_docs_chunks", ids=[nid], with_payload=True)
        neighbours.extend(r)
```

## Reindex после правок документации

Пайплайн инкрементальный: stage `upsert` сравнивает `file_hash` каждого файла с тем, что лежит в `proshop_docs_documents`. Неизменённые файлы пропускаются.

```bash
cd scripts/rag-indexer
source .venv/bin/activate
python -m rag_indexer all
```

Это запустит `split → enrich → embed → upsert` по всем файлам.

`enrich.py` тоже инкрементальный: ведёт `data/enriched.jsonl` как append-only checkpoint, документы с `document_id`, уже присутствующие в нём, пропускает. Если правки в `docs/project-data/` затронули только часть файлов и хочется минимизировать вызовы Anthropic API:

```bash
# Удалить из enriched.jsonl записи только тех документов, которые поменяли file_hash;
# проще всего — стереть весь enriched.jsonl, тогда заново обогатятся 41 файл (~$2).
rm data/enriched.jsonl
python -m rag_indexer enrich
```

Полный wipe (если поменяли модель эмбеддинга или схему):

```bash
curl -X DELETE http://localhost:6333/collections/proshop_docs_chunks
curl -X DELETE http://localhost:6333/collections/proshop_docs_documents
rm data/*.jsonl
python -m rag_indexer all
```

## Стоимость и время одного полного прогона

| Стадия | Время | Бюджет |
|---|---|---|
| `split` | < 1 c | — |
| `enrich` (Sonnet 4.6, parallelism=1, batch=4) | ~22 мин | ~$1.5–2 |
| `embed` (BGE-M3 на MPS, fp16) | ~5 мин | — |
| `upsert` (Qdrant локально) | < 1 c | — |

`enrich` — самый дорогой шаг. По умолчанию `ENRICH_PARALLELISM=1` чтобы не упереться в лимит 8000 output tokens/min на этом организационном тиере. Поднять параллелизм имеет смысл только при более высоком тиере.

## Фильтры и query patterns

```bash
# Только инциденты:
.venv/bin/python -m rag_indexer query "race condition" --type incident

# Только runbook'и:
.venv/bin/python -m rag_indexer query "как откатить деплой" --type runbook

# Машинно-читаемый вывод (JSON):
.venv/bin/python -m rag_indexer query "JWT expiration" --k 3 --json
```

Фильтры по `tags` или `file_path` доступны через прямой `qdrant_client.query_points` (не пробрасываются в CLI — добавлю по запросу).

## Troubleshooting

- **`Model BAAI/bge-m3 is not supported in TextEmbedding`** — это про FastEmbed, мы перешли на `FlagEmbedding`. Если стек не пересобран — `pip install FlagEmbedding torch` в `.venv`.
- **`std::filesystem error: Not a directory` (ONNX runtime)** — была у предыдущей e5 модели на CoreML. С BGE-M3 (PyTorch + MPS) этого пути нет.
- **`RateLimitError: 8,000 output tokens per minute`** на `enrich` — снизить `ENRICH_BATCH_SIZE` в `.env`. Default уже консервативный (4).
- **`Output truncated at max_tokens`** — батч слишком большой, JSON ответа Sonnet не помещается в 4096. Снизить `ENRICH_BATCH_SIZE`.
- **`mps available: False`** на старых Mac — `embed.py` сам падает на CPU. Подождёт, не сломается.

## Связанные документы

- [`scripts/rag-indexer/README.md`](../scripts/rag-indexer/README.md) — quickstart, переменные окружения, layout пайплайна.
- [`docs/project-data/`](./project-data/) — собственно индексируемый корпус.