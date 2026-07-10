import pool from '../../database/connection';
import { v4 as uuidv4 } from 'uuid';

export interface Notification {
  id: string;
  userId: string;
  type: 'transaction' | 'security' | 'compliance' | 'account' | 'promotion';
  title: string;
  message: string;
  channels: ('sms' | 'email' | 'push' | 'in_app')[];
  status: 'pending' | 'sent' | 'failed' | 'read';
  createdAt: Date;
  sentAt?: Date;
  readAt?: Date;
}

export class NotificationService {
  /**
   * Send transaction notification
   */
  async notifyTransaction(
    userId: string,
    type: 'sent' | 'received' | 'failed',
    amount: number,
    otherPartyName: string
  ): Promise<Notification> {
    const user = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (user.rows.length === 0) throw new Error('User not found');

    const userRecord = user.rows[0];
    const notificationId = uuidv4();

    let title = '';
    let message = '';

    switch (type) {
      case 'sent':
        title = 'Money Sent';
        message = `You've sent PGK ${amount.toFixed(2)} to ${otherPartyName}`;
        break;
      case 'received':
        title = 'Money Received';
        message = `You've received PGK ${amount.toFixed(2)} from ${otherPartyName}`;
        break;
      case 'failed':
        title = 'Transaction Failed';
        message = `Your transaction of PGK ${amount.toFixed(2)} to ${otherPartyName} failed. Please try again.`;
        break;
    }

    const channels = ['in_app'];
    if (userRecord.phone_number) channels.push('sms');
    if (userRecord.email) channels.push('email');

    return this.createNotification(
      userId,
      'transaction',
      title,
      message,
      channels
    );
  }

  /**
   * Send security notification
   */
  async notifySecurityEvent(
    userId: string,
    eventType: 'login' | 'password_change' | 'device_added' | 'suspicious_activity',
    details: any
  ): Promise<Notification> {
    const user = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (user.rows.length === 0) throw new Error('User not found');

    let title = '';
    let message = '';

    switch (eventType) {
      case 'login':
        title = 'New Login';
        message = `New login from ${details.location || 'Unknown location'} at ${new Date().toLocaleString()}`;
        break;
      case 'password_change':
        title = 'Password Changed';
        message = 'Your password has been changed successfully.';
        break;
      case 'device_added':
        title = 'New Device Added';
        message = `A new device (${details.deviceName}) has been registered to your account.`;
        break;
      case 'suspicious_activity':
        title = 'Suspicious Activity';
        message = `We detected suspicious activity on your account: ${details.reason}. Please review your account.`;
        break;
    }

    // Security notifications should always include SMS/Email
    return this.createNotification(
      userId,
      'security',
      title,
      message,
      ['email', 'sms', 'in_app']
    );
  }

  /**
   * Send compliance notification
   */
  async notifyCompliance(
    userId: string,
    notificationType: 'kyc_required' | 'kyc_verified' | 'limits_reached' | 'account_frozen',
    details: any
  ): Promise<Notification> {
    let title = '';
    let message = '';

    switch (notificationType) {
      case 'kyc_required':
        title = 'KYC Verification Required';
        message = 'Please complete your KYC verification to continue using your wallet.';
        break;
      case 'kyc_verified':
        title = 'KYC Verified';
        message = 'Your KYC verification has been completed. Your wallet limits have been increased.';
        break;
      case 'limits_reached':
        title = 'Daily Limit Reached';
        message = `You've reached your daily transaction limit of PGK ${details.limit}. Limit resets in ${details.hoursLeft} hours.`;
        break;
      case 'account_frozen':
        title = 'Account Frozen';
        message = 'Your account has been frozen. Please contact support for more information.';
        break;
    }

    return this.createNotification(
      userId,
      'compliance',
      title,
      message,
      ['email', 'sms', 'in_app']
    );
  }

  /**
   * Create and queue notification
   */
  private async createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    channels: string[]
  ): Promise<Notification> {
    const notificationId = uuidv4();

    await pool.query(
      `INSERT INTO notifications 
       (id, user_id, type, title, message, channels, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        notificationId,
        userId,
        type,
        title,
        message,
        JSON.stringify(channels),
        'pending',
      ]
    );

    // Queue for sending
    this.queueNotificationSending(notificationId, userId, channels, message);

    return {
      id: notificationId,
      userId,
      type: type as any,
      title,
      message,
      channels: channels as any,
      status: 'pending',
      createdAt: new Date(),
    };
  }

  /**
   * Queue notification for background sending
   */
  private queueNotificationSending(
    notificationId: string,
    userId: string,
    channels: string[],
    message: string
  ) {
    // TODO: Queue in Redis/RabbitMQ for background processing
    // For now, send immediately
    this.sendNotification(notificationId, userId, channels, message);
  }

  /**
   * Send notification via channels
   */
  private async sendNotification(
    notificationId: string,
    userId: string,
    channels: string[],
    message: string
  ) {
    const user = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (user.rows.length === 0) return;

    const userRecord = user.rows[0];
    const results: { channel: string; status: string }[] = [];

    for (const channel of channels) {
      try {
        switch (channel) {
          case 'sms':
            if (userRecord.phone_number) {
              await this.sendSMS(userRecord.phone_number, message);
              results.push({ channel: 'sms', status: 'sent' });
            }
            break;

          case 'email':
            if (userRecord.email) {
              await this.sendEmail(userRecord.email, message);
              results.push({ channel: 'email', status: 'sent' });
            }
            break;

          case 'push':
            // TODO: Integrate with push notification service
            results.push({ channel: 'push', status: 'queued' });
            break;

          case 'in_app':
            results.push({ channel: 'in_app', status: 'sent' });
            break;
        }
      } catch (error) {
        console.error(`Failed to send ${channel} notification:`, error);
        results.push({ channel, status: 'failed' });
      }
    }

    // Update notification status
    const anyFailed = results.some(r => r.status === 'failed');
    await pool.query(
      `UPDATE notifications SET status = $1, sent_at = NOW() WHERE id = $2`,
      [anyFailed ? 'failed' : 'sent', notificationId]
    );
  }

  /**
   * Send SMS via provider (placeholder)
   */
  private async sendSMS(phoneNumber: string, message: string): Promise<void> {
    // TODO: Integrate with SMS provider (Twilio, AWS SNS, etc.)
    console.log(`[SMS] To ${phoneNumber}: ${message}`);
  }

  /**
   * Send Email via provider (placeholder)
   */
  private async sendEmail(email: string, message: string): Promise<void> {
    // TODO: Integrate with email provider (SendGrid, AWS SES, etc.)
    console.log(`[EMAIL] To ${email}: ${message}`);
  }

  /**
   * Get notifications for user
   */
  async getUserNotifications(userId: string, limit: number = 20): Promise<Notification[]> {
    const result = await pool.query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows.map(row => ({
      ...row,
      channels: JSON.parse(row.channels),
    }));
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    await pool.query(
      `UPDATE notifications SET status = $1, read_at = NOW() WHERE id = $2`,
      ['read', notificationId]
    );
  }

  /**
   * Mark all notifications as read for user
   */
  async markAllAsRead(userId: string): Promise<void> {
    await pool.query(
      `UPDATE notifications SET status = $1, read_at = NOW() 
       WHERE user_id = $2 AND status != 'read'`,
      ['read', userId]
    );
  }
}

export default new NotificationService();
