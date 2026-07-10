import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../../database/connection';
import { AuthRequest } from '../middleware/auth.middleware';

export const getContacts = async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT c.*, u.full_name as registered_name, u.avatar_url
       FROM contacts c LEFT JOIN users u ON u.id = c.contact_user_id
       WHERE c.user_id = $1 ORDER BY c.is_favorite DESC, c.name`,
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const addContact = async (req: AuthRequest, res: Response) => {
  try {
    const { phone, name } = req.body;
    const existing = await pool.query('SELECT id FROM users WHERE phone = $1', [phone]);
    const contactUserId = existing.rows.length > 0 ? existing.rows[0].id : null;
    const result = await pool.query(
      'INSERT INTO contacts (id, user_id, contact_user_id, name, phone) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [uuidv4(), req.user!.id, contactUserId, name, phone]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const toggleFavorite = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query(
      'UPDATE contacts SET is_favorite = NOT is_favorite WHERE id=$1 AND user_id=$2',
      [id, req.user!.id]
    );
    res.json({ message: 'Updated' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteContact = async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('DELETE FROM contacts WHERE id=$1 AND user_id=$2', [req.params.id, req.user!.id]);
    res.json({ message: 'Deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
