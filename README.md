# Stockwise — Inventory & Purchase Management System

A small-business inventory and purchasing application built with **React + Vite**, **FastAPI**, **SQLAlchemy**, **Alembic**, and **PostgreSQL**.

## Requirements covered

- Product, category, and supplier records with CRUD APIs (product delete is a safe deactivate).
- Purchase orders with draft → ordered → received / cancelled workflow.
- Stock receipts, issues, and physical-count adjustments.
- Database row locking and a single database transaction for stock updates.
- Stock cannot become negative; database constraints and API validation enforce this.
- Immutable stock transaction history with user, type, quantity, reference, notes, and timestamp.
- Product search by name/SKU, category filter, low-stock filter, and supplier search API.
- Dashboard summary, recent transactions, low-stock alert list, and CSV low-stock report.
- JWT authentication, password hashing, and role checks for Admin and Staff.
- Alembic database migrations, sample data, and automated service tests.

## Roles

- **Admin:** full write access to catalogue, suppliers, categories, purchase orders, and user registration administration (the first registered user is Admin).
- **Staff:** can view/search/filter products, view suppliers and purchase orders, view stock transaction history, record stock issues only, and view/download inventory, low-stock, and transaction reports. Staff cannot create or modify catalogue records or purchase orders, receive stock, or make stock-count adjustments.

The public registration endpoint assigns **Admin to the first account** and **Staff to subsequent accounts**. For a real deployment, disable public registration after creating the initial admin and provision staff accounts through a controlled process. Do not expose the demo seed password in production.

## Project layout

```text
Inventory-purchase-System/
├── backend/
│   ├── app/
│   │   ├── core/          # JWT and role dependencies
│   │   ├── models/        # normalized SQLAlchemy tables
│   │   ├── routers/       # CRUD and workflow APIs
│   │   ├── schemas/       # Pydantic validation
│   │   └── services/      # transactional stock and purchase logic
│   ├── alembic/           # schema migrations
│   ├── scripts/seed.py    # demo data
│   ├── tests/             # automated tests
│   ├── .env.example
│   └── requirements.txt
└── frontend/
    ├── src/components/
    ├── src/context/       # authentication state
    ├── src/pages/         # dashboard and forms
    ├── src/routes/
    ├── src/services/      # Axios client and JWT header
    └── .env.example
```

## Setup on Windows

### 1. PostgreSQL

Create a database in pgAdmin or psql:

```sql
CREATE DATABASE inventory_purchase_db;
```

### 2. Backend

Open a terminal in `backend`:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `backend/.env` and enter your PostgreSQL password. Set a long random `SECRET_KEY`. For example, generate one with:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Run migrations and start the API:

```powershell
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

API documentation: <http://127.0.0.1:8000/docs>
Health check: <http://127.0.0.1:8000/health>
Database check: <http://127.0.0.1:8000/api/v1/test-db>

### 3. Sample data (optional but recommended)

In another terminal, from `backend` with the virtual environment active:

```powershell
python -m scripts.seed
```

The seed script creates a demo admin, categories, supplier, products, and opening-stock history. Configure `SEED_ADMIN_EMAIL=admin@example.com` and `SEED_ADMIN_PASSWORD` in `.env` before running it. Use a normal email domain: reserved domains such as `.local` are rejected by Pydantic email validation. The login endpoint uses OAuth2 form fields (`username` = email, plus `password`), not a JSON `{email, password}` body. Defaults are for local demonstration only.

If you do not run the seed script, open the frontend and register the first user; that first account becomes Admin. All later public registrations become Staff.

### 4. Frontend

Open another terminal in `frontend`:

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Open the URL Vite prints (usually <http://localhost:5173>; if 5173 is busy it may use 5174). The backend CORS policy permits localhost development ports to avoid the common Vite 5174 Network Error.

Frontend API base URL is configured in `frontend/.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

Restart Vite after changing `.env`.

## Main workflow

1. **Admin registers / signs in.** The first account is Admin; later registrations are Staff.
2. **Admin creates categories and suppliers.** Sample data pre-populates these for a quick demo.
3. **Admin creates products.** Each product starts with zero stock and a minimum-stock threshold.
4. **Admin creates a purchase order.** Select a supplier, products, quantities, and unit prices. The order starts as Draft.
5. **Admin marks the order Ordered.** When the goods arrive, Admin marks it Received.
6. **Receiving posts stock atomically.** The API locks each product row, increases its quantity, writes a receipt transaction for every line, and marks the order Received in the same database transaction. Re-receiving is blocked.
7. **Staff records stock issues only.** Staff can issue available stock from Stock Transactions. Receipt and stock-count adjustment operations are Admin-only. An issue larger than available stock is rejected.
8. **Dashboard and Reports update.** The dashboard shows product/supplier/stock totals, low-stock alerts, purchase orders, and recent movement. Reports can export the full inventory snapshot, transaction history, and low-stock list to CSV.

## Important API endpoints

All business APIs are under `/api/v1` and protected endpoints require `Authorization: Bearer <access_token>`.

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login` (OAuth2 form: `username` + `password`), `GET /auth/me` |
| Products | `GET/POST /products/`, `GET /products/{id}`, `PUT/DELETE /products/{id}`, `GET /products/?keyword=&category_id=&low_stock=` |
| Categories | `GET/POST /categories/`, `GET/PUT/DELETE /categories/{id}` |
| Suppliers | `GET/POST /suppliers/`, `GET/PUT/DELETE /suppliers/{id}`, `GET /suppliers/search?keyword=` |
| Purchases | `GET/POST /purchases/`, `GET/PUT /purchases/{id}` |
| Stock | `POST/GET /inventory/transactions`, `GET /inventory/transactions/product/{id}`, `GET /inventory/stock/{id}` |
| Dashboard | `GET /dashboard/summary`, `GET /dashboard/low-stock`, `GET /dashboard/recent-transactions` |

## Tests

From `backend` after installing requirements:

```powershell
pytest -q
```

The inventory service tests cover receipt/issue updates, prevention of negative stock, transaction history, and zero-stock physical-count adjustments using an isolated in-memory SQLite database.

## Notes

- The ZIP intentionally excludes `.env`, Git history, virtual environments, `node_modules`, and compiled caches. Create local `.env` files from the provided examples.
- Keep real database passwords and JWT secrets out of Git.
- Stock receipt/issue/adjustment operations must go through the inventory API; do not edit product quantity directly in SQL.
