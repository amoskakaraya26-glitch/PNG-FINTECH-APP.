import { Router } from 'express';
import { getReferralInfo } from '../controllers/referral.controller';
import { authenticate } from '../middleware/auth.middleware';
const router = Router();
router.get('/', authenticate, getReferralInfo);
export default router;
