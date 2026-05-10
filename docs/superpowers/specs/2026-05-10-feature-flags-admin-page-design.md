# Feature Flags Admin Page — Refactor

**Date:** 2026-05-10
**Status:** Approved (read-only refactor)
**Scope:** Frontend only

## Problem

Существующий экран `DashboardFeaturesScreen` (read-only обзор `features.json`) живёт на публичном роуте `/dashboard-features` и виден всем пользователям через ссылку в общем `<Nav>` шапки. Управление feature-флагами — admin-задача и не должно быть доступно неаутентифицированным пользователям.

## Goal

Перенести существующий экран в admin-секцию без изменения его функциональности:

- роут: `/dashboard-features` → `/admin/featuredashboard`
- guard: добавить проверку `userInfo.isAdmin` (паттерн из `UserListScreen.js`)
- nav: убрать ссылку из общего nav, добавить в `Admin` `NavDropdown` в шапке

Управление флагами (запись в `features.json`) остаётся **только** через `feature-flags` MCP — backend не трогаем.

## Non-Goals

- **Никаких write-эндпоинтов** на бэкенде. `featureRoutes.js` остаётся read-only (GET, SSE).
- **Никакого admin-UI для toggle / traffic** на фронте. Управление — через MCP, как и раньше.
- **Никакого редиректа** со старого роута на новый. Старый роут просто удаляется (внутренних ссылок нет — проверено `grep`'ом, единственные совпадения — те, что мы и правим).
- **Не трогаем `FeaturesProvider`** в `App.js`. Он остаётся обёрткой над всем приложением: wired-фичи (`image_lazy_loading`, `paypal_express_buttons`, `product_recommendations`) читаются `useFeaturesContext`'ом на публичных страницах (`Product`, `Order`, `Home`) — обычным пользователям контекст нужен.
- **Не вводим breadcrumb** в admin-секции. У существующих admin-экранов (Users/Products/Orders) breadcrumb'а нет — не добавляем непоследовательность.

## Design

### Файлы для правки

| Файл | Изменение |
|---|---|
| `frontend/src/App.js` | заменить роут `/dashboard-features` → `/admin/featuredashboard` |
| `frontend/src/components/Header.js` | убрать ссылку из главного `<Nav>`, добавить пункт в `Admin` `NavDropdown` |
| `frontend/src/screens/DashboardFeaturesScreen.js` | + `isAdmin` guard, переименовать `<h1>` → `Feature Flags` |

### 1. `App.js`

**Удалить:**

```js
<Route path='/dashboard-features' component={DashboardFeaturesScreen} />
```

**Добавить** (рядом с прочими `/admin/*`-роутами, например после `/admin/orderlist`):

```js
<Route path='/admin/featuredashboard' component={DashboardFeaturesScreen} />
```

### 2. `Header.js`

**Удалить из общего `<Nav>`** (строки 35–39):

```js
<LinkContainer to='/dashboard-features'>
  <Nav.Link>
    <i className='fas fa-flag'></i> Dashboard Features
  </Nav.Link>
</LinkContainer>
```

**Добавить в `Admin` `NavDropdown`** (после `Orders`):

```js
<LinkContainer to='/admin/featuredashboard'>
  <NavDropdown.Item>Feature Flags</NavDropdown.Item>
</LinkContainer>
```

Без иконки `fa-flag` — для консистентности с другими пунктами dropdown'а (Users/Products/Orders).

### 3. `DashboardFeaturesScreen.js`

Добавить admin-guard по паттерну `UserListScreen.js:21-27`. Компонент сейчас не принимает `history`-prop — добавим. Также добавим `useSelector` для `userLogin` (импорт уже идёт через `useFeaturesContext`, нужно дополнительно подключить redux-селектор).

```js
import { useSelector } from 'react-redux'
// ...

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

  // ...rest unchanged
}
```

Также:

- `<h1 className='mb-0'>Dashboard Features</h1>` → `<h1 className='mb-0'>Feature Flags</h1>` (терминология `features.json`/MCP).
- Подзаголовок: текущий текст «Live view of `features.json`. Edit the file — the table updates automatically.» вводит в заблуждение для admin-страницы — `CLAUDE.md` запрещает ручную правку `features.json` (только `feature-flags` MCP с проверкой инвариантов). Заменить на: «Read-only view of `features.json`. Manage flags via the `feature-flags` MCP server.» Часть про `bucket` оставить.
- Тело таблицы и нижняя `Card` с описанием wired-фич — без изменений.

## Backend

Не трогаем. `featureRoutes.js` остаётся read-only:

- `GET /api/features` — публичный (нужен `FeaturesProvider`'у)
- `GET /api/features/descriptions` — публичный (нужен экрану, на который пускаем только админов; но эндпоинт сам по себе read-only, защищать не обязательно для рефакторинга)
- `GET /api/features/stream` — публичный SSE (нужен `FeaturesProvider`'у)

Защита эндпоинтов — отдельный non-goal, обсуждается, если/когда добавляем write.

## Тестирование (manual)

1. `npm run dev` → залогиниться как обычный (не-admin) пользователь → попытаться открыть `/admin/featuredashboard` → ожидаем редирект на `/login`.
2. Залогиниться как admin → открыть `Admin` dropdown в шапке → видим пункт `Feature Flags` → клик → попадаем на экран, таблица с фичами загружается, SSE-индикатор `● live`.
3. Открыть `/dashboard-features` напрямую → ожидаем 404 (роут удалён).
4. На публичных страницах (`/`, `/product/:id`, `/order/:id`) wired-фичи продолжают работать — `FeaturesProvider` живёт в `App.js`, не зависит от роута.

## Risks & Mitigations

| Риск | Вероятность | Митигейшн |
|---|---|---|
| Внешний линк ведёт на `/dashboard-features` | низкая | grep по проекту выполнен — внутренних ссылок нет; внешних быть не должно (фича внутренняя) |
| Не-admin застревает на экране до срабатывания `useEffect` (мелькание) | низкая | паттерн идентичен `UserListScreen` — так уже работает в проекте, оставляем для консистентности |
| `FeaturesProvider` отвалится после изменений | очень низкая | его не трогаем |

## Files

- `frontend/src/App.js`
- `frontend/src/components/Header.js`
- `frontend/src/screens/DashboardFeaturesScreen.js`
