# Running ShopLine locally

This guide takes you from a fresh fork to the full app running on your own computer, with a database, demo data and all three roles working. It takes about 15 minutes.

Commands are given for **Windows (PowerShell)** and **macOS / Linux**. Where they differ, both are shown.

---

## 0. What you need installed

| Tool | Version | Check with | Get it from |
|---|---|---|---|
| **Git** | any | `git --version` | https://git-scm.com |
| **Java (JDK)** | **21 or newer** | `java -version` | https://adoptium.net (choose Temurin 21, LTS) |
| **Node.js** | **18 or newer** | `node -v` | https://nodejs.org (LTS) |

You do **not** need Maven, because the project includes a Maven wrapper that downloads it automatically. You also don't need to install PostgreSQL if you use Supabase (Option A below).

> Make sure `java -version` prints **21** or higher. If it shows an older version, install JDK 21 and open a new terminal.

---

## 1. Fork and clone

1. On GitHub, click **Fork** on the ShopLine repository.
2. Clone **your fork**. Replace `YOUR-USERNAME` with your GitHub username:

```bash
git clone https://github.com/YOUR-USERNAME/shopline.git
cd shopline
```

---

## 2. Set up a database

Choose **one** option.

### Option A: Supabase (free, nothing to install)

1. Sign up at https://supabase.com and click **New project**.
   - Choose a **database password** and **save it somewhere**, because you'll need it in step 3.
   - Choose the region closest to you.
2. Once the project is ready, click the green **Connect** button at the top.
3. Find the **Session pooler** connection string and copy it. It looks like this:
   ```
   postgresql://postgres.abcdefghijk:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
   ```
4. Replace `[YOUR-PASSWORD]`, **including the square brackets**, with your database password.
   - Forgot the password? Go to **Database → Settings → Reset database password**.
   - If the password contains `@ : / # ?`, URL-encode them: `@` → `%40`, `:` → `%3A`, `/` → `%2F`, `#` → `%23`, `?` → `%3F`. A password with only letters and numbers avoids this.

> Use the **Session pooler**, not "Direct connection". The direct connection only works over IPv6, which many home networks don't support.

### Option B: Local PostgreSQL

**With Docker:**
```bash
docker run --name shopline-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=shopline -p 5432:5432 -d postgres:17
```
Your connection string is then:
```
postgresql://postgres:postgres@localhost:5432/shopline
```

**With PostgreSQL already installed:** create an empty database called `shopline` (for example `createdb -U postgres shopline`) and use:
```
postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/shopline
```

You don't need to create any tables, with either option. The backend creates them automatically the first time it starts.

---

## 3. Configure the backend

Copy the example settings file:

```powershell
# Windows (PowerShell)
Copy-Item backend\.env.example backend\.env
```
```bash
# macOS / Linux
cp backend/.env.example backend/.env
```

Open **`backend/.env`** in an editor and fill it in:

```properties
# Your connection string from step 2
DATABASE_URL=postgresql://postgres.abcdefghijk:MyPassword123@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres

# Any long random text (32+ characters). Generate one with:
#   node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
JWT_SECRET=paste-the-generated-value-here

# Choose your own admin login. These are created on first start.
ADMIN_NAME=ShopLine Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin12345

CORS_ORIGINS=http://localhost:5173

# true = load sample shops, products, customers and orders
SEED_DEMO_DATA=true
```

| Setting | Rule |
|---|---|
| `JWT_SECRET` | At least **32 characters**, or the server refuses to start |
| `ADMIN_PASSWORD` | At least **6 characters**, or the server refuses to start |
| `ADMIN_EMAIL` | Anything that looks like an email. Nothing is sent to it; it's only a login name |
| `CORS_ORIGINS` | Must exactly match the address the frontend runs on (step 5) |

`backend/.env` is git-ignored, so your password won't be committed.

---

## 4. Build and start the backend

```powershell
# Windows (PowerShell)
cd backend
.\mvnw.cmd package
java -jar target\shopline-backend.jar
```
```bash
# macOS / Linux
cd backend
chmod +x mvnw        # only needed once
./mvnw package
java -jar target/shopline-backend.jar
```

- The **first** `package` downloads Maven and the libraries, which takes 1–3 minutes. It also runs the 23 unit tests, which should all pass.
- **Run `java -jar` from inside the `backend` folder.** The server reads `.env` from the folder it's started in.

It's working when you see:

