import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../../database/connection';
import { AuthRequest } from '../middleware/auth.middleware';

const FAQ_RESPONSES: Record<string, string> = {
  'balance': 'You can check your balance on the Dashboard. Your current balance is shown at the top.',
  'send money': 'To send money, go to Send Money, enter the recipient\'s phone number, amount, and confirm with your PIN.',
  'kyc': 'KYC verification requires a valid ID (passport, driver\'s license, or NID) and a selfie. Go to Profile > KYC Verification.',
  'limit': 'Daily send limit for unverified users is PGK 500. After KYC Level 1, it increases to PGK 5,000.',
  'topup': 'To top up, go to Top Up, select your linked bank account, and enter the amount.',
  'qr': 'To pay via QR, tap Scan QR on the dashboard. To receive, share your Profile QR code.',
  'fee': 'P2P transfers within PNG Wallet are free. Bank withdrawals have a 0.5% fee.',
  'support': 'For support, go to Help & Support in the menu, or call our hotline: 1800-PNG-WALLET.',
};

export const chat = async (req: AuthRequest, res: Response) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });

    await pool.query(
      'INSERT INTO chat_messages (id, user_id, role, content) VALUES ($1,$2,$3,$4)',
      [uuidv4(), req.user!.id, 'user', message]
    );

    let reply = 'I\'m here to help! You can ask me about your balance, sending money, KYC verification, limits, top-up, QR payments, fees, or contact support.';
    
    const lower = message.toLowerCase();
    for (const [keyword, response] of Object.entries(FAQ_RESPONSES)) {
      if (lower.includes(keyword)) {
        reply = response;
        break;
      }
    }

    if (process.env.OPENAI_API_KEY) {
      try {
        const history = await pool.query(
          'SELECT role, content FROM chat_messages WHERE user_id=$1 ORDER BY created_at DESC LIMIT 10',
          [req.user!.id]
        );
        const messages = history.rows.reverse().map((r: any) => ({ role: r.role, content: r.content }));
        messages.unshift({ role: 'system', content: 'You are a helpful PNG Fintech E-Wallet assistant. Help users with their wallet, transactions, KYC, and financial queries. Be concise and friendly.' });
        
        const { OpenAI } = require('openai');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const completion = await openai.chat.completions.create({ model: 'gpt-3.5-turbo', messages, max_tokens: 200 });
        reply = completion.choices[0].message.content || reply;
      } catch (e) {
        // fallback to rule-based
      }
    }

    await pool.query(
      'INSERT INTO chat_messages (id, user_id, role, content) VALUES ($1,$2,$3,$4)',
      [uuidv4(), req.user!.id, 'assistant', reply]
    );

    res.json({ reply });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getChatHistory = async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM chat_messages WHERE user_id=$1 ORDER BY created_at ASC LIMIT 100',
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
