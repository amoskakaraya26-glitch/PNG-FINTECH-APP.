import { Router } from 'express';
import { getBillers, payBill, getBillHistory } from '../controllers/bills.controller';
import { authenticate } from '../middleware/auth.middleware';
const router = Router();
router.get('/billers', authenticate, getBillers);
router.post('/pay', authenticate, payBill);
router.get('/history', authenticate, getBillHistory);
export default router;
