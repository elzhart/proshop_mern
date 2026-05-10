# Feature Flags Admin Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перенести существующий read-only экран `DashboardFeaturesScreen` в admin-секцию: новый роут `/admin/featuredashboard`, `isAdmin` guard, ссылка из admin-dropdown в Header. Управление флагами остаётся через `feature-flags` MCP — backend не меняется.

**Architecture:** Тривиальный фронтовый рефакторинг трёх файлов (`App.js`, `Header.js`, `DashboardFeaturesScreen.js`). Логика чтения флагов (`FeaturesContext` + SSE через `/api/features/stream`) и backend (`featureRoutes.js`) не трогаются. Guard реализуется существующим в проекте паттерном из `UserListScreen.js` — `useEffect` + `history.push('/login')`.

**Tech Stack:** React 16, react-redux (`useSelector`), react-router-dom 5 (`history`), react-router-bootstrap (`LinkContainer`), react-bootstrap (`NavDropdown`).

**Spec:** `docs/superpowers/specs/2026-05-10-feature-flags-admin-page-design.md`

**No test suite:** в проекте нет тестового фреймворка (см. `CLAUDE.md` → «No test suite is configured»). Верификация — manual через `npm run dev`.

---

### Task 1: Move route in `App.js`

**Files:**
- Modify: `frontend/src/App.js:54`

- [ ] **Step 1: Replace the public route with the admin route**

Открой `frontend/src/App.js`. Текущая строка 54:

```js
<Route path='/dashboard-features' component={DashboardFeaturesScreen} />
```

Замени на:

```js
<Route path='/admin/featuredashboard' component={DashboardFeaturesScreen} />
```

Импорт `DashboardFeaturesScreen` (строка 21) и обёртка `<FeaturesProvider>` (строки 22, 26, 67) **остаются без изменений** — `FeaturesProvider` нужен публичным wired-фичам (`image_lazy_loading`, `paypal_express_buttons`, `product_recommendations`).

- [ ] **Step 2: Verify only one route changed**

Проверь, что в `App.js` нет других упоминаний `/dashboard-features`:

```bash
grep -n "dashboard-features\|featuredashboard" frontend/src/App.js
```

Expected output: одна строка с `/admin/featuredashboard`.

---

### Task 2: Move Header link to admin dropdown

**Files:**
- Modify: `frontend/src/components/Header.js:35-39, 56-68`

- [ ] **Step 1: Remove the public nav link**

Открой `frontend/src/components/Header.js`. Удали блок (строки 35–39):

```js
<LinkContainer to='/dashboard-features'>
  <Nav.Link>
    <i className='fas fa-flag'></i> Dashboard Features
  </Nav.Link>
</LinkContainer>
```

После удаления `<Nav className='ml-auto'>` должен начинаться с `<LinkContainer to='/cart'>`, сразу за которым идёт условный `userInfo ? (...) : (...)` блок.

- [ ] **Step 2: Add the admin dropdown item**

В том же файле, в блоке `userInfo && userInfo.isAdmin && (...)` (строки 56–68), добавь новый `<LinkContainer>` **после** `<LinkContainer to='/admin/orderlist'>`:

```js
<LinkContainer to='/admin/orderlist'>
  <NavDropdown.Item>Orders</NavDropdown.Item>
</LinkContainer>
<LinkContainer to='/admin/featuredashboard'>
  <NavDropdown.Item>Feature Flags</NavDropdown.Item>
</LinkContainer>
```

Без иконки `fa-flag` — для консистентности с другими пунктами dropdown (Users/Products/Orders).

- [ ] **Step 3: Verify**

```bash
grep -n "dashboard-features\|featuredashboard\|fa-flag" frontend/src/components/Header.js
```

Expected output: одна строка с `to='/admin/featuredashboard'`. Никаких `fa-flag` и `dashboard-features`.

---

### Task 3: Add `isAdmin` guard and refresh copy in `DashboardFeaturesScreen.js`

**Files:**
- Modify: `frontend/src/screens/DashboardFeaturesScreen.js:1-4, 59-70, 88-92`

- [ ] **Step 1: Add the `useSelector` import**

В начале файла (после `import React, ...` на строке 1) добавь импорт redux-хука:

