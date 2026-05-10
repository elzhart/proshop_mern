# M4 — Дизайн-система и редизайн UI с AI

Отчёт по домашнему заданию модуля 4. Полный редизайн `proshop_mern` под две дизайн-системы (admin + consumer) с применением AI (Claude Code + Pencil MCP + feature-flags MCP).

---

## Список редизайненных страниц

Все 16 страниц редизайнены — от обязательной Feature Dashboard до полного покрытия consumer + admin секций.

| # | Page | Route | File | Видимость | Сделал? |
|---|------|-------|------|-----------|---------|
| 1 | Home / Search results | `/`, `/search/:keyword`, `/page/:n` | `HomeScreen.js` | public | [x] |
| 2 | Product details | `/product/:id` | `ProductScreen.js` | public | [x] |
| 3 | Cart | `/cart/:id?` | `CartScreen.js` | public | [x] |
| 4 | Login | `/login` | `LoginScreen.js` | public | [x] |
| 5 | Register | `/register` | `RegisterScreen.js` | public | [x] |
| 6 | Profile | `/profile` | `ProfileScreen.js` | auth | [x] |
| 7 | Shipping | `/shipping` | `ShippingScreen.js` | auth | [x] |
| 8 | Payment | `/payment` | `PaymentScreen.js` | auth | [x] |
| 9 | Place Order | `/placeorder` | `PlaceOrderScreen.js` | auth | [x] |
| 10 | Order details | `/order/:id` | `OrderScreen.js` | auth | [x] |
| 11 | Admin: Users list | `/admin/userlist` | `UserListScreen.js` | admin | [x] |
| 12 | Admin: User edit | `/admin/user/:id/edit` | `UserEditScreen.js` | admin | [x] |
| 13 | Admin: Products list | `/admin/productlist` | `ProductListScreen.js` | admin | [x] |
| 14 | Admin: Product edit | `/admin/product/:id/edit` | `ProductEditScreen.js` | admin | [x] |
| 15 | Admin: Orders list | `/admin/orderlist` | `OrderListScreen.js` | admin | [x] |
| 16 | **Admin: Feature Dashboard** | `/admin/featuredashboard` | `DashboardFeaturesScreen.js` | admin | [x] **обязательно** |

> Примечание: имя файла #16 — `DashboardFeaturesScreen.js` (исторически в этом форке), не `FeatureDashboardScreen.js` как в шаблоне таблицы. Роут совпадает.

---

## Использованные инструменты

| Инструмент | Зачем |
|------------|-------|
| **Claude Code (Sonnet/Opus)** | основной driver: brainstorming → spec → plan → execute по superpowers skill flow; вся admin-секция целиком (markup + CSS + компоненты); финальное ревью и багфиксы consumer-CSS |
| **Codex** | первичная вёрстка consumer-страниц по pen-макетам — JSX-разметка всех 10 consumer-экранов + Header/Footer/SearchBox/CheckoutSteps/Product/Rating переделана под `consumer-*` классы. CSS под эту разметку дописывался уже в Claude Code |
| **Pencil MCP** (`mcp__pencil__*`) | чтение `.pen` дизайн-макетов (`docs/admin.pen` / `docs/consumer.pen`) — screenshots, batch_get структуры нод, токены |
| **feature-flags MCP** (`mcp__feature-flags__*`) | управление feature-flags в `features.json` без прямого редактирования файла (требование CLAUDE.md из M3) |
| **search-docs MCP** | поиск по проектной документации `docs/project-data/` (RAG из M3) |

**Разделение труда между AI-инструментами:**
- **Admin секция** (6 страниц): полностью в Claude Code от spec до execute, с pen-макетов через Pencil MCP — 30 custom компонентов в `components/admin/`, 1237 строк `admin.css`.
- **Consumer секция** (10 страниц): markup сделан в **Codex** заранее (классы `consumer-*` уже стояли в JSX когда Claude начал работу). Claude Code дописывал недостающий CSS-файл (`consumer.css` — 1357 строк), фиксил visual bugs (см. секцию ниже про 5 багов), и делал финальный ревью.

