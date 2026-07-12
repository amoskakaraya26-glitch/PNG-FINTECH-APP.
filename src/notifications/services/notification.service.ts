import notificationRepository from '../repositories/notification.repository';

class NotificationService {
  async createNotification(
    userId: string,
    title: string,
    message: string,
    type: string,
    metadata?: any
  ) {
    return notificationRepository.create({
      userId,
      title,
      message,
      type,
      metadata
    });
  }

  async notifyTransfer(
    userId: string,
    amount: number,
    currency: string,
    reference: string
  ) {
    return this.createNotification(
      userId,
      'Transfer Successful',
      `Your transfer of ${currency} ${amount.toFixed(
        2
      )} was completed successfully. Reference: ${reference}.`,
      'TRANSFER',
      {
        amount,
        currency,
        reference
      }
    );
  }

  async notifyWalletCredit(
    userId: string,
    amount: number,
    currency: string
  ) {
    return this.createNotification(
      userId,
      'Wallet Credited',
      `Your wallet has been credited with ${currency} ${amount.toFixed(
        2
      )}.`,
      'WALLET_CREDIT',
      {
        amount,
        currency
      }
    );
  }

  async notifyWalletDebit(
    userId: string,
    amount: number,
    currency: string
  ) {
    return this.createNotification(
      userId,
      'Wallet Debited',
      `Your wallet has been debited by ${currency} ${amount.toFixed(
        2
      )}.`,
      'WALLET_DEBIT',
      {
        amount,
        currency
      }
    );
  }

  async notifyKycApproved(userId: string) {
    return this.createNotification(
      userId,
      'KYC Approved',
      'Your identity verification has been approved.',
      'KYC_APPROVED'
    );
  }

  async notifyKycRejected(
    userId: string,
    reason?: string
  ) {
    return this.createNotification(
      userId,
      'KYC Rejected',
      reason
        ? `Your identity verification was rejected. Reason: ${reason}`
        : 'Your identity verification was rejected.',
      'KYC_REJECTED',
      {
        reason
      }
    );
  }

  async getNotifications(
    userId: string
  ) {
    return notificationRepository.findByUser(userId);
  }

  async getUnreadNotifications(
    userId: string
  ) {
    return notificationRepository.findUnread(userId);
  }

  async getUnreadCount(
    userId: string
  ) {
    return notificationRepository.getUnreadCount(userId);
  }

  async markAsRead(
    notificationId: string
  ) {
    return notificationRepository.markAsRead(
      notificationId
    );
  }

  async markAllAsRead(
    userId: string
  ) {
    return notificationRepository.markAllAsRead(
      userId
    );
  }

  async deleteNotification(
    notificationId: string
  ) {
    return notificationRepository.delete(
      notificationId
    );
  }
}

export default new NotificationService();