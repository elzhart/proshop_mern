# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

Backend runs on port **5001** (port 5000 is occupied by macOS AirPlay Receiver/ControlCenter on this machine).

Required `.env` in the project root:
```
NODE_ENV=development
PORT=5001
MONGO_URI=mongodb://admin:secret@localhost:27017/proshop?authSource=admin
JWT_SECRET=...
PAYPAL_CLIENT_ID=...
```

The frontend dev proxy (`frontend/package.json`) points to `http://127.0.0.1:5001`.

Frontend requires `NODE_OPTIONS=--openssl-legacy-provider` because `react-scripts` 3.x uses a webpack version incompatible with Node.js v17+. This flag is already set in the root `package.json` `client` script.

## Architecture

### Backend (`backend/`)

Express REST API using ES Modules (`"type": "module"`). Entry point is `backend/server.js`.

Routes are mounted at:
- `/api/products` — product CRUD, reviews, search, pagination, top-rated
- `/api/users` — auth, profile, admin user management
- `/api/orders` — order creation, PayPal payment, delivery status
- `/api/upload` — image upload via `multer`, files served from `/uploads`
- `/api/config/paypal` — returns `PAYPAL_CLIENT_ID` to the client

Auth uses JWT Bearer tokens (`authMiddleware.js` exports `protect` and `admin`). `protect` attaches `req.user`; `admin` checks `req.user.isAdmin`. Passwords are bcrypt-hashed via a Mongoose pre-save hook on `userModel.js`.

In production, the server also statically serves the React build from `frontend/build/`.

### Frontend (`frontend/src/`)

React 16 + React Bootstrap. State is managed with Redux (legacy pattern: constants → actions → reducers → store).

Redux slices mirror the backend domains:
- `productList`, `productDetails`, `productCreate`, `productUpdate`, `productDelete`, `productReviewCreate`, `productTopRated`
- `userLogin`, `userRegister`, `userDetails`, `userUpdateProfile`, `userList`, `userDelete`, `userUpdate`
- `orderCreate`, `orderDetails`, `orderPay`, `orderDeliver`, `orderListMy`, `orderList`
- `cart`

Persistence: `cartItems` and `shippingAddress` are saved to `localStorage`; `userInfo` (including JWT) is saved to `localStorage` on login and loaded as `initialState.userLogin` in the store.

Checkout is a wizard: **Cart → Shipping → Payment → PlaceOrder → Order**. `CheckoutSteps` component renders the wizard breadcrumb.

Admin routes (`/admin/*`) are accessible only when `userInfo.isAdmin` is true — enforced both in the UI (redirect in screens) and on the backend (`admin` middleware).

### Data seeding

`backend/data/users.js` and `backend/data/products.js` contain sample data. The first user in `users.js` is treated as the admin owner of all seeded products.