Реализация — **руками в React 16 + react-bootstrap + custom CSS**. Никаких visual builders типа v0/Bolt/Lovable не использовалось. Tailwind / shadcn не подключались — оба `DESIGN.*.md` явно объявляют их design-only словарём, production stack остаётся react-bootstrap.

---

## Component decisions

### Что оставили готовым

- **react-bootstrap** — production stack, не мигрировали (per spec из обоих DESIGN-файлов). Используем как DOM-движок для `<Table>`, `<Modal>`, `<OverlayTrigger>`/`<Popover>`, `<Tooltip>`, `<Form.Control>`, `<Carousel>` — но **переопределяем визуал через CSS-переменные и override-классы**.
- **Redux flow** — actions/reducers/constants не трогали ни на одном экране. Редизайн чисто визуальный + замена side-effect UX (window.confirm → ConfirmDialog, Loader → SkeletonRow, Message → ErrorState/Banner).
- **`Rating.js`** — компонент уже использовал FontAwesome stars, перекрасили в violet (`--consumer-star-on: #7c3aed`) через override default-prop color.
- **`FeaturesContext.js`** (SSE + bucket) — feature-flags page работает поверх него, контекст не модифицировали.

### Что написали кастомно

**Admin секция** — папка `frontend/src/components/admin/` (30 компонентов, ~1237 строк CSS):

```
AdminPageHeader · BackLink · Banner · ConfirmDialog
SearchInput · FilterChip · Pagination
TextInput · NumberInput · Textarea · Checkbox · FormField · FileUploadZone
StatusBadge · BooleanCell · DateOrCrossCell · WiredMarker
ActionIconButton · ResetButton · ToggleSwitch · TrafficSlider
StatCard · SkeletonRow · EmptyState · ErrorState
FeatureRow · UserRow · ProductRow · OrderRow
DescriptionPopover
```

**Consumer секция** — `frontend/src/styles/consumer.css` (~1357 строк CSS) + 1 utility-компонент. Markup всех consumer-экранов был **сделан заранее в Codex** (под `consumer-*` классы согласно pen-макетам), но CSS-файл отсутствовал — задача Claude свелась к написанию comprehensive design system для всех ~100 classes + фикс 5 visual багов, найденных при первом проходе по экранам (см. PR diff в `consumer.css` — баги с Order Summary шириной, Login кнопкой невидимой из-за specificity конфликта с Bootstrap `.btn-primary`, search button alignment, и т.д.).

**Hook:** `useFeatureOverrides.js` — localStorage-based per-feature traffic overrides для Feature Dashboard.

### Замены поверх react-bootstrap

| Было | Стало | Почему |
|------|-------|--------|
| `<Loader />` (spinner) | `<SkeletonRow />` × 5 | Anti-slop guard: loading state — skeleton, не спиннер |
| `<Message variant='danger'>` | `<ErrorState />` card / `<Banner />` inline | Дифференциация critical block vs inline feedback |
| `window.confirm('Are you sure')` | `<ConfirmDialog>` | A11y: focus-trap + Esc + role=dialog + кастомный стиль |
| `<Paginate>` (react-router-bootstrap pagination) | `components/admin/Pagination.js` | Не стилизуется под admin tokens, написали свою |
| `<Form.File>` (Bootstrap) | `<FileUploadZone>` с drag/drop + URL fallback + preview | Pen-дизайн требовал dropzone, не file button |

---

## Дизайн-система (вместо одного DESIGN.md — два)

В корне репо лежат **два** документа дизайн-системы:

- [`DESIGN.admin.md`](../../DESIGN.admin.md) — admin-tooling (Light SaaS Clean, slate + emerald accent, NO shadows, density-first)
- [`DESIGN.consumer.md`](../../DESIGN.consumer.md) — consumer-facing (tech-product, zinc + violet→indigo gradient, subtle shadows, shop-voice)

