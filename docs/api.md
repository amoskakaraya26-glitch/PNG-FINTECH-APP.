# API Documentation

## Base URL
```
http://localhost:3000/api
```

## Endpoints

### Wallet API (`/wallet`)

#### 1. Create Wallet
- **POST** `/wallet/create`
- **Body:**
  ```json
  {
    "userId": "user123"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "wallet": {
      "id": "wallet-uuid",
      "userId": "user123",
      "balance": 0,
      "currency": "PGK",
      "status": "active",
      "createdAt": "2026-05-07T12:00:00Z",
      "updatedAt": "2026-05-07T12:00:00Z"
    }
  }
  ```

#### 2. Get Wallet
- **GET** `/wallet/:walletId`
- **Response:**
  ```json
  {
    "success": true,
    "wallet": { ... }
  }
  ```

#### 3. Top Up Wallet
- **POST** `/wallet/topup`
- **Body:**
  ```json
  {
    "walletId": "wallet-uuid",
    "amount": 100
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "transaction": {
      "id": "tx-uuid",
      "walletId": "wallet-uuid",
      "type": "topup",
      "amount": 100,
      "currency": "PGK",
      "status": "completed",
      "timestamp": "2026-05-07T12:00:00Z"
    }
  }
  ```

#### 4. Transfer Between Wallets
- **POST** `/wallet/transfer`
- **Body:**
  ```json
  {
    "fromWalletId": "wallet1-uuid",
    "toWalletId": "wallet2-uuid",
    "amount": 50
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "transaction": { ... }
  }
  ```

#### 5. Get Transaction History
- **GET** `/wallet/:walletId/history`
- **Response:**
  ```json
  {
    "success": true,
    "transactions": [ ... ]
  }
  ```

---

### KYC / Savis API (`/kyc`)

#### 1. Initiate Verification
- **POST** `/kyc/initiate`
- **Body:**
  ```json
  {
    "phone": "+67512345678",
    "name": "Jane Doe"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "result": {
      "sessionId": "session-uuid",
      "redirectUrl": "https://savis.com/verify/session-uuid",
      "qrCode": "data:image/png;base64,..."
    }
  }
  ```

#### 2. Verify Callback
- **POST** `/kyc/callback`
- **Body:**
  ```json
  {
    "sessionId": "session-uuid",
    "result": {
      "userId": "user123",
      "savisId": "SVS-abc123",
      "status": "success",
      "attributes": { ... }
    }
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "verification": {
      "userId": "user123",
      "savisId": "SVS-abc123",
      "status": "verified",
      "verifiedAt": "2026-05-07T12:00:00Z"
    }
  }
  ```

---

### Bank API (`/bank`)

#### 1. Link Bank Account
- **POST** `/bank/link`
- **Body:**
  ```json
  {
    "bank": "kina",
    "accountNumber": "1234567890",
    "pin": "1234"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "account": {
      "accountNumber": "1234567890",
      "accountName": "Jane Doe",
      "balance": 5000,
      "currency": "PGK"
    }
  }
  ```

#### 2. Get Bank Balance
- **GET** `/bank/balance/:bank/:accountNumber`
- **Example:** `GET /bank/balance/kina/1234567890`
- **Response:**
  ```json
  {
    "success": true,
    "balance": 5000
  }
  ```

#### 3. Transfer from Bank
- **POST** `/bank/transfer`
- **Body:**
  ```json
  {
    "bank": "bsp",
    "fromAccount": "1234567890",
    "toAccount": "0987654321",
    "amount": 1000
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "transfer": {
      "id": "tx-uuid",
      "fromAccount": "1234567890",
      "toAccount": "0987654321",
      "amount": 1000,
      "status": "completed",
      "timestamp": "2026-05-07T12:00:00Z"
    }
  }
  ```

#### 4. Get Bank Transaction History
- **GET** `/bank/history/:bank/:accountNumber?limit=10`
- **Example:** `GET /bank/history/kina/1234567890?limit=20`
- **Response:**
  ```json
  {
    "success": true,
    "history": [ ... ]
  }
  ```

---

## Error Response Format

All errors follow this format:
```json
{
  "success": false,
  "error": "Error message description"
}
```

## Supported Banks
- `kina` — KINA Bank
- `bsp` — Bank of South Pacific

## Currency
All amounts are in **PGK** (Papua New Guinea Kina).