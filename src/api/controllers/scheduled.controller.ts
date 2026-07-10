import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../../database/connection';
import { AuthRequest } from '../middleware/auth.middleware';

export const getScheduled = async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT sp.*, u.full_name as recipient_name, u.phone as recipient_phone
       FROM scheduled_payments sp LEFT JOIN users u ON u.id = sp.recipient_id
       WHERE sp.user_id=$1 ORDER BY sp.next_run_at`,
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createScheduled = async (req: AuthRequest, res: Response) => {
  try {
    const { recipientPhone, amount, frequency, startDate, endDate, description, type } = req.body;
    let recipientId = null;
    if (recipientPhone) {
      const r = await pool.query('SELECT id FROM users WHERE phone=$1', [recipientPhone]);
      if (r.rows.length > 0) recipientId = r.rows[0].id;
    }
    const result = await pool.query(
      `INSERT INTO scheduled_payments (id, user_id, recipient_id, type, amount, frequency, next_run_at, end_date, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [uuidv4(), req.user!.id, recipientId, type || 'transfer', parseFloat(amount), frequency, startDate, endDate, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const cancelScheduled = async (req: AuthRequest, res: Response) => {
  try {
    await pool.query(
      "UPDATE scheduled_payments SET status='cancelled' WHERE id=$1 AND user_id=$2",
      [req.params.id, req.user!.id]
    );
    res.json({ message: 'Cancelled' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
