import { Response } from 'express';
import pool from '../../database/connection';
import { AuthRequest } from '../middleware/auth.middleware';

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const [users, txns, wallets, kyc] = await Promise.all([
      pool.query("SELECT COUNT(*) as total, COUNT(CASE WHEN created_at > NOW()-INTERVAL '30 days' THEN 1 END) as new_this_month FROM users"),
      pool.query("SELECT COUNT(*) as total, COALESCE(SUM(amount), 0) as volume FROM transactions WHERE created_at > NOW()-INTERVAL '30 days'"),
      pool.query('SELECT COALESCE(SUM(balance), 0) as total_balance FROM wallets'),
      pool.query('SELECT status, COUNT(*) as count FROM kyc_verifications GROUP BY status'),
    ]);
    res.json({
      users: users.rows[0],
      transactions: txns.rows[0],
      wallets: wallets.rows[0],
      kyc: kyc.rows,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    let query = `SELECT u.*, w.balance FROM users u LEFT JOIN wallets w ON w.user_id = u.id WHERE 1=1`;
    const params: any[] = [];
    let idx = 1;
    if (search) { query += ` AND (u.full_name ILIKE $${idx} OR u.phone ILIKE $${idx})`; params.push(`%${search}%`); idx++; }
    query += ` ORDER BY u.created_at DESC LIMIT $${idx} OFFSET $${idx+1}`;
    params.push(Number(limit), offset);
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const result = await pool.query(
      `SELECT t.*, s.full_name as sender_name, s.phone as sender_phone, r.full_name as receiver_name
       FROM transactions t
       LEFT JOIN users s ON s.id = t.sender_id
       LEFT JOIN users r ON r.id = t.receiver_id
       ORDER BY t.created_at DESC LIMIT $1 OFFSET $2`,
      [Number(limit), offset]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateUserStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    await pool.query('UPDATE users SET is_active=$1 WHERE id=$2', [isActive, id]);
    res.json({ message: 'Updated' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const reviewKYC = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await pool.query('UPDATE kyc_verifications SET status=$1, updated_at=NOW() WHERE id=$2', [status, id]);
    if (status === 'verified') {
      const kyc = await pool.query('SELECT user_id FROM kyc_verifications WHERE id=$1', [id]);
      if (kyc.rows.length) {
        await pool.query('UPDATE users SET kyc_status=$1, kyc_level=1 WHERE id=$2', [status, kyc.rows[0].user_id]);
        await pool.query(
          `INSERT INTO notifications (id, user_id, type, title, message) VALUES (gen_random_uuid(),$1,'kyc_update','KYC Approved','Your identity has been verified!')`,
          [kyc.rows[0].user_id]
        );
      }
    }
    res.json({ message: 'KYC updated' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
