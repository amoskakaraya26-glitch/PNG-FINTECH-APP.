import pool from '../../database/connection';
import { v4 as uuidv4 } from 'uuid';

export interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  totalTransactionVolume: number;
  totalTransactionCount: number;
  averageTransactionSize: number;
  pendingKYC: number;
  kycVerified: number;
  complianceAlerts: number;
  suspiciousReports: number;
  systemHealth: {
    uptime: string;
    dbConnected: boolean;
    cacheHealth: string;
  };
}

export class AdminDashboardService {
  /**
   * Get platform dashboard metrics
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      // Total users and active users (active in last 7 days)
      const users = await pool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN last_login > NOW() - INTERVAL '7 days' THEN 1 END) as active
        FROM users
      `);

      // Transaction metrics
      const transactions = await pool.query(`
        SELECT 
          COUNT(*) as count,
          COALESCE(SUM(amount), 0) as volume,
          COALESCE(AVG(amount), 0) as average
        FROM transactions
        WHERE status = 'completed'
      `);

      // KYC metrics
      const kyc = await pool.query(`
        SELECT 
          COUNT(CASE WHEN kyc_status = 'unverified' OR kyc_status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN kyc_status = 'verified' THEN 1 END) as verified
        FROM users
      `);

      // Compliance metrics
      const compliance = await pool.query(`
        SELECT 
          COUNT(CASE WHEN status IN ('open', 'investigated') THEN 1 END) as alerts,
          COUNT(CASE WHEN status = 'submitted' THEN 1 END) as reports
        FROM compliance_alerts ca
        LEFT JOIN suspicious_activity_reports sar ON ca.id = ANY(sar.related_alerts)
      `);

      return {
        totalUsers: parseInt(users.rows[0].total),
        activeUsers: parseInt(users.rows[0].active),
        totalTransactionVolume: parseFloat(transactions.rows[0].volume),
        totalTransactionCount: parseInt(transactions.rows[0].count),
        averageTransactionSize: parseFloat(transactions.rows[0].average),
        pendingKYC: parseInt(kyc.rows[0].pending),
        kycVerified: parseInt(kyc.rows[0].verified),
        complianceAlerts: parseInt(compliance.rows[0].alerts),
        suspiciousReports: parseInt(compliance.rows[0].reports),
        systemHealth: {
          uptime: this.getSystemUptime(),
          dbConnected: true,
          cacheHealth: 'healthy',
        },
      };
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      throw error;
    }
  }

  /**
   * Get user management data
   */
  async getUserManagement(
    page: number = 1,
    pageSize: number = 50,
    filter?: { kycStatus?: string; accountTier?: string; status?: string }
  ) {
    let query = 'SELECT * FROM users WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (filter?.kycStatus) {
      query += ` AND kyc_status = $${paramCount}`;
      params.push(filter.kycStatus);
      paramCount++;
    }

    if (filter?.accountTier) {
      query += ` AND account_tier = $${paramCount}`;
      params.push(filter.accountTier);
      paramCount++;
    }

    const offset = (page - 1) * pageSize;
    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(pageSize, offset);

    const result = await pool.query(query, params);
    const countResult = await pool.query('SELECT COUNT(*) FROM users');

    return {
      users: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      pageSize,
    };
  }

  /**
   * Get transaction monitoring data
   */
  async getTransactionMonitoring(
    page: number = 1,
    pageSize: number = 50,
    filter?: { status?: string; dateFrom?: Date; dateTo?: Date }
  ) {
    let query = `
      SELECT t.*, 
             u1.name as from_user_name,
             u2.name as to_user_name
      FROM transactions t
      LEFT JOIN users u1 ON t.from_wallet_id = ANY(ARRAY(SELECT id FROM wallets WHERE user_id = u1.id))
      LEFT JOIN users u2 ON t.to_wallet_id = ANY(ARRAY(SELECT id FROM wallets WHERE user_id = u2.id))
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (filter?.status) {
      query += ` AND t.status = $${paramCount}`;
      params.push(filter.status);
      paramCount++;
    }

    if (filter?.dateFrom) {
      query += ` AND t.created_at >= $${paramCount}`;
      params.push(filter.dateFrom);
      paramCount++;
    }

    if (filter?.dateTo) {
      query += ` AND t.created_at <= $${paramCount}`;
      params.push(filter.dateTo);
      paramCount++;
    }

    const offset = (page - 1) * pageSize;
    query += ` ORDER BY t.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(pageSize, offset);

    const result = await pool.query(query, params);
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM transactions WHERE 1=1 ${
        filter?.status ? ` AND status = $1` : ''
      }`,
      filter?.status ? [filter.status] : []
    );

    return {
      transactions: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      pageSize,
    };
  }

  /**
   * Get compliance and dispute reports
   */
  async getComplianceReports(
    page: number = 1,
    pageSize: number = 50,
    filter?: { severity?: string; status?: string }
  ) {
    let query = 'SELECT * FROM compliance_alerts WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (filter?.severity) {
      query += ` AND severity = $${paramCount}`;
      params.push(filter.severity);
      paramCount++;
    }

    if (filter?.status) {
      query += ` AND status = $${paramCount}`;
      params.push(filter.status);
      paramCount++;
    }

    const offset = (page - 1) * pageSize;
    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(pageSize, offset);

    const result = await pool.query(query, params);
    const countResult = await pool.query('SELECT COUNT(*) FROM compliance_alerts');

    return {
      alerts: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      pageSize,
    };
  }

  /**
   * Update system settings
   */
  async updateSystemSettings(settings: {
    dailyLimit?: number;
    transactionLimit?: number;
    requiredKYCForAmount?: number;
    suspiciousActivityThreshold?: number;
  }): Promise<void> {
    // TODO: Store in a system_settings table
    console.log('Updating system settings:', settings);
  }

  /**
   * Freeze/unfreeze user account
   */
  async freezeUserAccount(userId: string, reason: string): Promise<void> {
    await pool.query(
      `UPDATE users SET account_tier = $1, updated_at = NOW() WHERE id = $2`,
      ['frozen', userId]
    );

    // Log the action
    await this.logAdminAction('ACCOUNT_FROZEN', userId, { reason });
  }

  /**
   * Verify KYC manually (admin override)
   */
  async verifyKYCManually(userId: string, verifiedBy: string): Promise<void> {
    await pool.query(
      `UPDATE users SET kyc_status = $1, kyc_verified_at = NOW(), updated_at = NOW() WHERE id = $2`,
      ['verified', userId]
    );

    await this.logAdminAction('KYC_VERIFIED_MANUAL', userId, { verifiedBy });
  }

  /**
   * Send bulk message to users
   */
  async sendBulkMessage(
    recipientFilter: any,
    message: string,
    channels: string[]
  ): Promise<{ sent: number; failed: number }> {
    // TODO: Implement bulk messaging
    return { sent: 0, failed: 0 };
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    dateFrom: Date,
    dateTo: Date,
    reportType: 'aml' | 'transaction' | 'kyc'
  ): Promise<any> {
    // TODO: Implement comprehensive reporting
    return {};
  }

  /**
   * Log admin action for audit
   */
  private async logAdminAction(action: string, targetUserId: string, details: any): Promise<void> {
    await pool.query(
      `INSERT INTO audit_logs (id, action, resource_type, resource_id, changes)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        uuidv4(),
        action,
        'user',
        targetUserId,
        JSON.stringify(details),
      ]
    );
  }

  /**
   * Get system uptime
   */
  private getSystemUptime(): string {
    // TODO: Implement actual uptime tracking
    return '99.9%';
  }
}

export default new AdminDashboardService();
