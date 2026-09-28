# FinVault — Digital Wallet & Fintech Platform

![Node](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)

A full-stack fintech web application built with the MERN stack. Users get a demo wallet
(deposit, withdraw, transfer), expense tracking, monthly budgets, analytics, and real-time
alerts. Admins get system-wide stats, user management, a flagged-transactions review queue,
and audit logs.

> **Demo project** — built as a university web-engineering project. It uses demo money,
> synthetic data, and is not audited for production financial use.

---

## Features

### User side
- Register & login with JWT auth (httpOnly cookies, with Bearer fallback for mobile browsers)
- Demo wallet: deposit, withdraw, transfer funds between users
- Transaction history with filters (type, status, date, search) and detail receipts
- Automatic suspicious-transaction flagging with reasons shown on the receipt
- Expense management (add, edit, delete, filter by category)
- Monthly budget tracking: safe / near limit / exceeded, with progress bars and alerts
- Reports & analytics dashboards (income vs expense, category breakdown, budget usage)
- In-app notifications for every key event (transactions, flags, low balance)
- Profile management & password change

### Admin side
- Dashboard with system-wide stats (users, volume, balances, flags)
- User management: block / unblock accounts (blocked users can't transact)
- View all wallets and balances, all transactions with filters
- Flagged-transactions review panel with the triggered rule reasons
- Category management (create, disable)
- Append-only audit log

### Security & backend rules
- All financial logic is backend-controlled — the frontend never decides balances
- **Atomic balance updates**: debits use a single `$inc` with a balance guard, so
  concurrent requests can't overdraw a wallet; transfers roll the debit back if the
  credit fails, so money is never lost mid-transfer
- 7 suspicious-transaction rules:
  1. Transaction exceeds 100,000 PKR
  2. More than 5 transactions in 10 minutes
  3. 3+ failed withdrawals in one day
  4. Same amount transferred 3+ times in a day
  5. New account (< 7 days) making a large transaction
  6. Unusual hours (1 AM – 5 AM)
  7. Withdrawal of 90%+ of balance
- Input validation on every write route (express-validator), ObjectId validation on params
- Rate limiting on auth and wallet routes, Helmet security headers, locked-down CORS
- Passwords hashed with bcrypt; no stack traces leak to clients

---

## Tech stack

| Layer    | Technology |
|----------|------------|
| Frontend | React 18, React Router v6, Recharts, React Icons, Vite |
| Backend  | Node.js 18+, Express 4 |
| Database | MongoDB (Mongoose 8) |
| Auth     | JWT via httpOnly cookies, bcrypt password hashing |
| Hardening| Helmet, express-rate-limit, CORS allowlist |

## Project structure

```
├── backend/
│   └── src/
│       ├── config/         # DB connection
│       ├── controllers/    # Business logic
│       ├── middlewares/    # Auth, role, validation, rate limiting, error handling
│       ├── models/         # Mongoose schemas
│       ├── routes/         # Express routes
│       ├── utils/          # Suspicious-transaction rules, notifications, token helpers
│       ├── validations/    # express-validator chains
│       ├── app.js
│       └── server.js
└── frontend/
    └── src/
        ├── components/     # Navbar, ProtectedRoute, NotificationBell, …
        ├── context/        # AuthContext, ToastContext
        ├── hooks/          # useCountUp
        ├── pages/          # User pages + admin/ pages
        ├── services/       # Axios API modules
        └── utils/          # formatCurrency, formatDate
```

---

## Getting started

### Prerequisites
- Node.js 18+
- A MongoDB database (MongoDB Atlas free tier works fine)

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# edit .env: set MONGO_URI, JWT_SECRET, and (optionally) ADMIN_EMAIL / ADMIN_PASSWORD
npm run dev
```

### 2. Seed the admin account

```bash
cd backend
npm run seed
# Creates the admin from ADMIN_EMAIL / ADMIN_PASSWORD in .env
# (defaults: admin@finvault.com / admin123 — change the password after first login)
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — the app talks to the API at `/api` by default.

## Environment variables

### Backend `.env` (see `.env.example`)

| Variable         | Purpose |
|------------------|---------|
| `PORT`           | API port (default `5000`) |
| `MONGO_URI`      | MongoDB connection string |
| `JWT_SECRET`     | Secret for signing JWTs — use a long random value |
| `JWT_EXPIRE`     | Token lifetime (default `7d`) |
| `NODE_ENV`       | `development` / `production` (controls cookies, logging) |
| `CLIENT_URL`     | Deployed frontend URL for CORS |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Seeded admin credentials (`npm run seed`) |

### Frontend
| Variable       | Purpose |
|----------------|---------|
| `VITE_API_URL` | API base URL. Defaults to `/api` (same-origin). Set it in your hosting provider when the backend is deployed separately — see `frontend/.env.production.example`. |

---

## API endpoints

| Module | Method | Endpoint | Access |
|--------|--------|----------|--------|
| Auth | POST | /api/auth/register | Public |
| Auth | POST | /api/auth/login | Public |
| Auth | POST | /api/auth/logout | Protected |
| Auth | GET | /api/auth/me | Protected |
| Wallet | GET | /api/wallet | User |
| Wallet | GET | /api/wallet/summary | User |
| Wallet | POST | /api/wallet/deposit | User (not blocked) |
| Wallet | POST | /api/wallet/withdraw | User (not blocked) |
| Wallet | POST | /api/wallet/transfer | User (not blocked) |
| Transactions | GET | /api/transactions | User |
| Transactions | GET | /api/transactions/:id | User |
| Expenses | GET/POST | /api/expenses | User |
| Expenses | PUT/DELETE | /api/expenses/:id | User |
| Budgets | GET/POST | /api/budgets | User |
| Notifications | GET | /api/notifications | User |
| Reports | GET | /api/reports/user-dashboard | User |
| Admin | GET | /api/admin/dashboard | Admin |
| Admin | GET | /api/admin/users | Admin |
| Admin | PATCH | /api/admin/users/:id/block | Admin |
| Admin | GET | /api/admin/transactions/flagged | Admin |
| Categories | GET/POST | /api/categories | Mixed |
| Health | GET | /api/health | Public |

---

## Deployment

- **Frontend:** Vercel or Netlify. Set `VITE_API_URL` to your backend URL
  (e.g. `https://your-backend.onrender.com/api`).
- **Backend:** Render or Railway. Set all variables from `.env.example` in the
  platform's environment settings, with `NODE_ENV=production` and
  `CLIENT_URL` pointing at your deployed frontend.
- **Database:** MongoDB Atlas (connection string in `MONGO_URI`).

Checklist: `.env` files are never committed · `node_modules/` is gitignored ·
CORS allowlists only your frontend origin · default admin password is changed.

## License

MIT — see [LICENSE](LICENSE).
