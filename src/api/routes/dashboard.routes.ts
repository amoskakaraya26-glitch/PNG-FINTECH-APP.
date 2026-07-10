import { Router } from 'express';
import { AuthRequest, authenticate, requireAdmin } from '../middleware/auth.middleware';
import AdminDashboardService from '../services/AdminDashboardService';

const router = Router();

// ========== DASHBOARD ROUTES ==========

/**
 * GET /api/admin/dashboard
 * Get main dashboard metrics
 */
router.get('/dashboard', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const metrics = await AdminDashboardService.getDashboardMetrics();
    res.json(metrics);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========== USER MANAGEMENT ==========

/**
 * GET /api/admin/users
 * Get list of users with filters
 */
router.get('/users', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 50;
    const filter = {
      kycStatus: req.query.kycStatus as string,
      accountTier: req.query.accountTier as string,
      status: req.query.status as string,
    };

    const result = await AdminDashboardService.getUserManagement(page, pageSize, filter);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/users/:userId/freeze
 * Freeze a user account
 */
router.post('/users/:userId/freeze', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    await AdminDashboardService.freezeUserAccount(userId, reason);

    res.json({ message: 'User account frozen successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/users/:userId/verify-kyc
 * Manually verify KYC (admin override)
 */
router.post('/users/:userId/verify-kyc', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user?.id || 'admin';

    await AdminDashboardService.verifyKYCManually(userId, adminId);

    res.json({ message: 'KYC verified successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========== TRANSACTION MONITORING ==========

/**
 * GET /api/admin/transactions
 * Get all transactions with filters
 */
router.get('/transactions', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 50;
    const filter = {
      status: req.query.status as string,
      dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
      dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
    };

    const result = await AdminDashboardService.getTransactionMonitoring(page, pageSize, filter);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========== COMPLIANCE & ALERTS ==========

/**
 * GET /api/admin/compliance
 * Get compliance alerts and reports
 */
router.get('/compliance', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 50;
    const filter = {
      severity: req.query.severity as string,
      status: req.query.status as string,
    };

    const result = await AdminDashboardService.getComplianceReports(page, pageSize, filter);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/compliance/report
 * Generate compliance report
 */
router.post('/compliance/report', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { dateFrom, dateTo, reportType } = req.body;

    const report = await AdminDashboardService.generateComplianceReport(
      new Date(dateFrom),
      new Date(dateTo),
      reportType
    );

    res.json(report);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========== SYSTEM SETTINGS ==========

/**
 * PUT /api/admin/settings
 * Update system settings
 */
router.put('/settings', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const {
      dailyLimit,
      transactionLimit,
      requiredKYCForAmount,
      suspiciousActivityThreshold,
    } = req.body;

    await AdminDashboardService.updateSystemSettings({
      dailyLimit,
      transactionLimit,
      requiredKYCForAmount,
      suspiciousActivityThreshold,
    });

    res.json({ message: 'Settings updated successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========== BULK OPERATIONS ==========

/**
 * POST /api/admin/users/bulk-message
 * Send bulk message to users
 */
router.post('/users/bulk-message', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { recipientFilter, message, channels } = req.body;

    const result = await AdminDashboardService.sendBulkMessage(
      recipientFilter,
      message,
      channels
    );

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
