# 0003 — PayPal Client ID отдаётся через API endpoint, не через build-time env

- **Status:** Accepted
- **Confidence:** HIGH — `backend/server.js` содержит `app.get('/api/config/paypal', (req, res) => res.send(process.env.PAYPAL_CLIENT_ID))`; `frontend/src/screens/OrderScreen.js` вызывает `axios.get('/api/config/paypal')` перед инжектом PayPal SDK

## Context

Фронтенд должен загрузить PayPal JS SDK с правильным `client-id`. Client ID — это не секрет (он попадает в браузер в любом случае), но его нужно как-то передать в React-приложение.

## Decision

Client ID хранится в `PAYPAL_CLIENT_ID` на сервере. При открытии страницы заказа `OrderScreen` делает `GET /api/config/paypal`, получает строку с Client ID и динамически инжектит тег `<script src="https://www.paypal.com/sdk/js?client-id=${clientId}">` в `document.body`. После загрузки SDK устанавливается флаг `sdkReady = true` и рендерится кнопка `<PayPalButton>`.

Endpoint публичный (без `protect`-middleware), отдаёт plain text.

## Alternatives Considered

- **`REACT_APP_PAYPAL_CLIENT_ID` в build-time env** — стандартный CRA-способ; значение вшивается в JS-бандл при сборке. Не требует дополнительного HTTP-запроса. Минус: при смене Client ID нужна пересборка и редеплой фронтенда.
- **Хардкод в компоненте** — очевидно неприемлемо для переключения между sandbox и production окружениями.

## Consequences

**Плюсы:**
- Client ID можно поменять через переменную окружения на сервере без пересборки фронтенда
- Удобно для переключения sandbox ↔ production: меняется одна env-переменная, фронтенд подхватывает при следующей загрузке страницы

**Минусы:**
- Дополнительный HTTP round-trip на каждое открытие страницы заказа — PayPal SDK не загружается до завершения этого запроса, пользователь видит `<Loader>` дольше
- Endpoint не защищён: любой может получить Client ID (впрочем, он всё равно виден в браузере после загрузки SDK)
- Если бэкенд недоступен, PayPal-кнопка не появится даже если сам PayPal работает
- `PAYPAL_CLIENT_ID` читается при старте сервера — изменение `.env` требует рестарта, что неочевидно