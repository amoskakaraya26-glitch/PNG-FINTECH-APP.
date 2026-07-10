import { Router, Request, Response } from 'express';
import { WalletService } from '../services/wallet.service';
import { authenticate } from '../middleware/auth.middleware';
import { db } from '../../database/connection';

const router = Router();
const walletService = new WalletService();
// Find wallet by recipient phone number
router.get('/recipient/:phone', authenticate, async (req: any, res: Response) => {
  try {
    const { phone } = req.params;

    const result = await db.query(
      `
      SELECT 
        u.id,
        u.full_name,
        u.phone,
        w.id AS wallet_id
      FROM users u
      JOIN wallets w
      ON w.user_id = u.id
      WHERE u.phone = $1
      `,
      [phone]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Recipient not found'
      });
    }

    res.json({
      success: true,
      recipient: result.rows[0]
    });

  } catch (error:any) {
    res.status(400).json({
      success:false,
      error:error.message
    });
  }
});

// Get MY wallet (secure)
router.get('/me', authenticate, async (req: any, res: Response) => {
  try {
    const wallet = await walletService.getWalletByUserId(req.user.id);
    if (!wallet) {
      return res.status(404).json({ success: false, error: 'Wallet not found' });
    }
    res.json({ success: true, wallet });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Top up MY wallet
router.post('/topup', authenticate, async (req: any, res: Response) => {
  try {
    const wallet = await walletService.getWalletByUserId(req.user.id);
    if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

    const { amount } = req.body;

    const result = await walletService.topup(wallet.id, amount);
    res.json({ success: true, transaction: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Transfer from MY wallet
router.post('/transfer', authenticate, async (req: any, res: Response) => {
  try {
    const fromWallet = await walletService.getWalletByUserId(req.user.id);
    if (!fromWallet) return res.status(404).json({ error: 'Wallet not found' });

    const { toWalletId, amount } = req.body;

    const result = await walletService.transfer(fromWallet.id, toWalletId, amount);
    res.json({ success: true, transaction: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// History
router.get('/history', authenticate, async (req: any, res: Response) => {
  try {
    const wallet = await walletService.getWalletByUserId(req.user.id);
    if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

    const history = await walletService.getTransactionHistory(wallet.id);
    res.json({ success: true, transactions: history });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;