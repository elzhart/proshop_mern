# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

ProShop — полноценный интернет-магазин электроники. Пользователи могут просматривать товары, добавлять в корзину, оформлять заказы и оплачивать через PayPal. Администраторы управляют товарами, пользователями и заказами через отдельный раздел `/admin`.

## Tech Stack

| Слой         | Технологии                                                     |
|--------------|----------------------------------------------------------------|
| Frontend     | React 16, Redux + redux-thunk, React Bootstrap, React Router 5 |
| Backend      | Node.js, Express 4, ES Modules                                 |
| Database     | MongoDB 6 (Mongoose 5)                                         |
| Auth         | JWT (Bearer token), bcryptjs                                   |
| Payments     | PayPal (react-paypal-button-v2)                                |
| File uploads | multer                                                         |
| Dev tooling  | nodemon, concurrently, Docker Compose (MongoDB)                |

## Project Documentation

`docs/project-data/` содержит полную проектную документацию. Читай её перед тем как предлагать архитектурные решения или изменения в поведении.

| Папка         | Что внутри                                                          |
|---------------|---------------------------------------------------------------------|
| `adrs/`       | 5 ADR: выбор MongoDB, Redux, JWT, PayPal, Bootstrap                 |
| `api/`        | Спецификации всех API-эндпоинтов                                    |
| `features/`   | Описание фич: auth, cart, checkout, payments, catalog, admin        |
| `incidents/`  | Разборы инцидентов: PayPal double-charge, Mongo pool, JWT leak      |
| `pages/`      | Поведение каждого экрана приложения                                 |
| `runbooks/`   | Инструкции: deploy, seed, incident response, feature flags          |
| `*.md / .json`| architecture, best-practices, glossary, dev-history, features.json  |

## Поиск по документации продукта proshop_mern (search-docs MCP)

- При любых вопросах про функционал, фичи, архитектуру, ADR, runbooks, incidents — **СНАЧАЛА** использовать `search-docs` MCP: `mcp__search-docs__search_project_docs(query, top_k=5)`. Запросы можно писать на русском, префиксы не нужны.
- Это быстрее и возвращает релевантные чанки с метаданными: `source_file`, `file_path`, `title`, `parent_headings` (breadcrumbs H1→H2→H3), `score`, `snippet` (~200 chars), `doc_type`, `chunk_id`, `document_id`.
- **ТОЛЬКО** если vector search не дал нужных результатов или нужно полное содержимое файла из метаданных найденного чанка → fallback на `grep` + `Read` по `file_path` из выдачи. Альтернативно — debug-CLI: `cd scripts/rag-indexer && .venv/bin/python -m rag_indexer query "..." --k 5 --full`.
- **НЕ** начинать с `grep`+`Read` по проекту — медленно и дорого по токенам, плюс упускаются Sonnet-обогащённые `summary` / `questions` / `contextual_prefix`, которых в сыром тексте нет.
- Предусловие: Qdrant поднят (`docker compose up -d qdrant`). При `QDRANT_UNAVAILABLE` — это первое, что проверять. Полный референс индекса — [`docs/rag.md`](docs/rag.md).

## Управление feature flags (feature-flags MCP)

- Когда пользователь спрашивает статус фичи («какой статус у `gift_message`?», «включена ли `search_v2`?») — вызывать `mcp__feature-flags__get_feature_info(feature_id)`, **не** читать `features.json` напрямую через `Read`.
- Когда пользователь хочет изменить статус («включи фичу X», «переведи Y в Testing», «поставь трафик 25%») — вызывать соответствующие tools: `mcp__feature-flags__set_feature_state(feature_id, state)` или `mcp__feature-flags__adjust_traffic_rollout(feature_id, percentage)`. **Никогда** не редактировать `features.json` (или `backend/features.json`) вручную через `Edit`/`Write` — MCP делает атомарную запись и проверяет инварианты (зависимости, `DISABLED_LOCK`).
- Когда пользователь просит список всех фич — использовать `mcp__feature-flags__list_features()`, **не** `grep`'ать файл.

## Commands

```bash
# Start MongoDB (required before running the app)
docker compose up -d

# Run backend + frontend together
npm run dev

# Backend only (nodemon, auto-restart on change)
npm run server

# Frontend only
npm run client

# Seed database with sample products and users
npm run data:import

# Destroy all data in the database
npm run data:destroy
```

No test suite is configured in this project.

## Environment

Backend runs on port **5001** (port 5000 is occupied by macOS AirPlay Receiver on this machine).

Required `.env` in the project root:
```
NODE_ENV=development
PORT=5001
MONGO_URI=mongodb://admin:secret@localhost:27017/proshop?authSource=admin
JWT_SECRET=...
PAYPAL_CLIENT_ID=...
```

Frontend proxy (`frontend/package.json`) points to `http://127.0.0.1:5001`. If port changes — update both.

Frontend requires `NODE_OPTIONS=--openssl-legacy-provider` — `react-scripts` 3.x is incompatible with Node.js v17+. Already set in the root `package.json` `client` script.

## Architecture

### Backend (`backend/`)

Express REST API using ES Modules (`"type": "module"`). Entry point is `backend/server.js`.

Routes:
- `/api/products` — CRUD, reviews, search, pagination, top-rated
- `/api/users` — auth, profile, admin user management
- `/api/orders` — creation, PayPal payment, delivery status
- `/api/upload` — image upload via `multer`, files served from `/uploads`
- `/api/config/paypal` — returns `PAYPAL_CLIENT_ID` to the client

Auth uses JWT Bearer tokens (`authMiddleware.js` exports `protect` and `admin`). `protect` attaches `req.user`; `admin` checks `req.user.isAdmin`. Passwords are bcrypt-hashed via a Mongoose pre-save hook in `userModel.js`.

In production, the server statically serves the React build from `frontend/build/`.

### Frontend (`frontend/src/`)

React 16 + React Bootstrap. Redux with redux-thunk (pattern: constants → actions → reducers → store).

Redux slices: `productList/Details/Create/Update/Delete/ReviewCreate/TopRated`, `userLogin/Register/Details/UpdateProfile/List/Delete/Update`, `orderCreate/Details/Pay/Deliver/ListMy/List`, `cart`.

Persistence: `cartItems` and `shippingAddress` saved to `localStorage`; `userInfo` (JWT) saved on login and loaded as `initialState.userLogin`. Schema changes to stored objects require clearing localStorage to avoid broken auth state.

Checkout wizard: **Cart → Shipping → Payment → PlaceOrder → Order**. `CheckoutSteps` renders the breadcrumb.

Admin routes (`/admin/*`) guarded in UI by `userInfo.isAdmin` redirect and on backend by `admin` middleware.

### Data seeding

`backend/data/users.js` and `backend/data/products.js` contain sample data. The first user in `users.js` is the admin owner of all seeded products. After any Mongoose model/schema change, reseed:
```bash
npm run data:destroy && npm run data:import
```

## Conventions

Commit and PR naming: `feat: ...` / `fix: ...` / `refactor: ...`. One PR = one logical change. If API changes, describe request/response changes in the PR. Avoid mixing unrelated backend and frontend changes.

## Known Gotchas

- `/uploads` is local disk — files are not persistent in production without external storage.
- PayPal: `PAYPAL_CLIENT_ID` is read at server start; restart backend after `.env` changes. Use sandbox accounts only.
- Port 5001 is project-specific to this machine; the original upstream used 5000.