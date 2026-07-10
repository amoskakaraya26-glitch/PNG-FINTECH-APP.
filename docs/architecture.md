# PNG Fintech E-Wallet Architecture

## System Overview

The PNG Fintech E-Wallet is a backend API for managing digital wallets, Savis digital ID integration, and bank account connections for Papua New Guinea users.

## Components

### 1. **Wallet Service**
- Create and manage PGK wallets
- Track wallet balance and transactions
- Support topup, transfers, and payments

### 2. **Savis Digital ID Integration**
- User identity verification via Savis API
- KYC compliance for PNG financial regulations
- Session-based verification flow

### 3. **Bank Connectors**
- KINA Bank API integration
- Bank of South Pacific (BSP) API integration
- Link bank accounts to wallets
- Check balance, transfer funds, transaction history

### 4. **API Layer**
- Express.js REST API
- Wallet routes (`/api/wallet`)
- KYC routes (`/api/kyc`)
- Bank routes (`/api/bank`)

## Folder Structure

```
src/
├── api/
│   ├── controllers/
│   ├── routes/
│   │   ├── wallet.routes.ts
│   │   ├── kyc.routes.ts
│   │   └── bank.routes.ts
│   ├── services/
│   │   └── wallet.service.ts
│   ├── middleware/
│   ├── models/
│   └── utils/
├── integrations/
│   ├── savis/
│   │   └── service.ts
│   ├── banks/
│   │   ├── common/
│   │   │   └── connector.ts
│   │   ├── kina/
│   │   │   └── connector.ts
│   │   ├── bsp/
│   │   │   └── connector.ts
│   │   └── service.ts
│   ├── payments/
│   ├── telco/
│   └── notifications/
├── app/
├── common/
│   ├── types/
│   ├── constants/
│   ├── validators/
│   └── dtos/
└── database/
    ├── migrations/
    └── seeds/
```

## Data Flow

### Wallet Creation & Top Up
1. User calls `POST /api/wallet/create`
2. WalletService creates a new wallet with initial balance (default 0)
3. User can `POST /api/wallet/topup` to add funds
4. Transaction is recorded and wallet balance updated

### Savis KYC Flow
1. User calls `POST /api/kyc/initiate` with phone and name
2. SavisService creates a verification session
3. User receives redirect URL or QR code
4. After verification, Savis calls callback endpoint
5. `POST /api/kyc/callback` processes verification result

### Bank Account Link & Transfer
1. User calls `POST /api/bank/link` with bank, account, pin
2. BankConnector validates credentials with bank API
3. Account details and balance are stored/verified
4. User can transfer funds using `POST /api/bank/transfer`
5. Bank API processes the transaction

## Database (Future)
- Currently using in-memory storage
- Will migrate to PostgreSQL for production
- Migrations in `src/database/migrations/`

## Environment Variables
- `SAVIS_API_KEY`, `SAVIS_BASE_URL` — Savis integration credentials
- `KINA_API_KEY`, `KINA_BASE_URL` — KINA bank API credentials
- `BSP_API_KEY`, `BSP_BASE_URL` — BSP bank API credentials
- `JWT_SECRET` — JWT token signing key
- `ENCRYPTION_KEY` — Data encryption key

## Security Considerations
- All API calls use HTTPS (production)
- JWT tokens for authentication (future)
- Bank API calls use Bearer token authentication
- Sensitive data (PINs, credentials) are encrypted
- Helmet.js for HTTP headers security
- CORS configured for frontend access