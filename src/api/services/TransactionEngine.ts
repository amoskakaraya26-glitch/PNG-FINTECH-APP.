import { Request, Response } from 'express';
import pool from '../../database/connection';
import { v4 as uuidv4 } from 'uuid';

export interface Transaction {
  id: string;
  fromWalletId: string;
  toWalletId: string;
  amount: number;
  currency: string;
  type: 'transfer' | 'payment' | 'topup' | 'withdrawal';
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  description?: string;
  metadata?: any;
  createdAt: Date;
  completedAt?: Date;
}

export class TransactionEngine {
  /**
   * Process a transaction with atomic operations
   * Ensures money never gets lost or duplicated
   */
  async processTransaction(
    fromWalletId: string,
    toWalletId: string,
    amount: number,
    type: string,
    description?: string,
    metadata?: any
  ): Promise<Transaction> {
    const client = await pool.connect();
    const transactionId = uuidv4();

    try {
      await client.query('BEGIN');

      // 1. Validate wallets exist and get current balances
      const fromWallet = await client.query(
        'SELECT * FROM wallets WHERE id = $1 FOR UPDATE',
        [fromWalletId]
      );

      const toWallet = await client.query(
        'SELECT * FROM wallets WHERE id = $1 FOR UPDATE',
        [toWalletId]
      );

      if (fromWallet.rows.length === 0 || toWallet.rows.length === 0) {
        throw new Error('Wallet not found');
      }

      // 2. Check sufficient balance
      if (fromWallet.rows[0].balance < amount) {
        throw new Error('Insufficient balance');
      }

      // 3. Deduct from source wallet
      await client.query(
        'UPDATE wallets SET balance = balance - $1 WHERE id = $2',
        [amount, fromWalletId]
      );

      // 4. Add to destination wallet
      await client.query(
        'UPDATE wallets SET balance = balance + $1 WHERE id = $2',
        [amount, toWalletId]
      );

      // 5. Create transaction record
      const transaction = await client.query(
        `INSERT INTO transactions 
         (id, from_wallet_id, to_wallet_id, amount, type, status, description, metadata) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         RETURNING *`,
        [transactionId, fromWalletId, toWalletId, amount, type, 'completed', description, JSON.stringify(metadata)]
      );

      // 6. Create ledger entries (double-entry accounting)
      await client.query(
        `INSERT INTO ledger_entries 
         (id, transaction_id, account_id, debit, credit, description) 
         VALUES ($1, $2, $3, $4, $5, $6), ($7, $8, $9, $10, $11, $12)`,
        [
          uuidv4(), transactionId, fromWalletId, amount, 0, 'Debit: ' + description,
          uuidv4(), transactionId, toWalletId, 0, amount, 'Credit: ' + description,
        ]
      );

      await client.query('COMMIT');

      return {
        id: transactionId,
        fromWalletId,
        toWalletId,
        amount,
        currency: 'PGK',
        type: type as any,
        status: 'completed',
        description,
        metadata,
        createdAt: new Date(),
        completedAt: new Date(),
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Reverse a transaction (refund)
   */
  async reverseTransaction(transactionId: string, reason: string): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get original transaction
      const transaction = await client.query(
        'SELECT * FROM transactions WHERE id = $1',
        [transactionId]
      );

      if (transaction.rows.length === 0) {
        throw new Error('Transaction not found');
      }

      const tx = transaction.rows[0];

      // Reverse the transaction
      await this.processTransaction(
        tx.to_wallet_id,
        tx.from_wallet_id,
        tx.amount,
        'reversal',
        `Reversal of ${transactionId}: ${reason}`
      );

      // Mark original as reversed
      await client.query(
        'UPDATE transactions SET status = $1 WHERE id = $2',
        ['reversed', transactionId]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get transaction history for a wallet
   */
  async getTransactionHistory(
    walletId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Transaction[]> {
    const result = await pool.query(
      `SELECT * FROM transactions 
       WHERE from_wallet_id = $1 OR to_wallet_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [walletId, limit, offset]
    );

    return result.rows;
  }

  /**
   * Reconcile accounts (for periodic reconciliation)
   */
  async reconcileAccounts(): Promise<{ matched: number; discrepancies: any[] }> {
    const result = await pool.query(`
      SELECT 
        w.id,
        w.balance as wallet_balance,
        COALESCE(SUM(CASE WHEN le.credit > 0 THEN le.credit ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN le.debit > 0 THEN le.debit ELSE 0 END), 0) as ledger_balance
      FROM wallets w
      LEFT JOIN ledger_entries le ON w.id = le.account_id
      GROUP BY w.id
    `);

    const discrepancies = result.rows.filter(
      row => Math.abs(row.wallet_balance - row.ledger_balance) > 0.01
    );

    return {
      matched: result.rows.length - discrepancies.length,
      discrepancies,
    };
  }
}

export default new TransactionEngine();
