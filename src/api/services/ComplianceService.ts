import pool from '../../database/connection';
import { v4 as uuidv4 } from 'uuid';

export interface ComplianceAlert {
  id: string;
  userId: string;
  transactionId?: string;
  alertType: 'structuring' | 'high_value' | 'rapid_movement' | 'suspicious_pattern' | 'kyc_mismatch';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  status: 'open' | 'investigated' | 'resolved' | 'reported';
  createdAt: Date;
}

export interface SuspiciousActivityReport {
  id: string;
  description: string;
  relatedAlerts: string[];
  status: 'draft' | 'submitted' | 'acknowledged';
  submittedAt?: Date;
}

export class ComplianceService {
  // PNG thresholds (in PGK)
  private readonly HIGH_TRANSACTION_THRESHOLD = 10000; // High-value transaction
  private readonly STRUCTURING_THRESHOLD = 9000; // Just below reporting limit
  private readonly DAILY_VOLUME_THRESHOLD = 50000; // Daily movement limit
  private readonly HOURLY_MOVEMENT_THRESHOLD = 25000; // Rapid movement detection

  /**
   * Perform AML screening on transaction
   */
  async screenTransaction(
    userId: string,
    transactionId: string,
    amount: number,
    toUserId: string
  ): Promise<ComplianceAlert | null> {
    const user = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (user.rows.length === 0) return null;

    const userRecord = user.rows[0];
    const alerts: ComplianceAlert[] = [];

    // Check 1: High-value transaction
    if (amount > this.HIGH_TRANSACTION_THRESHOLD) {
      alerts.push(await this.createAlert(
        userId,
        transactionId,
        'high_value',
        'high',
        `Transaction amount PGK ${amount} exceeds high-value threshold`
      ));
    }

    // Check 2: Structuring (multiple small transactions)
    const recentTransactions = await this.getRecentTransactions(userId, 24); // Last 24 hours
    const totalVolume = recentTransactions.reduce((sum, tx) => sum + tx.amount, 0) + amount;

    if (totalVolume > this.DAILY_VOLUME_THRESHOLD) {
      const transactionCount = recentTransactions.length + 1;
      if (transactionCount > 5) {
        alerts.push(await this.createAlert(
          userId,
          transactionId,
          'structuring',
          'medium',
          `Possible structuring: ${transactionCount} transactions in 24 hours, total PGK ${totalVolume}`
        ));
      }
    }

    // Check 3: Rapid movement
    const rapidTransactions = await this.getRecentTransactions(userId, 1); // Last 1 hour
    const hourlyVolume = rapidTransactions.reduce((sum, tx) => sum + tx.amount, 0) + amount;

    if (hourlyVolume > this.HOURLY_MOVEMENT_THRESHOLD && rapidTransactions.length > 3) {
      alerts.push(await this.createAlert(
        userId,
        transactionId,
        'rapid_movement',
        'high',
        `Rapid fund movement: PGK ${hourlyVolume} in 1 hour`
      ));
    }

    // Check 4: KYC mismatch
    if (userRecord.kyc_status !== 'verified') {
      if (amount > this.HIGH_TRANSACTION_THRESHOLD) {
        alerts.push(await this.createAlert(
          userId,
          transactionId,
          'kyc_mismatch',
          'critical',
          `Large transaction by unverified user (KYC: ${userRecord.kyc_status})`
        ));
      }
    }

    // Check 5: Sanction/watchlist screening
    const watchlistHit = await this.checkWatchlist(userRecord.email, userRecord.phone_number);
    if (watchlistHit) {
      alerts.push(await this.createAlert(
        userId,
        transactionId,
        'suspicious_pattern',
        'critical',
        `User matches sanction/watchlist entry: ${watchlistHit.reason}`
      ));
    }

    return alerts.length > 0 ? alerts[0] : null;
  }

  /**
   * Get recent transactions for a user
   */
  private async getRecentTransactions(userId: string, hoursBack: number) {
    const result = await pool.query(
      `SELECT * FROM transactions 
       WHERE from_wallet_id IN (SELECT id FROM wallets WHERE user_id = $1)
       AND created_at > NOW() - INTERVAL '${hoursBack} hours'
       AND status = 'completed'`,
      [userId]
    );

    return result.rows;
  }

