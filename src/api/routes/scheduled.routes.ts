import { Router } from 'express';
import { getScheduled, createScheduled, cancelScheduled } from '../controllers/scheduled.controller';
import { authenticate } from '../middleware/auth.middleware';
const router = Router();
router.get('/', authenticate, getScheduled);
router.post('/', authenticate, createScheduled);
router.delete('/:id', authenticate, cancelScheduled);
export default router;
