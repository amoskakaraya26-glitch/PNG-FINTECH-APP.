import pool from '../../database/connection';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export interface TwoFAStatus {
  enabled: boolean;
  method: 'sms' | 'email' | 'totp' | null;
  verified: boolean;
  backupCodesCount: number;
}

export class TwoFactorAuthService {
  /**
   * Generate TOTP secret for authenticator apps
   */
  async generateTOTPSecret(
    userId: string,
    email: string
  ): Promise<{ secret: string; qrCode: string; backupCodes: string[] }> {
    // Generate a random secret (32 bytes = 52 characters in base32)
    const secret = crypto.randomBytes(32).toString('base64').slice(0, 32).toUpperCase();

    // Generate a placeholder QR code (in production, use actual QR code library)
    const qrCode = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`;

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    return {
      secret,
      qrCode,
      backupCodes,
    };
  }

  /**
   * Verify TOTP token (simplified version without speakeasy)
   */
  verifyTOTPToken(secret: string, token: string): boolean {
    // In production, implement proper TOTP verification
    // For now, accept any 6-digit token
    return /^\d{6}$/.test(token);
  }

  /**
   * Enable 2FA for user
   */
  async enableTwoFA(
    userId: string,
    method: 'sms' | 'email' | 'totp',
    secret?: string,
    backupCodes?: string[]
  ): Promise<void> {
    const hashedBackupCodes = backupCodes
      ? await Promise.all(backupCodes.map(code => this.hashBackupCode(code)))
      : [];

    await pool.query(
      `UPDATE users SET 
       two_fa_enabled = true,
       two_fa_method = $1,
       two_fa_secret = $2,
       two_fa_verified = false,
       updated_at = NOW()
       WHERE id = $3`,
      [method, secret || null, userId]
    );

    if (hashedBackupCodes.length > 0) {
      for (const code of hashedBackupCodes) {
        await pool.query(
          `INSERT INTO backup_codes (id, user_id, code) VALUES ($1, $2, $3)`,
          [uuidv4(), userId, code]
        );
      }
    }
  }

  /**
   * Disable 2FA for user
   */
  async disableTwoFA(userId: string): Promise<void> {
    await pool.query(
      `UPDATE users SET 
       two_fa_enabled = false,
       two_fa_method = null,
       two_fa_secret = null,
       two_fa_verified = false,
       updated_at = NOW()
       WHERE id = $1`,
      [userId]
    );

    // Delete backup codes
    await pool.query('DELETE FROM backup_codes WHERE user_id = $1', [userId]);
  }

  /**
   * Send OTP via SMS
   */
  async sendOTPBySMS(phoneNumber: string): Promise<string> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await pool.query(
      `INSERT INTO otp_tokens (id, phone_number, otp, expires_at, used_at) 
       VALUES ($1, $2, $3, $4, null)`,
      [uuidv4(), phoneNumber, otp, expiresAt]
    );

    // TODO: Integrate with SMS provider (e.g., Twilio)
    console.log(`[DEV] OTP for ${phoneNumber}: ${otp}`);

    return otp;
  }

  /**
   * Verify OTP
   */
  async verifyOTP(phoneNumber: string, otp: string): Promise<boolean> {
    const result = await pool.query(
      `SELECT * FROM otp_tokens 
       WHERE phone_number = $1 AND otp = $2 AND expires_at > NOW() AND used_at IS NULL
       ORDER BY created_at DESC LIMIT 1`,
      [phoneNumber, otp]
    );

    if (result.rows.length === 0) {
      return false;
    }

    // Mark as used
    await pool.query(
      `UPDATE otp_tokens SET used_at = NOW() WHERE id = $1`,
      [result.rows[0].id]
    );

    return true;
  }

  /**
   * Use backup code
   */
  async useBackupCode(userId: string, code: string): Promise<boolean> {
    const result = await pool.query(
      `SELECT * FROM backup_codes WHERE user_id = $1 AND code = $2 AND used_at IS NULL`,
      [userId, code]
    );

    if (result.rows.length === 0) {
      return false;
    }

    // Mark as used
    await pool.query(
      `UPDATE backup_codes SET used_at = NOW() WHERE id = $1`,
      [result.rows[0].id]
    );

    return true;
  }

  /**
   * Get 2FA status for user
   */
  async getTwoFAStatus(userId: string): Promise<TwoFAStatus> {
    const result = await pool.query(
      `SELECT two_fa_enabled, two_fa_method, two_fa_verified FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = result.rows[0];

    const backupCodes = await pool.query(
      `SELECT COUNT(*) as count FROM backup_codes WHERE user_id = $1 AND used_at IS NULL`,
      [userId]
    );

    return {
      enabled: user.two_fa_enabled,
      method: user.two_fa_method,
      verified: user.two_fa_verified,
      backupCodesCount: parseInt(backupCodes.rows[0].count),
    };
  }

  /**
   * Hash backup code
   */
  private async hashBackupCode(code: string): Promise<string> {
    // In production, use bcrypt
    return crypto.createHash('sha256').update(code).digest('hex');
  }
}

export default new TwoFactorAuthService();
