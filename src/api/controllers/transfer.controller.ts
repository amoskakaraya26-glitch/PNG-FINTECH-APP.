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

   const result = await TransferService.transferMoney(
  client,
  {
    senderId: req.user!.id,
    recipientPhone,
    amount: parsedAmount,
    description,
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
  [result.receiverId]
);

    emitBalanceUpdate(
      req.user!.id,
      Number(senderBalance.rows[0].balance)
    );

    emitBalanceUpdate(
    result.receiverId,
    Number(receiverBalance.rows[0].balance)
);


    res.json({
  message: 'Transfer successful',
  transactionId: result.transactionId,
  amount: result.amount,
  recipient: result.recipient,
  risk: result.risk,
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