Спек разрешает `DESIGN.md` или `DESIGN_SYSTEM.md` — разделение на admin/consumer обосновано в разделе «Назначение» обоих файлов: admin = tool-feel, consumer = shop-feel, токены умышленно не делятся.

**Каждый файл содержит ≥ 11 секций** (превышает минимум 7 из спеки):
1. Color Palette (semantic tokens, CSS variables, dark mode strategy)
2. Typography (Geist — обоснование почему не Inter: tech-feel + бренд-консистентность с моноширным)
3. Spacing Scale (admin: 2px-base с допуском кратных 2 для density; consumer: 4px-base, кратные 4)
4. Border Radius Scale
5. Elevation / Shadow Approach (admin: NO shadows; consumer: subtle + violet glow на hover)
6. Component Patterns (cards, buttons, inputs, badges, tables, dialogs, sliders, etc. — desktop + mobile)
7. Interactive States (hover / focus / loading / empty / error — для каждого элемента в таблице states-matrix)
8. Animation / Transitions (purposeful, ≤300ms, reduced-motion)
9. Accessibility (WCAG 2.1 AA verified contrast, ARIA, keyboard, touch targets)
10. Format Declaration
11. **Anti-AI-slop Guards (mandatory)** — copy + project-specific overrides
- Appendix A–F (admin) / A–J (consumer) — page-specific wireframes + content tokens

### IDE rules

Ссылка в [`CLAUDE.md`](../../CLAUDE.md), секция **"Design rules"** (строка 126):
- ссылается на `DESIGN.admin.md` для `/admin/*` страниц
- ссылается на `DESIGN.consumer.md` для public + auth checkout страниц
- ссылается на `docs/anti-slop-supplement.md` как источник anti-slop правил
- описывает разделение audience-driven design language

---

## Чеклист из homework-spec.md

### Feature Dashboard (обязательно)

- [x] Страница в admin: роут `/admin/featuredashboard`, проверка `isAdmin`, ссылка в admin-dropdown в Header (НЕ в общем nav)
- [x] Список фич из `features.json` отображается
- [x] Статус-бейджи трёх цветов: Enabled / Testing / Disabled
- [x] Toggle меняет цвет бейджа при клике (через derived status из `traffic_percentage`, см. spec §3.4)
- [x] Slider 0–100 обновляет процент `traffic_percentage`
- [x] Поиск по имени фичи работает (200ms debounce, по name И id)
- [x] Фильтр по статусу работает (tablist + arrow keys per radio-tab pattern)
- [x] Loading skeleton, Empty state, Error state — присутствуют
- [x] ARIA labels + Keyboard navigation

**Bonus:** localStorage overrides для toggle/slider — `features.json` остаётся read-only (per CLAUDE.md MCP guidance), описание-попавер через info-icon с `features-descriptions.json`, wired-marker через ⚡, reset-row + reset-all controls.

### Редизайн остальных страниц

- [x] Минимум 1 страница (помимо Feature Dashboard) редизайнена → **сделали все 15**
- [x] В README указан список редизайненных страниц (см. таблицу выше)

### DESIGN.md

