import { v4 as uuid } from 'uuid';

import db from '../../database/connection';

export interface NotificationRecord {
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead?: boolean;
  metadata?: any;
}

class NotificationRepository {
  async create(
    notification: NotificationRecord
  ) {
    const id = uuid();

    const result = await db.query(
      `
      INSERT INTO notifications (
        id,
        user_id,
        title,
        message,
        type,
        is_read,
        metadata
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
      `,
      [
        id,
        notification.userId,
        notification.title,
        notification.message,
        notification.type,
        notification.isRead ?? false,
        notification.metadata ?? null
      ]
    );

    return result.rows[0];
  }

  async findByUser(
    userId: string
  ) {
    const result = await db.query(
      `
      SELECT *
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [userId]
    );

    return result.rows;
  }

  async findUnread(
    userId: string
  ) {
    const result = await db.query(
      `
      SELECT *
      FROM notifications
      WHERE user_id = $1
      AND is_read = FALSE
      ORDER BY created_at DESC
      `,
      [userId]
    );

    return result.rows;
  }

  async getUnreadCount(
    userId: string
  ) {
    const result = await db.query(
      `
      SELECT COUNT(*) AS count
      FROM notifications
      WHERE user_id = $1
      AND is_read = FALSE
      `,
      [userId]
    );

    return Number(result.rows[0].count);
  }

  async markAsRead(
    id: string
  ) {
    const result = await db.query(
      `
      UPDATE notifications
      SET is_read = TRUE
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    return result.rows[0];
  }

  async markAllAsRead(
    userId: string
  ) {
    const result = await db.query(
      `
      UPDATE notifications
      SET is_read = TRUE
      WHERE user_id = $1
      RETURNING *
      `,
      [userId]
    );

    return result.rows;
  }

  async delete(
    id: string
  ) {
    await db.query(
      `
      DELETE FROM notifications
      WHERE id = $1
      `,
      [id]
    );
  }
}

export default new NotificationRepository();
