import { Router } from 'express';
import { chat, getChatHistory } from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth.middleware';
const router = Router();
router.post('/chat', authenticate, chat);
router.get('/history', authenticate, getChatHistory);
export default router;
