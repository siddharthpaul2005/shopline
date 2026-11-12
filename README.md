<div align="center">

# 🛒 ShopLine

### A multi-vendor grocery marketplace with a backend written in plain Java

Customers order from local shops, vendors run their own storefronts, and admins approve vendors and oversee the platform.

![Java](https://img.shields.io/badge/Java-21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Tailwind](https://img.shields.io/badge/Tailwind-3-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)
![No framework](https://img.shields.io/badge/Spring-not%20used-lightgrey?style=for-the-badge&logo=spring&logoColor=white)

[Features](#-features) · [Screenshots](#-screenshots) · [Architecture](#-architecture) · [Getting started](#-getting-started) · [API](#-api-reference) · [Deployment](#-deployment)

<img src="docs/screenshots/customer-home.png" alt="ShopLine customer home page" width="85%" />

</div>

---

## ✨ Why this project is interesting

Most Java web apps are built on Spring Boot, which hides the HTTP server, routing, security and database access behind annotations. **ShopLine's backend builds each of those pieces itself in plain Java 21:**

| Piece | How it's done |
|---|---|
| 🌐 HTTP server | The JDK's built-in `com.sun.net.httpserver.HttpServer`, with **one virtual thread per request** (Java 21) |
| 🧭 Routing | A hand-written `Router` that matches paths like `/api/shops/:id`, checks roles and maps exceptions to JSON errors |
| 🔐 Authentication | JWTs signed with **HMAC-SHA256** using `javax.crypto`, written from scratch rather than with a JWT library |
| 🔑 Passwords | **PBKDF2-HMAC-SHA512** (210,000 iterations, a random salt per user), from the JDK |
| 🗄️ Database | Plain **JDBC** with prepared statements and hand-written SQL. No ORM |
| 🔁 Transactions | A small `Database` class that binds a connection to the current thread, so a whole checkout commits or rolls back as one unit |
| 🧩 Wiring | Every object is created by hand in `Main.java`. No dependency-injection framework |

Only four libraries are used: the **PostgreSQL driver**, **HikariCP** (connection pool), **Jackson** (JSON) and **slf4j-simple** (logging).

---

## 🚀 Features

<table>
<tr>
<td width="33%" valign="top">

### 🧑‍🍳 Customers
- Browse and search shops by category
- One cart that can hold items from several shops
- Checkout splits the cart into **one order per shop**
- Live order tracking: placed → preparing → on the way → delivered
- Cancel orders that are still pending
- Profile, saved delivery address and password change

</td>
<td width="33%" valign="top">

### 🏪 Vendors
- Sign up, then wait for admin approval
- Set up a shop profile
- Add, edit and delete products, with stock levels and active/inactive status
- Process orders through a fixed sequence of steps
- Cancelling an order **puts the stock back**
- Dashboard with real sales numbers

</td>
<td width="33%" valign="top">

### 🛡️ Admins
- Approve, reject or suspend vendors
- Customers only see **approved** shops
- Manage users (admin accounts are protected)
- See every order on the platform
- Platform-wide statistics

</td>
</tr>
</table>

---

## 📸 Screenshots

| Cart (items from two shops) | Order tracking |
|---|---|
| <img src="docs/screenshots/cart.png" alt="Shopping cart" /> | <img src="docs/screenshots/customer-orders.png" alt="Customer orders" /> |
| **Vendor dashboard** | **Vendor order management** |
| <img src="docs/screenshots/vendor-dashboard.png" alt="Vendor dashboard" /> | <img src="docs/screenshots/vendor-orders.png" alt="Vendor orders" /> |
| **Admin dashboard** | |
| <img src="docs/screenshots/admin-dashboard.png" alt="Admin dashboard" /> | |

---

## 🏗 Architecture

```mermaid
flowchart LR
    B["🖥️ Browser<br/>React + Tailwind"] -- "HTTPS / JSON<br/>Bearer JWT" --> R

    subgraph API["☕ Java 21 backend"]
        direction TB
        R["Router<br/><i>CORS · auth · roles · errors</i>"] --> C["Controllers"]
        C --> S["Services<br/><i>business rules</i>"]
        S --> RP["Repositories<br/><i>SQL via JDBC</i>"]
    end

    RP -- "HikariCP pool" --> DB[("🐘 PostgreSQL<br/>Supabase")]
```

Each layer only talks to the layer below it:

| Package | Responsibility |
|---|---|
| [`http/`](backend/src/main/java/com/shopline/http) | `Router`, `Request`, `Response` and `ApiException`: the small web framework |
| [`controller/`](backend/src/main/java/com/shopline/controller) | Maps each URL to a service call. One class per area: auth, customer, vendor, admin |
| [`service/`](backend/src/main/java/com/shopline/service) | Business rules: checkout, the order status sequence, vendor approval, validation |
| [`repository/`](backend/src/main/java/com/shopline/repository) | All SQL. Prepared statements only, which prevents SQL injection |
| [`db/`](backend/src/main/java/com/shopline/db) | Connection pool, thread-bound transactions, schema runner and demo data |
| [`security/`](backend/src/main/java/com/shopline/security) | `JwtService` and `PasswordHasher` |
| [`model/`](backend/src/main/java/com/shopline/model), [`dto/`](backend/src/main/java/com/shopline/dto) | Java `record`s and `enum`s |

### Order lifecycle

```mermaid
stateDiagram-v2
    direction LR
    [*] --> pending: customer checks out
    pending --> processing: vendor accepts
    processing --> shipped
    shipped --> delivered
    pending --> cancelled: customer or vendor
    processing --> cancelled: vendor
    delivered --> [*]
    cancelled --> [*]: stock restored
```

These rules live in one place, [`OrderStatus.canMoveTo()`](backend/src/main/java/com/shopline/model/OrderStatus.java). They're enforced on the server, and the frontend only shows the buttons for moves that are allowed.

### Data model

```mermaid
erDiagram
    USERS ||--o| SHOPS : "owns (vendor)"
    SHOPS ||--o{ PRODUCTS : sells
    USERS ||--o{ ORDERS : "places (customer)"
    SHOPS ||--o{ ORDERS : receives
    ORDERS ||--|{ ORDER_ITEMS : contains
    PRODUCTS |o--o{ ORDER_ITEMS : "refers to"

    USERS {
        bigint id PK
        string email UK
        string password_hash
        string role "admin, vendor or customer"
        string vendor_status "pending, approved or rejected"
    }
    SHOPS {
        bigint id PK
        bigint vendor_id FK
        string name
    }
    PRODUCTS {
        bigint id PK
        bigint shop_id FK
        numeric price
        int stock "never below 0"
    }
    ORDERS {
        bigint id PK
        string status
        numeric total
        string customer_name "copied at checkout"
        string shop_name "copied at checkout"
    }
    ORDER_ITEMS {
        bigint order_id FK
        string name "copied at checkout"
        numeric price "copied at checkout"
        int qty
    }
```

### 🔒 Correctness and security

- **No overselling.** Checkout locks product rows with `SELECT … FOR UPDATE` inside one transaction. This was tested by sending 20 orders at once for an item with 15 in stock: exactly 15 succeeded, and stock ended at 0.
- **Prices come from the database.** A browser that sends `"price": 0.01` is ignored.
- **Order history doesn't change.** Product names and prices are copied into each order, so later edits and deletions don't rewrite past orders.
- **Two updates can't both win.** A status change only applies if the order is still in the status it was read in, so simultaneous edits never overwrite each other.
- **Roles are checked on every request,** and the user is re-loaded from the database, so a deleted account loses access immediately.
- **Passwords are never stored in plain text.** Login takes the same time whether or not the email exists, so it can't be used to discover accounts.
- **Supabase's public API is blocked.** Row level security is turned on, so Supabase's auto-generated REST API can't read the tables.
- **All input is validated.** Image URLs must be `http(s)`, which prevents `javascript:` links.

---

## 🏁 Getting started

> 📘 **Running it for the first time after forking?** Follow **[SETUP.md](SETUP.md)**. It has every command for Windows and macOS/Linux, both database options, and a troubleshooting table. Below is the short version.

### Prerequisites
- **Java 21+** (`java -version`)
- **Node.js 18+** (`node -v`)
- A **PostgreSQL** database. A free [Supabase](https://supabase.com) project works, as does any local Postgres

You don't need to install Maven, because the project includes the Maven wrapper (`mvnw`).

### 1. Get a database
1. Create a Supabase project.
2. Click **Connect** and copy the **Session pooler** connection string.
3. Put your database password in place of `[YOUR-PASSWORD]`. If you don't know it, reset it under **Database → Settings**.

You don't need to create any tables. The server creates them on first start.

### 2. Start the backend
```bash
cd backend
cp .env.example .env          # then fill in the values (see the table below)
./mvnw package                # Windows: mvnw.cmd package — builds the jar and runs the tests
java -jar target/shopline-backend.jar
```
You should see:
```
INFO  Database schema is up to date
INFO  Created admin account you@example.com
INFO  ShopLine API listening on port 8080
```

### 3. Start the frontend
```bash
cd frontend
cp .env.example .env.local    # VITE_API_URL=http://localhost:8080
npm install
npm run dev
```
Then open **http://localhost:5173**.

### 🎭 Demo accounts
With `SEED_DEMO_DATA=true`, the server fills an empty database with 4 shops, about 20 products and some sample orders:

| Role | Email | Password |
|---|---|---|
| 🛡️ Admin | your `ADMIN_EMAIL` | your `ADMIN_PASSWORD` |
| 🏪 Vendor | `vendor@shopline.test` | `demo1234` |
| 🧑‍🍳 Customer | `customer@shopline.test` | `demo1234` |

Set `VITE_DEMO_MODE=true` on the frontend to show click-to-fill shortcuts for these accounts on the login page.

### ⚙️ Configuration

**Backend** (`backend/.env`, or environment variables on your host)

| Variable | Required | Description |
|---|:-:|---|
| `DATABASE_URL` | ✅ | `postgresql://user:pass@host:port/db` (the Supabase form) or a `jdbc:postgresql://…` URL |
| `JWT_SECRET` | ✅ | A random string of at least 32 characters that signs login tokens. Generate one with `node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | ✅ | The first admin account, created on startup if it doesn't exist |
| `CORS_ORIGINS` | ✅ | Frontend URLs allowed to call the API, comma-separated |
| `SEED_DEMO_DATA` | | `true` loads sample data into an empty database |
| `PORT` | | Default `8080`. Hosting platforms set this automatically |
| `DB_POOL_SIZE` | | Default `5`, which suits Supabase's free tier |
| `JWT_TTL_HOURS` | | Default `168` (7 days) |

**Frontend** (`frontend/.env.local`, or your host's environment settings)

| Variable | Description |
|---|---|
| `VITE_API_URL` | URL of the backend, e.g. `http://localhost:8080` |
| `VITE_DEMO_MODE` | `true` shows the demo-account shortcuts on the login page |

---

## 📡 API reference

Every endpoint returns JSON. Authenticated endpoints need an `Authorization: Bearer <token>` header. Errors always look like `{ "message": "Only 3 left of Cherry Tomatoes" }`, with a matching status code (`400`, `401`, `403`, `404`, `409`).

<details>
<summary><b>🔑 Auth</b></summary>

| Method | Path | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | public | `{ name, email, password, role: "customer" \| "vendor" }` → `{ token, user }` |
| `POST` | `/api/auth/login` | public | `{ email, password }` → `{ token, user }` |
| `GET` | `/api/auth/me` | signed in | The current user |
| `PUT` | `/api/auth/password` | signed in | `{ currentPassword, newPassword }` |

</details>

<details>
<summary><b>🧑‍🍳 Customer</b></summary>

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/api/shops` | public | Approved shops |
| `GET` | `/api/shops/:id` | public | One shop |
| `GET` | `/api/shops/:id/products` | public | Active products in a shop |
| `POST` | `/api/orders` | customer | Checkout: `{ items: [{ productId, qty }], deliveryAddress }` → the orders created |
| `GET` | `/api/customer/orders` | customer | Order history |
| `PUT` | `/api/customer/orders/:id/cancel` | customer | Cancel a pending order |
| `GET` / `PUT` | `/api/customer/profile` | customer | Read or update the profile |

</details>

<details>
<summary><b>🏪 Vendor</b></summary>

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/api/vendor/stats` | vendor | Dashboard numbers and approval status |
| `GET` / `POST` / `PUT` | `/api/vendor/shop` | vendor | Read, create or update your shop |
| `GET` / `POST` | `/api/vendor/products` | vendor | List or create products |
| `PUT` / `DELETE` | `/api/vendor/products/:id` | vendor | Update or delete a product |
| `GET` | `/api/vendor/orders` | vendor | Orders for your shop |
| `PUT` | `/api/vendor/orders/:id/status` | vendor | `{ status }`, following the order lifecycle |

</details>

<details>
<summary><b>🛡️ Admin</b></summary>

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/api/admin/stats` | admin | Platform statistics |
| `GET` | `/api/admin/vendors` | admin | All vendors and their status |
| `PUT` | `/api/admin/vendors/:id/approve` | admin | Approve a vendor |
| `PUT` | `/api/admin/vendors/:id/reject` | admin | Reject or suspend a vendor |
| `GET` | `/api/admin/users` | admin | All users |
| `DELETE` | `/api/admin/users/:id` | admin | Delete a user (not allowed for admins) |
| `GET` | `/api/admin/orders` | admin | All orders |

</details>

**Health check:** `GET /api/health` → `{ "status": "ok" }`. It also checks the database connection.

---

## ☁️ Deployment

```mermaid
flowchart LR
    U(("👤 Users")) --> V["▲ Vercel<br/>frontend"]
    V -- "API calls" --> RN["Render<br/>Java backend (Docker)"]
    RN --> SB[("Supabase<br/>Postgres")]
```

### Backend on Render
1. Go to **New → Web Service** and connect this repo.
2. Set **Root Directory** to `backend` and **Runtime** to **Docker**. Render builds the image from [`backend/Dockerfile`](backend/Dockerfile).
3. Add the environment variables `DATABASE_URL`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` and `CORS_ORIGINS` (your Vercel URL).
4. Set **Health Check Path** to `/api/health`.

Railway, Fly.io and Koyeb work the same way, since the Docker image listens on `$PORT`.
> Note: Render's free tier puts the service to sleep when idle, so the first request after a while takes about 30 seconds.

### Frontend on Vercel
1. Go to **Add New → Project**, import this repo and set **Root Directory** to `frontend`.
2. Add `VITE_API_URL` set to your Render URL (and optionally `VITE_DEMO_MODE=true`).
3. Deploy. [`vercel.json`](frontend/vercel.json) makes page refreshes on routes like `/orders` work. Netlify is also supported, through [`public/_redirects`](frontend/public/_redirects).

Finally, add the Vercel URL to the backend's `CORS_ORIGINS`.

---

## 🧪 Testing

```bash
cd backend
./mvnw test
```

**23 unit tests** cover JWT signing, expiry and tamper detection; password hashing; the order status rules; cart validation; and parsing of Supabase connection strings.

The full flow was also tested in a real browser, as customer, vendor, admin and a newly registered vendor, including the simultaneous-checkout test described under [Correctness and security](#-correctness-and-security).

---

## 📁 Project structure

```
shopline/
├── backend/                          ☕ Java 21 REST API
│   ├── pom.xml                       Maven build (produces one runnable jar)
│   ├── Dockerfile                    Container image for deployment
│   ├── mvnw, mvnw.cmd                Maven wrapper (no install needed)
│   ├── .env.example                  Configuration template
│   └── src/
│       ├── main/java/com/shopline/
│       │   ├── Main.java             Entry point: creates and wires everything
│       │   ├── config/               Environment / .env loading
│       │   ├── http/                 Router, Request, Response, ApiException
│       │   ├── controller/           URL → service mapping
│       │   ├── service/              Business rules
│       │   ├── repository/           SQL
│       │   ├── security/             JWT and password hashing
│       │   ├── db/                   Connection pool, transactions, demo data
│       │   ├── model/, dto/          Records and enums
│       │   └── util/                 Validation and logging
│       ├── main/resources/db/schema.sql
│       └── test/java/com/shopline/   JUnit 5 tests
│
├── frontend/                         ⚛️ React single-page app
│   ├── src/
│   │   ├── pages/                    admin/, vendor/, customer/, auth/
│   │   ├── components/               Layouts, Table, Modal, Badge, ...
│   │   ├── context/                  AuthContext, CartContext
│   │   └── services/api.js           Axios client and every API call
│   ├── tailwind.config.js
│   └── vercel.json
│
└── docs/screenshots/
```

---

## 🗺 Roadmap

- [ ] Product image uploads (Supabase Storage) instead of image URLs
- [ ] Shop ratings and reviews after delivery
- [ ] Online payments (Stripe / Razorpay)
- [ ] Email notifications when an order changes status
- [ ] Pagination and server-side search for large catalogs

---

<div align="center">

Built by **[siddharthpaul2005](https://github.com/siddharthpaul2005)**, with a backend written in plain Java (no framework).

</div>