```js
import { useSelector } from 'react-redux'
```

Существующие импорты (`Loader`, `useFeaturesContext`, etc.) не трогай.

- [ ] **Step 2: Add `history` prop and `userInfo` selector**

Найди объявление компонента (строка 59):

```js
const DashboardFeaturesScreen = () => {
  const { features, bucket, connected } = useFeaturesContext()
  const [descriptions, setDescriptions] = useState({})

  useEffect(() => {
    let cancelled = false
    fetch('/api/features/descriptions')
```

Замени на:

```js
const DashboardFeaturesScreen = ({ history }) => {
  const { features, bucket, connected } = useFeaturesContext()
  const [descriptions, setDescriptions] = useState({})

  const userLogin = useSelector((state) => state.userLogin)
  const { userInfo } = userLogin

  useEffect(() => {
    if (!userInfo || !userInfo.isAdmin) {
      history.push('/login')
    }
  }, [history, userInfo])

  useEffect(() => {
    let cancelled = false
    fetch('/api/features/descriptions')
```

То есть:
1. сигнатура компонента принимает `{ history }` — react-router 5 передаёт его автоматически потому что компонент монтируется через `<Route component={...}>`;
2. добавляется `useSelector` для `userLogin`;
3. добавляется новый `useEffect` с guard'ом **перед** существующим `useEffect` для `descriptions`.

Существующий `useEffect` для загрузки `descriptions` оставь без изменений.

- [ ] **Step 3: Update the `<h1>` and subtitle**

Найди блок (строки 86–93):

```jsx
<Row className='align-items-center mb-3'>
  <Col>
    <h1 className='mb-0'>Dashboard Features</h1>
    <small className='text-muted'>
      Live view of <code>features.json</code>. Edit the file — the table updates automatically.
      Your traffic bucket: <strong>{bucket}</strong> (0–99, persisted in localStorage).
    </small>
  </Col>
```

Замени на:

```jsx
<Row className='align-items-center mb-3'>
  <Col>
    <h1 className='mb-0'>Feature Flags</h1>
    <small className='text-muted'>
      Read-only view of <code>features.json</code>. Manage flags via the <code>feature-flags</code> MCP server.
      Your traffic bucket: <strong>{bucket}</strong> (0–99, persisted in localStorage).
    </small>
  </Col>
```

Остальной JSX (статистика, таблица, нижняя `<Card>` с описанием wired-фич) **не трогай**.

- [ ] **Step 4: Sanity-check the file**

```bash
grep -nE "Dashboard Features|Edit the file|history|useSelector|useEffect" frontend/src/screens/DashboardFeaturesScreen.js
```

Expected:
- 0 совпадений `Dashboard Features` (h1 переименован)
- 0 совпадений `Edit the file` (subtitle обновлён)
- 1 совпадение `useSelector` (новый импорт)
- 1 совпадение `history` (в `history.push`)
- 2 совпадения `useEffect` (guard + descriptions fetch)

---

### Task 4: Manual verification

**Files:** none changed in this task.

- [ ] **Step 1: Start backend + frontend**

Терминал 1 — MongoDB (если ещё не запущен):

```bash
docker compose up -d
```

Терминал 2 — приложение:

```bash
npm run dev
```

Жди, пока не появится `🚀 Server running ... port 5001` и фронт не откроется на `http://localhost:3000`.

- [ ] **Step 2: Test scenario A — anonymous user blocked**

В чистом браузере (или incognito) — без логина — перейди по `http://localhost:3000/admin/featuredashboard`.

Expected: моментальный редирект на `/login`. Никакой таблицы фичей не видно.

- [ ] **Step 3: Test scenario B — non-admin user blocked**

Залогинься как обычный пользователь (например, `john@example.com` / `123456` — стандартный seed из `backend/data/users.js`). Перейди по `http://localhost:3000/admin/featuredashboard`.

Expected: редирект на `/login`. (Возможно мелькание таблицы — это известный артефакт паттерна `useEffect`-guard, он же в `UserListScreen`.)

В шапке открой меню пользователя — пункта `Feature Flags` быть **не должно** (user не admin).

- [ ] **Step 4: Test scenario C — admin happy path**

