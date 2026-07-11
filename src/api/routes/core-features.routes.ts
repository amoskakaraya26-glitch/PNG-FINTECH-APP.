import { Router } from 'express';
import {
  AuthRequest,
  authenticate,
  requireAdmin
} from '../middleware/auth.middleware';

import TransactionEngine from '../services/TransactionEngine';
import TwoFactorAuthService from '../services/TwoFactorAuthService';
import ComplianceService from '../services/ComplianceService';
import NotificationService from '../services/NotificationService';

const router = Router();

// ========== TRANSACTION ROUTES ==========

/**
 * POST /api/transactions/transfer
 * Transfer money from one wallet to another
 */
router.post(
  '/transactions/transfer',
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      const { toUserId, amount, description } = req.body;
      const userId = req.user!.id;

      if (!toUserId || !amount) {
        return res.status(400).json({
          error: 'Missing required fields'
        });
      }

      if (amount <= 0) {
        return res.status(400).json({
          error: 'Amount must be positive'
        });
      }

      // TODO: Get actual wallet IDs and validate 2FA
      const transaction = await TransactionEngine.processTransaction(
        'user-wallet-id',
        'to-wallet-id',
        amount,
        'transfer',
        description
      );

      const alert = await ComplianceService.screenTransaction(
        userId,
        transaction.id,
        amount,
        toUserId
      );

      await NotificationService.notifyTransaction(
        userId,
        'sent',
        amount,
        'Recipient Name'
      );

      if (alert) {
        return res.status(202).json({
          transaction,
          alert: 'This transaction is under review',
          complianceAlert: alert
        });
      }

      return res.json(transaction);
    } catch (error: any) {
      return res.status(500).json({
        error: error.message
      });
    }
  }
);

/**
 * GET /api/transactions/history
 * Get transaction history for authenticated user
 */
router.get(
  '/transactions/history',
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      const limit = Math.min(
        parseInt(req.query.limit as string) || 50,
        100
      );

      const offset =
        parseInt(req.query.offset as string) || 0;

      const transactions =
        await TransactionEngine.getTransactionHistory(
          'wallet-id',
          limit,
          offset
        );

      return res.json({
        transactions,
        limit,
        offset
      });
    } catch (error: any) {
      return res.status(500).json({
        error: error.message
      });
    }
  }
);

/**
 * POST /api/transactions/reverse
 * Reverse a failed transaction
 */
router.post(
  '/transactions/reverse',
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      const { transactionId, reason } = req.body;

      if (!transactionId || !reason) {
        return res.status(400).json({
          error: 'Missing required fields'
        });
      }

      await TransactionEngine.reverseTransaction(
        transactionId,
        reason
      );

      await NotificationService.notifyTransaction(
        req.user!.id,
        'sent',
        0,
        'Transaction Reversal'
      );

      return res.json({
        message: 'Transaction reversed successfully'
      });
    } catch (error: any) {
      return res.status(500).json({
        error: error.message
      });
    }
  }
);

// ========== TWO-FACTOR AUTHENTICATION ROUTES ==========

router.post(
  '/2fa/setup/totp',
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      const {
        secret,
        qrCode,
        backupCodes
      } =
        await TwoFactorAuthService.generateTOTPSecret(
          req.user!.id,
          'user@example.com'
        );

      return res.json({
        secret,
        qrCode,
        backupCodes,
        message:
          'Scan the QR code with your authenticator app and save backup codes'
      });
    } catch (error: any) {
      return res.status(500).json({
        error: error.message
      });
    }
  }
);

router.post(
  '/2fa/enable',
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      const {
        method,
        secret,
        backupCodes,
        token
      } = req.body;

      if (!method) {
        return res.status(400).json({
          error:
            'Method required (sms, email, totp)'
        });
      }

      if (method === 'totp' && token && secret) {
        if (
          !TwoFactorAuthService.verifyTOTPToken(
            secret,
            token
          )
        ) {
          return res.status(400).json({
            error: 'Invalid token'
          });
        }
      }

      await TwoFactorAuthService.enableTwoFA(
        req.user!.id,
        method,
        secret,
        backupCodes
      );

      return res.json({
        message: '2FA enabled successfully'
      });
    } catch (error: any) {
      return res.status(500).json({
        error: error.message
      });
    }
  }
);

router.post(
  '/2fa/disable',
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      await TwoFactorAuthService.disableTwoFA(
        req.user!.id
      );

      return res.json({
        message: '2FA disabled successfully'
      });
    } catch (error: any) {
      return res.status(500).json({
        error: error.message
      });
    }
  }
);

router.post('/2fa/send-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        error: 'Phone number required'
      });
    }

    await TwoFactorAuthService.sendOTPBySMS(
      phoneNumber
    );

    return res.json({
      message: 'OTP sent successfully'
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error.message
    });
  }
});

router.post('/2fa/verify-otp', async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({
        error:
          'Phone number and OTP required'
      });
    }

    const verified =
      await TwoFactorAuthService.verifyOTP(
        phoneNumber,
        otp
      );

    if (!verified) {
      return res.status(400).json({
        error: 'Invalid or expired OTP'
      });
    }

    return res.json({
      message: 'OTP verified successfully'
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error.message
    });
  }
});

router.get(
  '/2fa/status',
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      const status =
        await TwoFactorAuthService.getTwoFAStatus(
          req.user!.id
        );

      return res.json(status);
    } catch (error: any) {
      return res.status(500).json({
        error: error.message
      });
    }
  }
);

// ========== COMPLIANCE ROUTES ==========

router.get(
  '/compliance/alerts',
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({
          error: 'User ID required'
        });
      }

      const alerts =
        await ComplianceService.getAlertHistory(
          userId as string
        );

      return res.json({ alerts });
    } catch (error: any) {
      return res.status(500).json({
        error: error.message
      });
    }
  }
);

router.get(
  '/compliance/risk-profile',
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      const riskProfile =
        await ComplianceService.calculateRiskProfile(
          req.user!.id
        );

      return res.json(riskProfile);
    } catch (error: any) {
      return res.status(500).json({
        error: error.message
      });
    }
  }
);

router.post(
  '/compliance/kyc-verify',
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      const {
        firstName,
        lastName,
        dateOfBirth,
        documentType,
        documentNumber
      } = req.body;

      const result =
        await ComplianceService.verifyKYC(
          req.user!.id,
          firstName,
          lastName,
          dateOfBirth,
          documentType,
          documentNumber
        );

      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({
        error: error.message
      });
    }
  }
);

// ========== NOTIFICATION ROUTES ==========

router.get(
  '/notifications',
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      const limit = Math.min(
        parseInt(req.query.limit as string) || 20,
        50
      );

      const notifications =
        await NotificationService.getUserNotifications(
          req.user!.id,
          limit
        );

      return res.json({
        notifications
      });
    } catch (error: any) {
      return res.status(500).json({
        error: error.message
      });
    }
  }
);

router.put(
  '/notifications/:id/read',
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;

      await NotificationService.markAsRead(id);

      return res.json({
        message: 'Notification marked as read'
      });
    } catch (error: any) {
      return res.status(500).json({
        error: error.message
      });
    }
  }
);

router.put(
  '/notifications/read-all',
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      await NotificationService.markAllAsRead(
        req.user!.id
      );

      return res.json({
        message:
          'All notifications marked as read'
      });
    } catch (error: any) {
      return res.status(500).json({
        error: error.message
      });
    }
  }
);

export default router;