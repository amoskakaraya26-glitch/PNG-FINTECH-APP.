import { calculateRisk } from './fraud.service';

/**
 * Minimal database client interface.
 *
 * Compatible with:
 * - PostgreSQL PoolClient
 * - In-memory test client
 * - Mock database clients
 */
export interface QueryClient {
  query<T = any>(
    text: string,
    params?: any[]
  ): Promise<{
    rows: T[];
  }>;
}

export interface TransferRequest {
  senderId: string;
  recipientPhone: string;
  amount: number;
  description?: string;
}

export interface TransferResult {
  transactionId: string;
  amount: number;
  recipient: string;
  risk: string;
}

export interface CreateTransferTransactionInput {
  id: string;
  walletId: string;
  amount: number;
  description: string;
  senderId: string;
  receiverId: string;
}

export interface WalletRecord {
  id: string;
  user_id: string;
  balance: string;
}

export interface RecipientRecord {
  id: string;
  full_name: string;
  wallet_id: string;
}

export interface UserLimitRecord {
  id: string;
  user_id: string;
  per_transaction_limit: string;
}

export class TransferService {
  /**
   * Performs fraud validation before a transfer.
   */
  static async validateFraud(
    senderId: string,
    amount: number
  ) {
    return calculateRisk(senderId, amount);
  }

  /**
   * Retrieves the sender's wallet.
   */
  static async getSenderWallet(
    client: QueryClient,
    senderId: string
  ) {
    const result = await client.query<WalletRecord>(
      `
        SELECT *
        FROM wallets
        WHERE user_id = $1
      `,
      [senderId]
    );

    return result.rows;
  }

  /**
   * Retrieves the recipient and wallet by phone number.
   */
  static async getRecipientByPhone(
    client: QueryClient,
    recipientPhone: string
  ) {
    const result = await client.query<RecipientRecord>(
      `
        SELECT
          u.id,
          u.full_name,
          w.id AS wallet_id
        FROM users u
        JOIN wallets w
          ON w.user_id = u.id
        WHERE u.phone = $1
      `,
      [recipientPhone]
    );

    return result.rows;
  }

  /**
   * Retrieves transfer limits for a user.
   */
  static async getUserLimits(
    client: QueryClient,
    userId: string
  ) {
   const result = await client.query<UserLimitRecord>(
      `
        SELECT *
        FROM user_limits
        WHERE user_id = $1
      `,
      [userId]
    );

    return result.rows;
  }

  /**
   * Updates a wallet balance.
   *
   * Pass:
   *  - negative amount => debit
   *  - positive amount => credit
   */
  static async updateWalletBalance(
    client: QueryClient,
    userId: string,
    amountDelta: number
  ) {
    await client.query(
      `
        UPDATE wallets
        SET
          balance = balance + $1,
          updated_at = NOW()
        WHERE user_id = $2
      `,
      [
        amountDelta,
        userId
      ]
    );
  }

  /**
   * Records a completed transfer transaction.
   */
  static async createTransferTransaction(
    client: QueryClient,
    transaction: CreateTransferTransactionInput
  ) {
    await client.query(
      `
        INSERT INTO transactions (
          id,
          wallet_id,
          type,
          amount,
          currency,
          status,
          description,
          sender_id,
          receiver_id,
          category
        )
        VALUES (
          $1,
          $2,
          'transfer',
          $3,
          'PGK',
          'completed',
          $4,
          $5,
          $6,
          'transfer'
        )
      `,
      [
        transaction.id,
        transaction.walletId,
        transaction.amount,
        transaction.description,
        transaction.senderId,
        transaction.receiverId
      ]
    );
  }

  /**
   * Placeholder.
   *
   * During Release 1.4 the complete transfer workflow
   * will gradually move here.
   */
  static async transferMoney(
    _client: QueryClient,
    _request: TransferRequest
  ): Promise<TransferResult> {
    throw new Error(
      'TransferService.transferMoney() has not been implemented.'
    );
  }
}

export default TransferService;