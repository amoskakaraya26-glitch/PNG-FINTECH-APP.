import { Response } from 'express';
import pool from '../../database/connection';
import { AuthRequest } from '../middleware/auth.middleware';

export const getReferralInfo = async (req: AuthRequest, res: Response) => {
  try {
    const user = await pool.query('SELECT referral_code FROM users WHERE id=$1', [req.user!.id]);
    const referrals = await pool.query(
      `SELECT r.*, u.full_name, u.phone, u.created_at as joined_at
       FROM referrals r JOIN users u ON u.id = r.referred_id
       WHERE r.referrer_id=$1 ORDER BY r.created_at DESC`,
      [req.user!.id]
    );
    const stats = await pool.query(
      `SELECT COUNT(*) as total, COALESCE(SUM(reward_amount), 0) as total_earned,
       COUNT(CASE WHEN status='paid' THEN 1 END) as paid_count
       FROM referrals WHERE referrer_id=$1`,
      [req.user!.id]
    );
    res.json({
      referralCode: user.rows[0]?.referral_code,
      referrals: referrals.rows,
      stats: stats.rows[0]
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