  /**
   * Check against watchlist (OFAC, local sanctions)
   */
  private async checkWatchlist(email: string, phoneNumber: string): Promise<{ reason: string } | null> {
    // TODO: Integrate with real watchlist API (OFAC, PNG sanctions list, etc.)
    // For now, return null (no match)
    return null;
  }

  /**
   * Create compliance alert
   */
  private async createAlert(
    userId: string,
    transactionId: string | undefined,
    alertType: string,
    severity: string,
    description: string
  ): Promise<ComplianceAlert> {
    const alertId = uuidv4();

    await pool.query(
      `INSERT INTO compliance_alerts 
       (id, user_id, transaction_id, alert_type, severity, description, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [alertId, userId, transactionId, alertType, severity, description, 'open']
    );

    return {
      id: alertId,
      userId,
      transactionId,
      alertType: alertType as any,
      severity: severity as any,
      description,
      status: 'open',
      createdAt: new Date(),
    };
  }

  /**
   * Submit Suspicious Activity Report (SAR)
   */
  async submitSuspiciousActivityReport(
    alertIds: string[],
    description: string
  ): Promise<SuspiciousActivityReport> {
    const reportId = uuidv4();

    await pool.query(
      `INSERT INTO suspicious_activity_reports 
       (id, description, related_alerts, status, submitted_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [reportId, description, JSON.stringify(alertIds), 'submitted']
    );

    // Update related alerts
    for (const alertId of alertIds) {
      await pool.query(
        `UPDATE compliance_alerts SET status = $1 WHERE id = $2`,
        ['reported', alertId]
      );
    }

    return {
      id: reportId,
      description,
      relatedAlerts: alertIds,
      status: 'submitted',
      submittedAt: new Date(),
    };
  }

  /**
   * Get compliance alert history for investigation
   */
  async getAlertHistory(userId: string, limit: number = 100) {
    const result = await pool.query(
      `SELECT * FROM compliance_alerts 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  }

  /**
   * Enhanced KYC verification
   */
  async verifyKYC(
    userId: string,
    firstName: string,
    lastName: string,
    dateOfBirth: string,
    documentType: string,
    documentNumber: string
  ): Promise<{ verified: boolean; riskScore: number; message: string }> {
    // TODO: Integrate with KYC provider (IDology, Trulioo, etc.)
    
    // Basic validation for now
    if (!firstName || !lastName || !dateOfBirth || !documentNumber) {
      return {
        verified: false,
        riskScore: 100,
        message: 'Missing required KYC information',
      };
    }

    // Mock verification
    return {
      verified: true,
      riskScore: 25,
      message: 'KYC verification successful',
    };
  }

  /**
   * Calculate user risk profile
   */
  async calculateRiskProfile(userId: string): Promise<{
    overallRisk: 'low' | 'medium' | 'high' | 'critical';
    score: number;
    factors: string[];
  }> {
    const user = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (user.rows.length === 0) throw new Error('User not found');

    const userRecord = user.rows[0];
    let riskScore = 0;
    const factors: string[] = [];

    // KYC status
    if (userRecord.kyc_status === 'unverified') {
      riskScore += 30;
      factors.push('Unverified KYC');
    } else if (userRecord.kyc_status === 'pending') {
      riskScore += 20;
      factors.push('Pending KYC verification');
    }

    // Account age
    const accountAge = Math.floor((Date.now() - new Date(userRecord.created_at).getTime()) / (1000 * 60 * 60 * 24));
    if (accountAge < 7) {
      riskScore += 25;
      factors.push('New account (< 7 days)');
    } else if (accountAge < 30) {
      riskScore += 15;
      factors.push('Recent account (< 30 days)');
    }

    // Transaction alerts
    const alerts = await pool.query(
      `SELECT COUNT(*) as count FROM compliance_alerts WHERE user_id = $1`,
      [userId]
    );

    if (parseInt(alerts.rows[0].count) > 0) {
      riskScore += Math.min(parseInt(alerts.rows[0].count) * 10, 30);
      factors.push(`${alerts.rows[0].count} compliance alerts`);
    }

    // Determine overall risk
    let overallRisk: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (riskScore >= 80) overallRisk = 'critical';
    else if (riskScore >= 60) overallRisk = 'high';
    else if (riskScore >= 40) overallRisk = 'medium';

    return {
      overallRisk,
      score: Math.min(riskScore, 100),
      factors,
    };
  }
}

export default new ComplianceService();
