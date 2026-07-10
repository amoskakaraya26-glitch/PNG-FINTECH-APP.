import { Router } from 'express';
import { sendMoney, getTransactionHistory, getSpendingAnalytics } from '../controllers/transfer.controller';
import { authenticate } from '../middleware/auth.middleware';
const router = Router();
router.post('/send', authenticate, sendMoney);
router.get('/history', authenticate, getTransactionHistory);
router.get('/analytics', authenticate, getSpendingAnalytics);
export default router;
