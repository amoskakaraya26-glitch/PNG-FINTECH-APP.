import { Response } from 'express';

import notificationService from '../../notifications/services/notification.service';
import { AuthRequest } from '../../api/middleware/auth.middleware';
export const getNotifications = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const notifications =
      await notificationService.getNotifications(
        req.user!.id
      );

    res.json(notifications);
  } catch (err: any) {
    res.status(500).json({
      error: err.message
    });
  }
};

export const getUnreadNotifications = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const notifications =
      await notificationService.getUnreadNotifications(
        req.user!.id
      );

    res.json(notifications);
  } catch (err: any) {
    res.status(500).json({
      error: err.message
    });
  }
};

export const getUnreadCount = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const count =
      await notificationService.getUnreadCount(
        req.user!.id
      );

    res.json({
      unread: count
    });
  } catch (err: any) {
    res.status(500).json({
      error: err.message
    });
  }
};

export const markAsRead = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const notification =
      await notificationService.markAsRead(
        req.params.id
      );

    res.json(notification);
  } catch (err: any) {
    res.status(500).json({
      error: err.message
    });
  }
};

export const markAllAsRead = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const notifications =
      await notificationService.markAllAsRead(
        req.user!.id
      );

    res.json({
      message: 'All notifications marked as read.',
      notifications
    });
  } catch (err: any) {
    res.status(500).json({
      error: err.message
    });
  }
};

export const deleteNotification = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    await notificationService.deleteNotification(
      req.params.id
    );

    res.json({
      message: 'Notification deleted.'
    });
  } catch (err: any) {
    res.status(500).json({
      error: err.message
    });
  }
};