```
INFO  Database schema is up to date
INFO  Created admin account admin@example.com
INFO  Seeding demo data...
INFO  Demo data ready. Customer: customer@shopline.test / demo1234, vendor: vendor@shopline.test / demo1234
INFO  ShopLine API listening on port 8080 (CORS origins: [http://localhost:5173])
```

To double-check, open **http://localhost:8080/api/health** in a browser. It should show `{"status":"ok"}`.

**Leave this terminal running.**

---

## 5. Start the frontend

Open a **second terminal** in the project folder:

```powershell
# Windows (PowerShell)
cd frontend
Copy-Item .env.example .env.local
npm install
npm run dev
```
```bash
# macOS / Linux
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Open **`frontend/.env.local`** and set:

```properties
VITE_API_URL=http://localhost:8080
VITE_DEMO_MODE=true
```

If you edit `.env.local` while `npm run dev` is running, stop it with `Ctrl+C` and start it again. Vite only reads this file on startup.

Then open the address Vite prints, normally **http://localhost:5173**.

---

## 6. Log in and try it

| Role | Email | Password |
|---|---|---|
| 🛡️ Admin | the `ADMIN_EMAIL` you chose | the `ADMIN_PASSWORD` you chose |
| 🏪 Shopkeeper | `vendor@shopline.test` | `demo1234` |
| 🧑‍🍳 Customer | `customer@shopline.test` | `demo1234` |

More shopkeepers (all with password `demo1234`): `bakery@shopline.test`, `dairy@shopline.test`, and `seafood@shopline.test`. The last one is **still waiting for admin approval**.

The login page has click-to-fill buttons for the customer and shopkeeper.

**A quick tour:**
1. **Customer:** add items from two shops, then check out. One order is created per shop.
2. **Shopkeeper:** in a private/incognito window, open **Orders** and move the order to Accept, then Shipped, then Delivered.
3. **Customer:** refresh **My Orders** and watch the tracker move.
4. **Admin:** under **Vendors**, approve **Ocean Fresh**. It then appears on the customer home page.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `DATABASE_URL is not set` | `backend/.env` is missing, or you started `java -jar` from the wrong folder. `cd backend` first |
| `password authentication failed` | Wrong database password in `DATABASE_URL`, or special characters that aren't URL-encoded. Reset the Supabase password to letters and numbers only |
| `Connection refused` / `UnknownHostException` | With Supabase, use the **Session pooler** string (step 2A). With local Postgres, check it's running on port 5432 |
| `JWT secret must be at least 32 characters` | Make `JWT_SECRET` longer |
| `ADMIN_PASSWORD must be at least 6 characters` | Make `ADMIN_PASSWORD` longer |
| `Address already in use` (port 8080) | Something else is using port 8080. Add `PORT=8081` to `backend/.env` and set `VITE_API_URL=http://localhost:8081` in `frontend/.env.local` |
| Website says **"Can't reach the server"** | The backend isn't running, or `VITE_API_URL` is wrong. Check http://localhost:8080/api/health, then restart `npm run dev` after editing `.env.local` |
| Login does nothing; the browser console shows a **CORS** error | The frontend isn't on `http://localhost:5173` (Vite uses 5174 if 5173 is busy). Put the exact address in `CORS_ORIGINS` and restart the backend |
| No demo accounts / "Invalid email or password" for the demo users | `SEED_DEMO_DATA` wasn't `true` on the first start. Set it to `true` and restart; the data loads once |
| Changed `ADMIN_EMAIL`/`ADMIN_PASSWORD` but the old login still works | The admin is only created if that email doesn't exist yet. A **new** email creates a second admin |
| `java: command not found` or `UnsupportedClassVersionError` | Install **JDK 21+** and open a new terminal |
| `./mvnw: Permission denied` (macOS/Linux) | Run `chmod +x mvnw` |

---

## Starting again next time

You only build once. After that:

```bash
# Terminal 1
cd backend
java -jar target/shopline-backend.jar      # Windows: target\shopline-backend.jar

# Terminal 2
cd frontend
npm run dev
```

If you change the Java code, rebuild with `./mvnw package` (Windows: `.\mvnw.cmd package`) before running again.

## Starting with an empty database

- **Supabase:** open the **SQL Editor** and run the line below, then restart the backend. It recreates the tables and the demo data.
  ```sql
  drop table if exists order_items, orders, products, shops, users cascade;
  ```
- **Docker:** `docker rm -f shopline-db`, then rerun the `docker run` command from step 2B.
