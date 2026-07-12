import { Router } from 'express';

import {
  getNotifications,
  getUnreadNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from '../../notifications/controllers/notification.controller';

import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  getNotifications
);

router.get(
  '/unread',
  getUnreadNotifications
);

router.get(
  '/count',
  getUnreadCount
);

router.put(
  '/:id/read',
  markAsRead
);

router.put(
  '/read-all',
  markAllAsRead
);

router.delete(
  '/:id',
  deleteNotification
);

export default router;