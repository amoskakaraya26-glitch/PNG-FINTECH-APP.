import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../../database/connection';
import { AuthRequest } from '../middleware/auth.middleware';

export const createDispute = async (req: AuthRequest, res: Response) => {
  try {
    const { transactionId, type, subject, description } = req.body;
    const result = await pool.query(
      `INSERT INTO disputes (id, user_id, transaction_id, type, subject, description) 
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [uuidv4(), req.user!.id, transactionId, type, subject, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getDisputes = async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM disputes WHERE user_id=$1 ORDER BY created_at DESC',
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
