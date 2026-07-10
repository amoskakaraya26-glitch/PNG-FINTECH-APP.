import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../../database/connection';
import { AuthRequest } from '../middleware/auth.middleware';

const BILLERS = [
  { code: 'PNG_POWER', name: 'PNG Power', type: 'electricity', icon: '⚡' },
  { code: 'YWAM_WATER', name: 'Eda Ranu Water', type: 'water', icon: '💧' },
  { code: 'DIGICEL', name: 'Digicel PNG', type: 'mobile', icon: '📱' },
  { code: 'BMOBILE', name: 'BMobile Vodafone', type: 'mobile', icon: '📱' },
  { code: 'DATEC', name: 'Datec Internet', type: 'internet', icon: '🌐' },
  { code: 'WESTPAC', name: 'Westpac Insurance', type: 'insurance', icon: '🛡️' },
  { code: 'NASFUND', name: 'Nasfund', type: 'superannuation', icon: '🏦' },
  { code: 'NCDWATER', name: 'NCD Water & Sewerage', type: 'water', icon: '💧' },
];

export const getBillers = async (req: AuthRequest, res: Response) => {
  res.json(BILLERS);
};

export const payBill = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { billerCode, accountNumber, amount } = req.body;
    const parsedAmount = parseFloat(amount);

    const biller = BILLERS.find(b => b.code === billerCode);
    if (!biller) return res.status(400).json({ error: 'Invalid biller' });

    const wallet = await client.query('SELECT * FROM wallets WHERE user_id = $1', [req.user!.id]);
    if (!wallet.rows.length || parseFloat(wallet.rows[0].balance) < parsedAmount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    await client.query('UPDATE wallets SET balance = balance - $1 WHERE user_id = $2', [parsedAmount, req.user!.id]);

    const billId = uuidv4();
    await client.query(
      `INSERT INTO bills (id, user_id, biller_name, biller_code, account_number, bill_type, amount, status, paid_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'paid',NOW())`,
      [billId, req.user!.id, biller.name, billerCode, accountNumber, biller.type, parsedAmount]
    );

    const txId = uuidv4();
    await client.query(
      `INSERT INTO transactions (id, wallet_id, type, amount, currency, status, description, sender_id, category)
       VALUES ($1,$2,'bill',$3,'PGK','completed',$4,$5,'bills')`,
      [txId, wallet.rows[0].id, parsedAmount, `${biller.name} - ${accountNumber}`, req.user!.id]
    );

    await client.query('COMMIT');
    res.json({ message: 'Bill paid successfully', billId, transactionId: txId });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

export const getBillHistory = async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM bills WHERE user_id=$1 ORDER BY created_at DESC',
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
