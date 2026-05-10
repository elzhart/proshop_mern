# Repository Guidelines

## Project Structure & Module Organization

This is a MERN shopping cart application. The Express API lives in `backend/`: `controllers/` hold request logic, `routes/` define API endpoints, `models/` contain Mongoose schemas, `middleware/` contains auth/error handlers, `data/` has seed data, and `server.js` is the entry point. The React 16/CRA client lives in `frontend/src/`: `screens/` are page-level views, `components/` are reusable UI pieces, `actions/`, `reducers/`, and `constants/` make up Redux state, and `utils/`, `hooks/`, and `context/` contain shared client logic. Static frontend assets are in `frontend/public/`; uploaded product images are stored in `uploads/`. Architecture notes and ADRs are in `docs/`.

## Build, Test, and Development Commands

- `npm install` installs backend dependencies from the repository root.
- `cd frontend && npm install` installs client dependencies.
- `docker compose up -d` starts the local MongoDB service.
- `npm run data:import` seeds products and users; `npm run data:destroy` clears seeded data.
- `npm run dev` starts backend `nodemon` and the CRA frontend together.
- `npm run server` starts only the API; `npm run client` starts only the frontend.
- `cd frontend && npm test` runs React/Jest tests.
- `cd frontend && npm run build` creates a production frontend build.

## Coding Style & Naming Conventions

Use JavaScript ES modules, two-space indentation, single quotes, and no semicolons, matching the existing code. React components and screen files use PascalCase, for example `ProductScreen.js` and `SearchBox.js`. Redux files follow domain-based names such as `productActions.js`, `productReducers.js`, and `productConstants.js`. Backend route/controller/model files use lower camelCase names with role suffixes, such as `orderRoutes.js` and `userModel.js`.

## Testing Guidelines

Frontend tests use CRA’s Jest setup with React Testing Library dependencies. Place tests in `frontend/src/__tests__/` or beside the code as `*.test.js`. Keep characterization tests explicit about current behavior, especially when locking known bugs before refactors. Run `cd frontend && npm test -- --watchAll=false` for a non-watch test pass before submitting changes.

## Design rules

Дизайн-система проекта разделена по аудитории — у admin и consumer разные design language. При генерации/редактировании UI следуй соответствующему файлу:

- **Admin** (`/admin/*` страницы — Feature Flags, Users, Products, Orders): [`DESIGN.admin.md`](./DESIGN.admin.md) — Light SaaS Clean, slate + emerald accent, tool-feel, NO shadows, 1px borders, density-first
- **Consumer** (public `/`, `/product/:id`, `/cart`, `/login`, `/register` + auth checkout `/profile`, `/shipping`, `/payment`, `/placeorder`, `/order/:id`): [`DESIGN.consumer.md`](./DESIGN.consumer.md) — Tech-product gradient, zinc + violet→indigo gradient, subtle shadows, shop-feel

Оба файла содержат секцию 11 «Anti-AI-slop Guards» (mandatory) с правилами против AI-look: запрет 2-колоночных comparison-блоков, generic shadcn, неконтролируемых gradients, UX-страдает-ради-картинки. Перед генерацией UI — прочитай эту секцию и project-specific overrides внутри неё (admin запрещает gradients глобально; consumer разрешает controlled gradient на крупных surface'ах как brand signature).

Источник anti-slop правил: [`docs/anti-slop-supplement.md`](./docs/anti-slop-supplement.md).

## Commit & Pull Request Guidelines

Recent history uses both Conventional Commit-style messages (`refactor: ...`, `docs: ...`, `fix(scope): ...`) and milestone labels (`NH-1 ...`, `M3_B2 ...`). Prefer concise imperative messages with a type/scope when possible, for example `fix(orderController): handle missing payer`. Pull requests should include a short summary, linked issue or task, test results, and screenshots for UI changes.

## Security & Configuration Tips

Keep `.env` local. Required variables include `NODE_ENV`, `PORT`, `MONGO_URI`, `JWT_SECRET`, and `PAYPAL_CLIENT_ID`. If the API port changes, keep `frontend/package.json` `proxy` aligned with it.
