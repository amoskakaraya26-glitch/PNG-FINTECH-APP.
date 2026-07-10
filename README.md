# 🇵🇬 PNG Wallet — Digital Wallet for Papua New Guinea

A full-featured fintech e-wallet app built with React, Node.js/Express, TypeScript, and PostgreSQL. Features include P2P transfers, bill payments, QR codes, KYC verification, spending analytics, referrals, admin dashboard, and an AI assistant.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ **OR** a free [Neon.tech](https://neon.tech) cloud database

### 1. Clone & Install
```bash
npm install
npm run frontend:install
```

### 2. Configure Environment
```bash
cp .env.production.example .env
```
Edit `.env` and set at minimum:
- `DATABASE_URL` — your PostgreSQL connection string (e.g. from Neon.tech)
- `JWT_SECRET` — any long random string

### 3. Run Database Migrations
```bash
npm run db:migrate
```

### 4. Start Development Servers
```bash
npm run dev:full
```
- **Frontend:** http://localhost:3001
- **Backend API:** http://localhost:3000
- **Health check:** http://localhost:3000/health

---

## 📦 Production Build

```bash
npm run build          # compile backend TypeScript → dist/
npm run frontend:build # build React frontend → src/app/build/
npm start              # serve production backend
```

---

## ☁️ Deploy to Render.com (Recommended — Free)

1. Push code to GitHub
2. Go to [render.com](https://render.com) → **New → Blueprint**
3. Connect your GitHub repo — Render will detect `render.yaml` automatically
4. Set these environment variables in Render dashboard:
   - `DATABASE_URL` — your Neon/Render Postgres connection string
   - `JWT_SECRET` — a strong random 64-char string
   - `FRONTEND_URL` — your Render app URL (e.g. `https://png-wallet.onrender.com`)
   - `NODE_ENV` = `production`
5. Click **Deploy** ✅

---

## 🚂 Deploy to Railway

1. Push code to GitHub
2. Go to [railway.app](https://railway.app) → **New Project → Deploy from GitHub**
3. Railway detects `railway.json` automatically
4. Add a **PostgreSQL** plugin from Railway dashboard
5. Set env vars: `JWT_SECRET`, `FRONTEND_URL`, `NODE_ENV=production`
6. Railway auto-sets `DATABASE_URL` from the plugin ✅

---

## 🐳 Deploy with Docker

```bash
cp .env.production.example .env.production
# Edit .env.production with your values

docker-compose up --build
```
App runs at http://localhost:3000

---

## 🌐 Deploy to Heroku

```bash
heroku create png-wallet-app
heroku addons:create heroku-postgresql:mini
heroku config:set JWT_SECRET=your_secret NODE_ENV=production
heroku config:set FRONTEND_URL=https://png-wallet-app.herokuapp.com
git push heroku main
heroku run npm run db:migrate
```

---

## 🔑 Required Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `JWT_SECRET` | Secret for JWT tokens (64+ chars) | ✅ |
| `NODE_ENV` | `production` or `development` | ✅ |
| `FRONTEND_URL` | Frontend URL for CORS | ✅ |
| `PORT` | Server port (default: 3000) | ❌ |
| `OPENAI_API_KEY` | Enables AI chat assistant | ❌ |
| `SMTP_*` | Email notifications | ❌ |
| `SAVIS_API_KEY` | Savis Digital ID KYC | ❌ |
| `KINA_API_KEY` | Kina Bank integration | ❌ |
| `BSP_API_KEY` | BSP Bank integration | ❌ |

---

## 📋 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start backend (nodemon) |
| `npm run dev:full` | Start backend + frontend together |
| `npm run build` | Compile TypeScript |
| `npm run db:migrate` | Run database migrations |
| `npm run frontend:install` | Install frontend dependencies |
| `npm run frontend:build` | Build React app for production |
| `npm test` | Run backend tests |

---

## 🗄️ Database Migrations

Migrations run automatically in order:
- `001_initial_schema.sql` — wallets, transactions, kyc, bank_accounts
- `002_full_schema.sql` — users, contacts, notifications, bills, merchants, scheduled payments, referrals, disputes, AI chat, limits

To run manually:
```bash
npm run db:migrate
```

---

## 🏗️ Project Structure

```
PNG-FINTECH-APP/
├── src/
│   ├── api/              # Express backend
│   │   ├── controllers/  # Route handlers
│   │   ├── middleware/   # Auth, rate limiting
│   │   ├── routes/       # API routes
│   │   └── server.ts     # App entry point
│   ├── app/              # React frontend
│   │   └── src/
│   │       ├── pages/    # All 20+ feature pages
│   │       ├── components/
│   │       ├── context/  # Auth context
│   │       └── services/ # API client
│   ├── database/
│   │   ├── migrations/   # SQL migration files
│   │   └── connection.ts # DB connection pool
│   └── integrations/     # Bank, Savis, telco integrations
├── Dockerfile
├── docker-compose.yml
├── render.yaml           # Render.com config
├── railway.json          # Railway config
└── Procfile              # Heroku config
```

---

## 🔒 Security Notes

- All passwords are hashed with **bcrypt**
- Authentication uses **JWT** (7-day expiry)
- Rate limiting: **20 req/15min** on auth, **200 req/15min** global
- HTTPS enforced via **helmet**
- Database credentials via environment variables only — **never hardcoded**

---

## 📞 Support

For issues, raise a ticket via the in-app Support page or contact the development team.


## Quick Start

1. Install root dependencies:
   `npm install`
2. Install frontend dependencies:
   `npm run frontend:install`
3. Start the full development environment:
   `npm run dev:full`

## Scripts

- `npm run dev` - start the backend development API server.
- `npm run frontend:dev` - start the frontend React app on port 3001 using `cross-env`.
- `npm run dev:full` - run backend and frontend together.
- `npm run start:dev` - alias for `npm run dev:full` to start the full local development environment.
- `npm run build` - compile the backend TypeScript.
- `npm run frontend:build` - build the React frontend for production.
- `npm run serve:frontend` - serve the built frontend app from `src/app/build` on `http://localhost:5000`.
- `npm run start:prod` - build and start the production backend and frontend together.
- `npm run test:backend` - run backend Jest tests.
- `npm run test:frontend` - run frontend tests without watch mode.
- `npm run test:e2e` - run Cypress end-to-end tests.
- `npm run predeploy` - run lint, backend tests, frontend tests, e2e tests, and both builds.
- `npm run setup` - run database migrations and install frontend dependencies.

## Development Ports

- Backend API: `http://localhost:3000`
- Frontend app: `http://localhost:3001`

If port 3001 is already in use, the frontend will prompt to use a different port.

## Notes

- The root `frontend:dev` script is cross-platform via `cross-env`.
- The frontend is configured to proxy API requests to `http://localhost:3000`.
- Use `npm run dev:full` for the complete local development experience.
