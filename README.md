# ProShop

Интернет-магазин электроники на MERN-стеке. Покупатели могут просматривать товары, оставлять отзывы, добавлять в корзину и оплачивать через PayPal. Администраторы управляют товарами, пользователями и заказами через раздел `/admin`.

Проект основан на курсе [Brad Traversy](https://github.com/bradtraversy/proshop_mern). Upstream репозиторий объявил его устаревшим в пользу [proshop-v2](https://github.com/bradtraversy/proshop-v2) (Redux Toolkit). Этот форк поддерживается отдельно.

---

## Tech Stack

| Часть        | Технология                     | Версия    |
|--------------|-------------------------------|-----------|
| Runtime      | Node.js                        | ≥ 14.6    |
| Backend      | Express                        | ^4.17.1   |
| ODM          | Mongoose                       | ^5.10.6   |
| Database     | MongoDB                        | 6 (Docker)|
| Auth         | jsonwebtoken + bcryptjs        | ^8.5.1 / ^2.4.3 |
| File upload  | multer                         | ^1.4.2    |
| Frontend     | React                          | ^16.13.1  |
| State        | Redux + redux-thunk            | ^4.0.5 / ^2.3.0 |
| UI           | React Bootstrap                | ^1.3.0    |
| HTTP client  | axios                          | ^0.20.0   |
| Payments     | react-paypal-button-v2         | ^2.6.2    |
| Bundler      | react-scripts (CRA)            | 3.4.3     |

---

## Структура папок

```
proshop_mern/
├── backend/
│   ├── config/        # подключение к MongoDB (db.js)
│   ├── controllers/   # логика роутов (product, user, order)
│   ├── data/          # seed-данные (users.js, products.js)
│   ├── middleware/    # authMiddleware (protect, admin), errorMiddleware
│   ├── models/        # Mongoose-схемы: User, Product, Order
│   ├── routes/        # Express-роуты
│   ├── utils/         # generateToken.js (JWT)
│   └── server.js      # точка входа
├── frontend/
│   └── src/
│       ├── actions/   # Redux action creators
│       ├── components/# переиспользуемые компоненты
│       ├── constants/ # типы Redux-экшнов
│       ├── reducers/  # Redux-редьюсеры
│       ├── screens/   # страницы (Home, Product, Cart, Checkout, Admin...)
│       └── store.js   # конфигурация Redux store
├── docs/
│   ├── project-data/  # проектная документация (ADR, API, features, runbooks, incidents, pages)
│   ├── adr/           # архитектурные решения этого форка
│   └── architecture.md
├── uploads/           # загруженные изображения товаров (локально)
├── docker-compose.yml # MongoDB с авторизацией
└── .env               # переменные окружения (не в git)
```

---

## Установка и запуск

### 1. Prerequisites

- **Node.js** v14.6 или выше (проверено на v20.5.1)
- **Docker** и **Docker Compose** — для MongoDB  
  Альтернатива: любой MongoDB 6, доступный локально

### 2. Клонирование

```bash
git clone <repo-url>
cd proshop_mern
```

### 3. Переменные окружения

Создай файл `.env` в корне проекта:

```env
NODE_ENV=development
PORT=5001
MONGO_URI=mongodb://admin:secret@localhost:27017/proshop?authSource=admin
JWT_SECRET=any_random_string_here
PAYPAL_CLIENT_ID=your_paypal_sandbox_client_id
```

> **PORT**: порт 5000 на macOS Monterey+ занят системным процессом AirPlay Receiver.  
> Используй 5001 (или любой другой свободный) и обнови proxy в `frontend/package.json` на тот же порт.

Все переменные реально читаются в коде:
- `PORT` — `backend/server.js`
- `MONGO_URI` — `backend/config/db.js`
- `JWT_SECRET` — `backend/utils/generateToken.js`, `backend/middleware/authMiddleware.js`
- `PAYPAL_CLIENT_ID` — `backend/server.js` (отдаётся через `/api/config/paypal`)

### 4. Запуск MongoDB

```bash
docker compose up -d
```

Это поднимает MongoDB 6 с авторизацией (логин `admin`, пароль `secret`, база `proshop`). Данные хранятся в Docker volume `mongo_data` — переживают перезапуск контейнера.

### 5. Установка зависимостей

```bash
# Зависимости бэкенда (из корня)
npm install

# Зависимости фронтенда
cd frontend && npm install && cd ..
```

### 6. Наполнение базы тестовыми данными

После первого запуска MongoDB база пустая — без этого шага главная страница будет пустой.

```bash
npm run data:import
```

Тестовые аккаунты после сидинга:

| Email                  | Пароль | Роль  |
|------------------------|--------|-------|
| admin@example.com      | 123456 | Admin |
| john@example.com       | 123456 | User  |
| jane@example.com       | 123456 | User  |

### 7. Запуск

```bash
npm run dev
```

Запускает бэкенд (nodemon, порт из `.env`) и фронтенд (CRA, порт 3000) одновременно через `concurrently`.

- Фронтенд: http://localhost:3000  
- API: http://localhost:5001/api

---

## Полезные команды

```bash
# Только бэкенд
npm run server

# Только фронтенд
npm run client

# Очистить базу и залить заново
npm run data:destroy && npm run data:import

# Продакшн-сборка фронтенда
cd frontend && npm run build
```

---

## Troubleshooting

### Главная страница пустая (нет товаров)
База данных не заполнена. Запусти:
```bash
npm run data:import
```

### `Error: listen EADDRINUSE :::5000` (или другой порт)
Порт занят предыдущим процессом или системным сервисом. На macOS порт 5000 — AirPlay Receiver. Смени `PORT` в `.env` на свободный (например, 5001) и обнови `"proxy"` в `frontend/package.json` на тот же адрес.

Убить зависший процесс:
```bash
lsof -ti :5001 | xargs kill -9
```

### `Error: ERR_OSSL_EVP_UNSUPPORTED` при запуске фронтенда
`react-scripts` 3.x несовместим с OpenSSL в Node.js v17+. Флаг `NODE_OPTIONS=--openssl-legacy-provider` уже прописан в скрипте `client` в корневом `package.json` — дополнительных действий не нужно.

### `MongoServerError: Authentication failed`
Убедись, что в `MONGO_URI` есть параметр `authSource=admin`:
```
mongodb://admin:secret@localhost:27017/proshop?authSource=admin
```
Без него Mongo ищет пользователя в базе `proshop`, а не в `admin`.

### PayPal-кнопка не появляется на странице заказа
`PAYPAL_CLIENT_ID` не задан или неверный. Нужен **sandbox** Client ID из [PayPal Developer Dashboard](https://developer.paypal.com/). После изменения `.env` перезапусти бэкенд — значение читается при старте сервера.

### Изменения в Mongoose-модели не применяются / странные ошибки
Пересоздай данные:
```bash
npm run data:destroy && npm run data:import
```

---

## Документация

Полная проектная документация находится в [`docs/project-data/`](./docs/project-data/):

| Папка | Содержимое |
|-------|-----------|
| [`adrs/`](./docs/project-data/adrs/) | Архитектурные решения: MongoDB, Redux, JWT, PayPal, Bootstrap |
| [`api/`](./docs/project-data/api/) | Спецификации API-эндпоинтов |
| [`features/`](./docs/project-data/features/) | Описание фич: auth, cart, checkout, payments, catalog, admin |
| [`incidents/`](./docs/project-data/incidents/) | Разборы инцидентов |
| [`pages/`](./docs/project-data/pages/) | Поведение каждого экрана |
| [`runbooks/`](./docs/project-data/runbooks/) | Инструкции по эксплуатации |

---

## License

MIT © 2020 [Traversy Media](https://traversymedia.com)
