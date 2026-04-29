# 0001 — JWT хранится в localStorage, не в httpOnly cookie

- **Status:** Accepted
- **Confidence:** HIGH — явно в `frontend/src/actions/userActions.js` (`localStorage.setItem('userInfo', ...)`) и `frontend/src/store.js` (initialState читается из localStorage)

## Context

Пользователь должен оставаться залогиненным между перезагрузками страницы. Токен нужно где-то персистировать на клиенте и передавать с каждым API-запросом в заголовке `Authorization: Bearer <token>`.

## Decision

JWT и сопутствующие данные (`_id`, `name`, `email`, `isAdmin`, `token`) сохраняются в `localStorage` под ключом `userInfo`. При инициализации Redux store значение читается оттуда и попадает в `initialState.userLogin`. Все защищённые action creators читают токен из Redux state (`getState().userLogin.userInfo.token`) и вручную добавляют его в заголовок каждого axios-запроса.

Затронутые файлы:
- `frontend/src/actions/userActions.js` — `login`, `register`, `updateUserProfile` пишут в localStorage; `logout` удаляет все ключи
- `frontend/src/store.js` — `userInfoFromStorage` читается при старте
- `frontend/src/actions/cartActions.js` — аналогично для `cartItems`, `shippingAddress`

## Alternatives Considered

- **httpOnly cookie** — браузер отправляет автоматически, недоступен через JS (защита от XSS). Потребовал бы изменения backend: установка cookie на `/api/users/login`, CSRF-защита для мутирующих запросов, `credentials: 'include'` в axios.
- **sessionStorage** — не переживает закрытие вкладки; пользователю пришлось бы логиниться заново при каждом открытии.

## Consequences

**Плюсы:**
- Простая реализация без изменений на backend
- Работает с любым клиентом (SPA, мобильное приложение) без cookie-специфики
- Нет проблем с CORS и `SameSite` при cross-origin деплое

**Минусы:**
- Уязвим к XSS: любой вредоносный скрипт на странице может прочитать токен через `localStorage.getItem('userInfo')`
- Токен живёт 30 дней (`expiresIn: '30d'` в `generateToken.js`) — нет механизма отзыва до истечения срока
- Изменение схемы `userInfo` (новое поле, переименование) требует явной очистки localStorage у всех пользователей