Выйди и залогинься как admin (`admin@example.com` / `123456` — первый seed). В шапке открой dropdown **Admin** — должен быть пункт `Feature Flags` после `Orders`.

Клик → попадаем на `/admin/featuredashboard`. Expected:
- `<h1>` показывает `Feature Flags` (не `Dashboard Features`)
- подзаголовок: `Read-only view of features.json. Manage flags via the feature-flags MCP server.`
- индикатор `● live` справа сверху (зелёный)
- 4 счётчика (Total/Enabled/Testing/Disabled)
- таблица с фичами загружается, наведение на ячейку «Описание» показывает popover

- [ ] **Step 5: Test scenario D — old route returns 404**

Перейди напрямую по `http://localhost:3000/dashboard-features` (старый роут).

Expected: react-router fallback на `<Route path='/' component={HomeScreen} exact />` **не сработает** (т.к. путь не совпадает с `exact`), и страница окажется пустой (без `Route`-матча, отрисовываются только `Header` + `Footer`). Главное — `DashboardFeaturesScreen` **не должен** там рендериться. Линка на эту страницу нигде в UI больше нет.

- [ ] **Step 6: Test scenario E — wired features still work on public pages**

Залогинься как любой user (или logout). Открой главную (`/`), карточку товара (`/product/<id>`), страницу заказа после оплаты. Wired-фичи должны продолжать работать:
- `image_lazy_loading` — `<img loading="lazy">` на товарах (если флаг ON)
- `paypal_express_buttons` — PayPal-кнопка на `OrderScreen` (если флаг ON и заказ не оплачен)
- `product_recommendations` — блок «Customers also bought» на `ProductScreen` (если флаг ON)

Expected: нет регрессий — `FeaturesProvider` живёт в `App.js` поверх роутера, его поведение не зависит от удалённого роута.

- [ ] **Step 7: Stop the dev server**

`Ctrl+C` в терминале 2.

---

### Task 5: Commit

**Files:** the three modified frontend files.

- [ ] **Step 1: Verify clean diff scope**

```bash
git status --short frontend/
```

Expected output:

```
 M frontend/src/App.js
 M frontend/src/components/Header.js
 M frontend/src/screens/DashboardFeaturesScreen.js
```

Если в выводе есть другие изменённые файлы — **остановись** и разберись, прежде чем коммитить (рефакторинг должен быть атомарным).

- [ ] **Step 2: Diff review**

```bash
git diff frontend/src/App.js frontend/src/components/Header.js frontend/src/screens/DashboardFeaturesScreen.js
```

Просмотри глазами:
- `App.js` — одна строка изменена (роут)
- `Header.js` — удалён один `<LinkContainer>` в общем nav, добавлен один в dropdown
- `DashboardFeaturesScreen.js` — добавлены `useSelector` import, `history` prop, два новых hook'а, обновлены `<h1>` и subtitle

Никаких других изменений быть не должно.

- [ ] **Step 3: Stage and commit**

```bash
git add frontend/src/App.js frontend/src/components/Header.js frontend/src/screens/DashboardFeaturesScreen.js
git commit -m "$(cat <<'EOF'
refactor: move feature flags screen into admin section

- route /dashboard-features → /admin/featuredashboard
- add isAdmin guard (redirect to /login for non-admins)
- relocate Header link from public nav to Admin dropdown
- rename h1 "Dashboard Features" → "Feature Flags"
- update subtitle to point users at the feature-flags MCP server

Spec: docs/superpowers/specs/2026-05-10-feature-flags-admin-page-design.md
EOF
)"
```

- [ ] **Step 4: Verify commit**

```bash
git log --oneline -1 && git show --stat HEAD
```

Expected: один коммит, ровно три файла (`App.js`, `Header.js`, `DashboardFeaturesScreen.js`).

---

## Done criteria

- [ ] Anonymous и non-admin не попадают на `/admin/featuredashboard` (редирект на `/login`)
- [ ] Admin видит пункт `Feature Flags` в `Admin` dropdown'е и может открыть страницу
- [ ] `<h1>` показывает `Feature Flags`, subtitle указывает на MCP
- [ ] Линка `Dashboard Features` в общем nav больше нет
- [ ] Wired-фичи на публичных страницах продолжают работать
- [ ] Один атомарный коммит с тремя файлами
