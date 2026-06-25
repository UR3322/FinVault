# FinVault — Digital Wallet & Fintech Platform

A full-stack fintech web application built with the MERN stack. Allows users to manage a demo wallet, track expenses, set budgets, and receive real-time alerts. Admins can monitor the system, block users, and review flagged transactions.

---

## Tech Stack

- **Frontend:** React 18, React Router v6, Recharts, React Icons, Vite
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT via httpOnly cookies, bcrypt password hashing

---

## Features

### User Side
- Register & login with JWT authentication
- Demo wallet: deposit, withdraw, transfer funds
- Transaction history with filters (type, status, date, search)
- Transaction receipts with suspicious flag indicator
- Expense management (add, edit, delete, filter by category)
- Monthly budget tracking with status: safe / near limit / exceeded
- Budget progress bars and warning alerts
- Reports & analytics with charts (income vs expense, category breakdown, budget usage)
- Notifications for all key events
- Profile management & password change

### Admin Side
- Admin dashboard with system-wide stats
- User management: block/unblock users
- View all wallets and balances
- View all transactions with filters
- Flagged transactions panel with suspicious reasons displayed
- Category management (create, disable)
- Audit logs

### Security & Backend Rules
- All financial logic is backend-controlled (never from frontend)
- 7 suspicious transaction rules:
  1. Transaction exceeds 100,000 PKR
  2. More than 5 transactions in 10 minutes
  3. 3+ failed withdrawals in one day
  4. Same amount transferred 3+ times in a day
  5. New account (<7 days) making large transaction
  6. Unusual hours (1AM–5AM)
  7. Withdrawal of 90%+ of balance
- Blocked users cannot perform any financial operations
- ObjectId validation on all param routes
- Rate limiting on auth and wallet routes
- Helmet security headers, CORS configured

---

## Project Structure

```
project/
├── backend/
│   └── src/
│       ├── config/         # DB connection
│       ├── controllers/    # Business logic
│       ├── middlewares/    # Auth, role, validation, error handling
│       ├── models/         # Mongoose schemas
│       ├── routes/         # Express routes
│       ├── utils/          # Helpers, suspicious rules, notifications
│       ├── validations/    # express-validator chains
│       ├── app.js
│       └── server.js
└── frontend/
    └── src/
        ├── components/     # Navbar, ProtectedRoute, NotificationBell, etc.
        ├── context/        # AuthContext, ToastContext
        ├── hooks/          # useCountUp
        ├── pages/          # All user and admin pages
        │   └── admin/
        ├── services/       # Axios API calls
        └── utils/          # formatCurrency, formatDate
```

---

## Setup & Installation

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

### 1. Clone & Setup Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm run dev
```

### 2. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

### 3. Seed Admin Account

```bash
cd backend
npm run seed
# Creates: admin@finvault.com / admin123
```

---

## Environment Variables

### Backend `.env`
```
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/finvault
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=7d
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### Frontend `.env` (optional)
```
VITE_API_URL=/api
```

---

## API Endpoints

| Module | Method | Endpoint | Access |
|--------|--------|----------|--------|
| Auth | POST | /api/auth/register | Public |
| Auth | POST | /api/auth/login | Public |
| Auth | GET | /api/auth/me | Protected |
| Wallet | GET | /api/wallet | User |
| Wallet | POST | /api/wallet/deposit | User (not blocked) |
| Wallet | POST | /api/wallet/withdraw | User (not blocked) |
| Wallet | POST | /api/wallet/transfer | User (not blocked) |
| Transactions | GET | /api/transactions | User |
| Expenses | GET/POST | /api/expenses | User |
| Budgets | GET/POST | /api/budgets | User |
| Notifications | GET | /api/notifications | User |
| Reports | GET | /api/reports/user-dashboard | User |
| Admin | GET | /api/admin/dashboard | Admin |
| Admin | GET | /api/admin/users | Admin |
| Admin | PATCH | /api/admin/users/:id/block | Admin |
| Admin | GET | /api/admin/transactions/flagged | Admin |
| Health | GET | /api/health | Public |

---

## Deployment

- **Frontend:** Deploy to Vercel or Netlify (set `VITE_API_URL` to backend URL)
- **Backend:** Deploy to Render or Railway (set all env vars in platform settings)
- **Database:** MongoDB Atlas (connection string in `MONGO_URI`)

Make sure:
- CORS is set to your deployed frontend URL in backend `.env` (`CLIENT_URL`)
- `.env` files are NOT committed to GitHub
- `node_modules/` is in `.gitignore`

---

*Built with MERN Stack | FinVault — Web Engineering Semester Project*
