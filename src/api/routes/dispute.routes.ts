import { Router } from 'express';
import { createDispute, getDisputes } from '../controllers/dispute.controller';
import { authenticate } from '../middleware/auth.middleware';
const router = Router();
router.post('/', authenticate, createDispute);
router.get('/', authenticate, getDisputes);
export default router;
