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
   *
   * The controller is responsible for deciding what
   * to do if no wallet is found.
   */
  static async getSenderWallet(
    client: QueryClient,
    senderId: string
  ) {
    const result = await client.query(
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
   * Retrieves the recipient and their wallet using a phone number.
   *
   * The controller is responsible for handling the
   * "recipient not found" case.
   */
  static async getRecipientByPhone(
    client: QueryClient,
    recipientPhone: string
  ) {
    const result = await client.query(
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

  static async getUserLimits(
  client: QueryClient,
  userId: string
) {
  const result = await client.query(
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
   * Placeholder.
   *
   * During Release 1.4 we'll gradually move the complete
   * transfer workflow into this method.
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