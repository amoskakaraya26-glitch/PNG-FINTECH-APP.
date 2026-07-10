import { Router } from 'express';
import { getNotifications, markRead, getUnreadCount } from '../controllers/notifications.controller';
import { authenticate } from '../middleware/auth.middleware';
const router = Router();
router.get('/', authenticate, getNotifications);
router.get('/unread-count', authenticate, getUnreadCount);
router.put('/:id/read', authenticate, markRead);
export default router;
