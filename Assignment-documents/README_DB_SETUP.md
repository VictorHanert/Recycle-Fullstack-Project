# Database Setup & Test Environment Guide

This guide explains how to import and run the relational **MySQL** database for this project in a **test environment** with full operational capabilities. It covers both **Docker Compose** and **local** setups, and includes a quick verification checklist.

> The database schema is created programmatically using SQLAlchemy models. Seeding uses `backend/seed.py`, which **drops & recreates** all tables and inserts realistic test data (users, categories, products, images, favorites, views, conversations, etc.).

---

## What gets created

**Tables (relational / MySQL):**
- `users`, `locations`, `categories`, `products`
- `product_images`, `product_price_history`
- `colors`, `materials`, `tags`, and junctions: `product_colors`, `product_materials`, `product_tags`
- `favorites`, `item_views`
- Messages subsystem: `conversations`, `conversation_participants`, `messages`
- Archived sales: `sold_item_archive`

**Referential integrity & constraints (examples):**
- FKs with `ON DELETE` rules (e.g., `CASCADE`, `RESTRICT`, `SET NULL` as appropriate)
- Indexes on common query fields (e.g., product price tuple, location city+postcode, etc.)
- Basic check constraints (e.g., non‑negative quantity)
- Uniqueness on tag/material/color names

**Seeded test data (high‑level):**
- ~150 users (plus an **admin user**: `admin@test.com` / `admin123`)
- Locations, categories, and 100 products (approx. 80 active / 20 sold)
- Images (Unsplash API is attempted; falls back to a static path string if unreachable)
- Favorites, item views, conversations/messages
- Price history and sold archive entries

> Re-running the seeder will reset the database (drop + create + reseed).

---

## 1) Prerequisites

- **Option A (Recommended):** Docker & Docker Compose
- **Option B (Local):** MySQL 8.x + Python 3.11+ with Poetry

Paths below assume the project root: `fullstack_project/`

```bash
fullstack_project/
├─ backend/
│  ├─ app/...
│  ├─ seed.py
│  ├─ .env
│  └─ Dockerfile
├─ frontend/...
└─ docker-compose.yml
```

---

## 2) Docker Compose Setup (recommended)

This will spin up a MySQL service and run the backend in a containerized environment.

### Step A — Start only MySQL first

From project root:

```bash
docker compose up -d mysql-db
```

- MySQL is exposed on your host at **`localhost:3307`** (mapped to container `3306`).
- Default credentials (from `docker-compose.yml`):
  - `MYSQL_ROOT_PASSWORD=root`
  - `MYSQL_DATABASE=marketplace`

> Wait until the MySQL service reports **healthy** (the Compose healthcheck will ping it).

### Step B — Build the backend image

```bash
docker compose build backend
```

### Step C — Create schema & seed test data

Run the project’s seeder inside the backend container. This will **drop+create** all tables and insert test data:

```bash
docker compose run --rm backend poetry run python seed.py
```

If everything works, you’ll see summary output like:
```
✅ Users: 150 and Products: 100 (80 active, 20 sold)
✅ Admin user: admin@test.com / admin123
```

### Step D — Start backend (and optionally frontend)

```bash
docker compose up -d backend
# optional
docker compose up -d frontend
```

### Step E — Verify

- Backend health endpoint (should show `mysql_configured: true`):
  - `http://localhost:8000/health`
- You can also connect to MySQL directly (CLI or client) on `localhost:3307` and check that the tables exist in the `marketplace` schema.

> **Resetting data**: Re-run the seeder step (C). It drops and recreates everything.

---

## 3) Local (bare‑metal) Setup

Use this if you prefer your local MySQL instead of the Compose service.

### Step A — Start MySQL locally

- Ensure **MySQL 8.x** is running locally.
- Create a database named `marketplace`, or modify your `.env` accordingly.

### Step B — Configure backend

Edit `backend/.env` and set the `DATABASE_URL` to match your local MySQL. Examples:

- Using local MySQL default port:
  ```env
  DATABASE_URL=mysql+pymysql://root:root@localhost:3306/marketplace
  ```

- If using the Docker‑exposed port during local development:
  ```env
  DATABASE_URL=mysql+pymysql://root:root@localhost:3307/marketplace
  ```

Install dependencies and run the seeder:

```bash
cd backend
poetry install
poetry run python seed.py
```

This will drop+create tables and seed the database with test data.

### Step C — Run backend locally (optional)

```bash
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Verify at `http://localhost:8000/health`.

---

## 4) Notes & Troubleshooting

- **Seeder networking**: When using Compose, the `backend` service connects to MySQL via the service name `mysql-db` (Compose networking). When running locally outside Compose, use `localhost:3306` or your local port.
- **Images in seed data**: The seeder attempts to fetch images from Unsplash. If the request fails or no access key is available, a fallback path string is used as the image URL. The app should remain functional, but image URLs may point to a placeholder path in that case.
- **Uploads directory**: If you test endpoints that upload images/files, ensure `backend/uploads/` is writable (Compose mounts the code; permissions are typically fine).
- **Re-seeding**: Running `seed.py` again resets the database (drop + create + reseed). Useful for clean test runs.
- **Health check**: `GET /health` on the backend confirms the service and DB config at runtime.

---

## 5) Quick Commands Recap

**Compose path:**
```bash
docker compose up -d mysql-db
docker compose build backend
docker compose run --rm backend poetry run python seed.py
docker compose up -d backend  # (and optionally: docker compose up -d frontend)
```

**Local path:**
```bash
cd backend
poetry install
poetry run python seed.py
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 6) Credentials for Testing

- Admin user (seeded):
  - Email: `admin@test.com`
  - Password: `admin123`

---

## 7) Optional: Import/Export as SQL

If you need a traditional SQL dump (e.g., for a different environment):

- **Export (from local MySQL):**
  ```bash
  mysqldump -h localhost -P 3307 -u root -proot marketplace > marketplace_dump.sql
  ```
- **Import (to local MySQL):**
  ```bash
  mysql -h localhost -P 3307 -u root -proot marketplace < marketplace_dump.sql
  ```

> The authoritative schema for this project resides in the SQLAlchemy models. Always re-run the seeder for the latest schema and test data.

---

**You now have a fully operational test database.** 
