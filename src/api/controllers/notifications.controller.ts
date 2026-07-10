import { Response } from 'express';
import pool from '../../database/connection';
import { AuthRequest } from '../middleware/auth.middleware';

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const markRead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (id === 'all') {
      await pool.query('UPDATE notifications SET is_read=true WHERE user_id=$1', [req.user!.id]);
    } else {
      await pool.query('UPDATE notifications SET is_read=true WHERE id=$1 AND user_id=$2', [id, req.user!.id]);
    }
    res.json({ message: 'Marked as read' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id=$1 AND is_read=false',
      [req.user!.id]
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