- [x] `DESIGN.md` в корне репо (разделён на `DESIGN.admin.md` + `DESIGN.consumer.md` рядом с `CLAUDE.md`)
- [x] Минимум 7 секций (color / typography / spacing / radius / elevation / components / states) — фактически 11+ секций в каждом файле
- [x] Шрифт — не Inter (используется **Geist** от Vercel + **JetBrains Mono** для data-cells; обоснование в §2 обоих DESIGN-файлов: tech-product feel + бренд-консистентность; Inter оставлен fallback'ом)
- [x] Spacing scale — кратные 8: admin использует 4-base с допуском 2-multiples для density (8/16/24/32/48 — основной rhythm), consumer строго 4-base (4/8/12/16/20/24/32/48/64/96). Project-specific override этого правила задокументирован в §11 admin
- [x] Anti-AI-slop guards секция добавлена в §11 обоих DESIGN-файлов; source — `docs/anti-slop-supplement.md`
- [x] В rules-файле IDE (`CLAUDE.md`) добавлена ссылка `## Design rules: see ./DESIGN.admin.md / ./DESIGN.consumer.md`

### Anti-AI-slop визуальный аудит

- [x] Нет cringe-градиентов — admin вообще без градиентов (тулза должна выглядеть serious), consumer имеет controlled violet→indigo gradient ТОЛЬКО на CTA / hero / signature surfaces (не на каждом блоке)
- [x] Нет 2-column comparison blocks — нигде в проекте
- [x] Нет heavy borders на карточках — везде 1px solid `--admin-border` / `--consumer-border`
- [x] Hover state есть на кнопках — определён для всех variants (primary / secondary / ghost / icon-cta / action-icon)
- [x] Focus state виден при keyboard navigation — `:focus-visible` с 2px outline (admin) / box-shadow halo (consumer)
- [x] Loading state — skeleton, не спиннер — `SkeletonRow` параметризован под колонки таблицы; form skeleton в edit-страницах
- [x] Все отступы кратны 8 — кратные 4 в consumer (строже соответствует Bootstrap base), кратные 2 в admin для density (явный override в DESIGN.admin.md §3)
- [x] shadcn — не используется (CLAUDE.md явно фиксирует production stack как react-bootstrap, без миграции на shadcn/Tailwind)

---

## Документация процесса

В `docs/superpowers/` лежат 6 spec'ов и 6 plan'ов — по одному на каждую редизайненную admin-страницу:

```
docs/superpowers/specs/2026-05-13-feature-flags-redesign-design.md      (519 lines)
docs/superpowers/specs/2026-05-13-user-list-redesign-design.md
docs/superpowers/specs/2026-05-13-user-edit-redesign-design.md
docs/superpowers/specs/2026-05-13-product-list-redesign-design.md
docs/superpowers/specs/2026-05-13-product-edit-redesign-design.md
docs/superpowers/specs/2026-05-13-order-list-redesign-design.md

docs/superpowers/plans/2026-05-13-feature-flags-redesign.md             (2106 lines)
docs/superpowers/plans/2026-05-13-user-list-redesign.md
docs/superpowers/plans/2026-05-13-user-edit-redesign.md
docs/superpowers/plans/2026-05-13-product-list-redesign.md
docs/superpowers/plans/2026-05-13-product-edit-redesign.md
docs/superpowers/plans/2026-05-13-order-list-redesign.md
```

Workflow по superpowers skill flow: **brainstorming → spec → plan → execute** с manual browser verification gates (test infra в проекте отсутствует per `CLAUDE.md`).

Consumer-секция сделана одним проходом (markup был preexisting, написал comprehensive `consumer.css` 1357 lines).

---

## Как проверить локально

```bash
docker compose up -d                  # MongoDB
npm install                            # backend + frontend
npm run data:import                    # seed users + products
npm run dev                            # backend :5001 + frontend :3000
```

Логин admin: `admin@example.com` / `123456` (seed user).

**Гид по проверке:**

1. `/` — Home (gradient hero, product grid, categories)
2. `/product/<любой id>` — Product details (gallery + info + reviews)
3. `/cart` — Cart list + Order Summary sidebar
4. `/login`, `/register` — Auth cards с pill-badge
5. `/profile` — Profile form + My Orders table
6. `/shipping` → `/payment` → `/placeorder` — Checkout flow с CheckoutSteps breadcrumb
7. `/order/<id>` — Order details
8. `/admin/featuredashboard` — главное блюдо: search, chips, slider drag, toggle, reset, skeleton/empty/error states
9. `/admin/userlist`, `/admin/productlist`, `/admin/orderlist` — admin list pages
10. `/admin/user/:id/edit`, `/admin/product/:id/edit` — admin edit forms

**Keyboard test:** Tab по всему интерфейсу, ←/→ внутри filter-chip групп, Esc закрывает dialog'и, focus-ring видим везде.

---

*Подготовлено для M4 HSS AI-dev L1. Все изменения в одном бранче, готов к ревью.*
