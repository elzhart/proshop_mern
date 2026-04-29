# Architecture — proshop_mern

## C4 Container Diagram

Use-case показан цифрами ①–⑪: **Покупатель оформляет заказ и оплачивает через PayPal**.

```mermaid
flowchart LR

    subgraph FE["Frontend · React 16 + Redux · :3000"]
        direction TB

        subgraph SCREENS["screens/"]
            HS["HomeScreen.js"]
            PRDS["ProductScreen.js"]
            CS["CartScreen.js"]
            SS["ShippingScreen.js"]
            PS["PaymentScreen.js"]
            POS["PlaceOrderScreen.js"]
            OS["OrderScreen.js"]
            PROF["ProfileScreen.js"]
            PLS["ProductListScreen.js"]
            PES["ProductEditScreen.js"]
            ULS["UserListScreen.js"]
            UES["UserEditScreen.js"]
            OLS["OrderListScreen.js"]
        end

        subgraph ACTIONS["actions/"]
            CA["cartActions.js"]
            OA["orderActions.js"]
            PA["productActions.js"]
            UA["userActions.js"]
        end

        ST["store.js · Redux"]
    end

    subgraph BE["Backend · Express / Node.js · :5001"]
        direction TB

        SRV["server.js\nGET /api/config/paypal"]

        subgraph ROUTES["routes/"]
            OR["orderRoutes.js\nPOST / · GET /\nGET /:id · PUT /:id/pay\nPUT /:id/deliver · GET /myorders"]
            PRR["productRoutes.js\nGET / · POST /\nGET /:id · PUT /:id\nDELETE /:id · POST /:id/reviews\nGET /top"]
            URR["userRoutes.js\nPOST / · POST /login\nGET|PUT /profile\nGET|PUT|DELETE /:id"]
            UPR["uploadRoutes.js\nPOST /"]
        end

        subgraph MW["middleware/"]
            AM["authMiddleware.js\nprotect · admin"]
            EM["errorMiddleware.js\nnotFound · errorHandler"]
        end

        subgraph CTRL["controllers/"]
            OC["orderController.js\naddOrderItems · getOrderById\nupdateOrderToPaid · updateOrderToDelivered\ngetMyOrders · getOrders"]
            PC["productController.js\ngetProducts · getProductById\ncreateProduct · updateProduct\ndeleteProduct · createProductReview\ngetTopProducts"]
            UC["userController.js\nauthUser · registerUser\ngetUserProfile · updateUserProfile\ngetUsers · deleteUser\ngetUserById · updateUser"]
        end

        SEED["seeder.js · CLI\nnpm run data:import\nnpm run data:destroy"]
    end

    subgraph DATA["Data Layer"]
        direction TB

        subgraph MODELS["models/"]
            OM["orderModel.js"]
            PM["productModel.js"]
            UM["userModel.js"]
        end

        MONGO[("MongoDB 6\ndb: proshop\n:27017")]
        LS[("localStorage · browser\ncartItems\nuserInfo + JWT\nshippingAddress")]
        UPL[("uploads/\nlocal disk")]
    end

    subgraph EXT["External Services"]
        direction TB
        PPSDK["PayPal JS SDK\npaypal.com/sdk/js"]
        PPAPI["PayPal API\npayment verification"]
    end

    %% ── use-case: Checkout & PayPal payment ──────────────────
    CS      -->|"① checkout →"| SS
    SS      -->|"② shipping saved →"| PS
    PS      -->|"③ method saved →"| POS
    POS     -->|"④ createOrder"| OA
    OA      -->|"⑤ POST /api/orders"| OR
    OR      -->|"⑥ protect"| AM
    AM      -.->|"findById JWT"| UM
    OR      -->|"⑦"| OC
    OC      -->|"⑧ order.save()"| OM
    OM      -->  MONGO
    POS     -->|"⑨ redirect"| OS
    OS      -->|"⑩ GET /api/config/paypal"| SRV
    SRV     -.->|"clientId"| OS
    OS      -->|"⑪ load SDK"| PPSDK
    PPSDK   -->|"charge"| PPAPI
    PPAPI   -.->|"paymentResult"| OS
    OS      -->|"PUT /api/orders/:id/pay"| OR

    %% ── other flows ──────────────────────────────────────────
    HS      --> PA --> PRR --> PC
    UA      --> URR --> UC
    CA      -.->|"persist"| LS
    UPR     -->|"multer"| UPL
    SEED    -->|"insertMany / deleteMany"| MONGO
    PM      --> MONGO
    UM      --> MONGO
    UC      --> UM
    PC      --> PM
    ST      -.- CA & OA & PA & UA

    %% ── styles: use-case path ────────────────────────────────
    style CS   fill:#fef9c3,stroke:#ca8a04
    style SS   fill:#fef9c3,stroke:#ca8a04
    style PS   fill:#fef9c3,stroke:#ca8a04
    style POS  fill:#fef9c3,stroke:#ca8a04
    style OS   fill:#fef9c3,stroke:#ca8a04
    style OA   fill:#fef9c3,stroke:#ca8a04
    style OC   fill:#fef9c3,stroke:#ca8a04
    style OR   fill:#fef9c3,stroke:#ca8a04
    style PPSDK fill:#dbeafe,stroke:#2563eb
    style PPAPI fill:#dbeafe,stroke:#2563eb
    style MONGO fill:#d1fae5,stroke:#059669
    style LS    fill:#d1fae5,stroke:#059669
    style UPL   fill:#d1fae5,stroke:#059669
```

### Легенда

| Цвет | Значение |
|------|----------|
| 🟡 жёлтый | Use-case path: Checkout → PayPal payment |
| 🔵 синий | Внешние платёжные сервисы |
| 🟢 зелёный | Хранилища данных |

### Entry points (все)

| Файл | Тип | Методы / маршруты |
|------|-----|-------------------|
| `backend/controllers/orderController.js` | HTTP handler | `addOrderItems`, `getOrderById`, `updateOrderToPaid`, `updateOrderToDelivered`, `getMyOrders`, `getOrders` |
| `backend/controllers/productController.js` | HTTP handler | `getProducts`, `getProductById`, `createProduct`, `updateProduct`, `deleteProduct`, `createProductReview`, `getTopProducts` |
| `backend/controllers/userController.js` | HTTP handler | `authUser`, `registerUser`, `getUserProfile`, `updateUserProfile`, `getUsers`, `deleteUser`, `getUserById`, `updateUser` |
| `backend/routes/uploadRoutes.js` | HTTP handler | `POST /api/upload` (multer) |
| `backend/server.js` | HTTP handler | `GET /api/config/paypal` |
| `backend/seeder.js` | CLI | `npm run data:import`, `npm run data:destroy` |
