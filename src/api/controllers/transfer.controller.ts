import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

import pool from '../../database/connection';
import { AuthRequest } from '../middleware/auth.middleware';

import TransferService from '../services/transfer.service';
import { emitBalanceUpdate } from '../socket';

export const sendMoney = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { recipientPhone, amount, description } = req.body;

    const parsedAmount = Number(amount);

    if (!parsedAmount || parsedAmount <= 0) {
      await client.query('ROLLBACK');

      res.status(400).json({
        error: 'Invalid amount',
      });

      return;
    }

    /**
     * Fraud Detection
     */
    const risk = await TransferService.validateFraud(
  req.user!.id,
  parsedAmount
);

    if (risk.riskLevel === 'high') {
      await client.query('ROLLBACK');

      res.status(403).json({
        error: 'Transfer held for security review',
        risk,
      });

      return;
    }

    /**
     * Sender Wallet
     */
    const senderWallets = await TransferService.getSenderWallet(
  client,
  req.user!.id
);

if (senderWallets.length === 0) {
  await client.query('ROLLBACK');

  res.status(404).json({
    error: 'Wallet not found',
  });

  return;
}

const senderWallet = senderWallets[0];


    if (Number(senderWallet.balance) < parsedAmount) {
      await client.query('ROLLBACK');

      res.status(400).json({
        error: 'Insufficient balance',
      });

      return;
    }

    /**
     * User Limits
     */
    const limits = await TransferService.getUserLimits(
  client,
  req.user!.id
);

if (limits.length > 0) {
  const limit = limits[0];

  if (parsedAmount > Number(limit.per_transaction_limit)) {
    await client.query('ROLLBACK');

    res.status(400).json({
      error: `Per-transaction limit is PGK ${limit.per_transaction_limit}`,
    });

    return;
  }
}
    /**
     * Recipient
     */
    const recipients = await TransferService.getRecipientByPhone(
  client,
  recipientPhone
);

if (recipients.length === 0) {
  await client.query('ROLLBACK');

  res.status(404).json({
    error: 'Recipient not found',
  });

  return;
}

const recipient = recipients[0];

    /**
     * Debit Sender
     */
    await TransferService.updateWalletBalance(
  client,
  req.user!.id,
  -parsedAmount
);

    /**
     * Credit Recipient
     */
    await TransferService.updateWalletBalance(
  client,
  recipient.id,
  parsedAmount
);

    /**
     * Record Transaction
     */
    const transactionId = uuidv4();

    await TransferService.createTransferTransaction(
  client,
  {
    id: transactionId,
    walletId: senderWallet.id,
    amount: parsedAmount,
    description: description || 'P2P Transfer',
    senderId: req.user!.id,
    receiverId: recipient.id,
  }
);

    await client.query('COMMIT');

    /**
     * Live Balance Updates
     */
    const senderBalance = await pool.query(
      'SELECT balance FROM wallets WHERE user_id = $1',
      [req.user!.id]
    );

    const receiverBalance = await pool.query(
      'SELECT balance FROM wallets WHERE user_id = $1',
      [recipient.id]
    );

    emitBalanceUpdate(
      req.user!.id,
      Number(senderBalance.rows[0].balance)
    );

    emitBalanceUpdate(
      recipient.id,
      Number(receiverBalance.rows[0].balance)
    );


    res.json({
      message: 'Transfer successful',
      transactionId,
      amount: parsedAmount,
      recipient: recipient.full_name,
      risk: risk.riskLevel,
    });
  } catch (err: any) {
    await client.query('ROLLBACK');

    res.status(500).json({
      error: err.message,
    });
  } finally {
    client.release();
  }
};

export const getTransactionHistory = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      startDate,
      endDate,
    } = req.query;

    const pageNumber = Number(page);
    const pageSize = Number(limit);
    const offset = (pageNumber - 1) * pageSize;

    let query = `
      SELECT
        t.*,
        s.full_name AS sender_name,
        s.phone AS sender_phone,
        r.full_name AS receiver_name,
        r.phone AS receiver_phone
      FROM transactions t
      JOIN wallets w
        ON w.id = t.wallet_id
      LEFT JOIN users s
        ON s.id = t.sender_id
      LEFT JOIN users r
        ON r.id = t.receiver_id
      WHERE w.user_id = $1
    `;

    const params: any[] = [req.user!.id];
    let index = 2;

    if (type) {
      query += ` AND t.type = $${index++}`;
      params.push(type);
    }

    if (startDate) {
      query += ` AND t.created_at >= $${index++}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND t.created_at <= $${index++}`;
      params.push(endDate);
    }

    query += `
      ORDER BY t.created_at DESC
      LIMIT $${index++}
      OFFSET $${index}
    `;

    params.push(pageSize, offset);

    const result = await pool.query(query, params);

    res.json({
      transactions: result.rows,
      page: pageNumber,
      limit: pageSize,
    });
  } catch (err: any) {
    res.status(500).json({
      error: err.message,
    });
  }
};

export const getSpendingAnalytics = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { period = 'month' } = req.query;

    const interval =
      period === 'week'
        ? '7 days'
        : period === 'year'
        ? '1 year'
        : '30 days';

    const byCategory = await pool.query(
      `
        SELECT
          COALESCE(category, 'other') AS category,
          SUM(amount) AS total,
          COUNT(*) AS count
        FROM transactions t
        JOIN wallets w
          ON w.id = t.wallet_id
        WHERE w.user_id = $1
          AND t.type IN ('transfer', 'payment', 'bill')
          AND t.created_at >= NOW() - INTERVAL '${interval}'
        GROUP BY category
        ORDER BY total DESC
      `,
      [req.user!.id]
    );

    const byDay = await pool.query(
      `
        SELECT
          DATE(t.created_at) AS date,
          SUM(amount) AS total
        FROM transactions t
        JOIN wallets w
          ON w.id = t.wallet_id
        WHERE w.user_id = $1
          AND t.type IN ('transfer', 'payment', 'bill')
          AND t.created_at >= NOW() - INTERVAL '${interval}'
        GROUP BY DATE(t.created_at)
        ORDER BY date
      `,
      [req.user!.id]
    );

    const totalSpent = await pool.query(
      `
        SELECT
          COALESCE(SUM(amount), 0) AS total
        FROM transactions t
        JOIN wallets w
          ON w.id = t.wallet_id
        WHERE w.user_id = $1
          AND t.type IN ('transfer', 'payment', 'bill')
          AND t.created_at >= NOW() - INTERVAL '${interval}'
      `,
      [req.user!.id]
    );

    res.json({
      byCategory: byCategory.rows,
      byDay: byDay.rows,
      totalSpent: Number(totalSpent.rows[0].total),
      period,
    });
  } catch (err: any) {
    res.status(500).json({
      error: err.message,
    });
  }
};