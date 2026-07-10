import pool from '../../database/connection';
import { v4 as uuidv4 } from 'uuid';

export interface FaceTemplate {
  id: string;
  userId: string;
  templateData: string; // Stored as JSON
  captureDate: Date;
  isActive: boolean;
}

export interface FaceLoginAttempt {
  id: string;
  userId: string;
  attempts: number;
  lastAttemptAt: Date;
  lockedUntil?: Date;
  status: 'success' | 'failed' | 'locked';
}

export class FacialRecognitionService {
  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes
  private readonly TEMPLATE_THRESHOLD = 0.6; // Similarity threshold for match

  /**
   * Register user's face during enrollment
   */
  async enrollFace(userId: string, faceTemplates: string[]): Promise<FaceTemplate[]> {
    const stored: FaceTemplate[] = [];

    for (const template of faceTemplates) {
      const id = uuidv4();

      await pool.query(
        `INSERT INTO face_templates (id, user_id, template_data, capture_date, is_active)
         VALUES ($1, $2, $3, NOW(), true)`,
        [id, userId, template]
      );

      stored.push({
        id,
        userId,
        templateData: template,
        captureDate: new Date(),
        isActive: true,
      });
    }

    // Update user to indicate face enrollment complete
    await pool.query(
      `UPDATE users SET facial_recognition_enabled = true WHERE id = $1`,
      [userId]
    );

    return stored;
  }

  /**
   * Verify face during login
   */
  async verifyFace(userId: string, incomingTemplate: string): Promise<{
    success: boolean;
    message: string;
    matchScore?: number;
  }> {
    // Check if user is locked out
    const lockout = await this.checkLockout(userId);
    if (lockout.locked) {
      return {
        success: false,
        message: `Too many failed attempts. Try again in ${Math.ceil(
          (lockout.lockedUntil!.getTime() - Date.now()) / 60000
        )} minutes.`,
      };
    }

    // Get stored face templates
    const templates = await pool.query(
      `SELECT template_data FROM face_templates 
       WHERE user_id = $1 AND is_active = true
       ORDER BY capture_date DESC
       LIMIT 3`,
      [userId]
    );

    if (templates.rows.length === 0) {
      return {
        success: false,
        message: 'No face enrollment found. Please register your face first.',
      };
    }

    // Compare incoming template with stored templates
    let bestMatch = 0;
    for (const row of templates.rows) {
      const similarity = this.calculateSimilarity(incomingTemplate, row.template_data);
      bestMatch = Math.max(bestMatch, similarity);
    }

    const isMatch = bestMatch >= this.TEMPLATE_THRESHOLD;

    if (isMatch) {
      // Success - clear attempts
      await this.clearFailedAttempts(userId);
      return {
        success: true,
        message: 'Face recognized successfully',
        matchScore: bestMatch,
      };
    } else {
      // Failed attempt
      await this.recordFailedAttempt(userId);
      return {
        success: false,
        message: 'Face not recognized. Please try again.',
        matchScore: bestMatch,
      };
    }
  }

  /**
   * Check if user account is locked due to failed attempts
   */
  private async checkLockout(userId: string): Promise<{
    locked: boolean;
    lockedUntil?: Date;
  }> {
    const result = await pool.query(
      `SELECT * FROM face_login_attempts WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return { locked: false };
    }

    const attempt = result.rows[0];

    if (attempt.locked_until && new Date(attempt.locked_until) > new Date()) {
      return {
        locked: true,
        lockedUntil: new Date(attempt.locked_until),
      };
    }

    return { locked: false };
  }

  /**
   * Record failed login attempt
   */
  private async recordFailedAttempt(userId: string): Promise<void> {
    const existing = await pool.query(
      `SELECT * FROM face_login_attempts WHERE user_id = $1`,
      [userId]
    );

    let attempts = 1;
    let lockedUntil = null;

    if (existing.rows.length > 0) {
      attempts = existing.rows[0].attempts + 1;

      if (attempts >= this.MAX_ATTEMPTS) {
        lockedUntil = new Date(Date.now() + this.LOCKOUT_DURATION);
      }

      await pool.query(
        `UPDATE face_login_attempts 
         SET attempts = $1, last_attempt_at = NOW(), locked_until = $2
         WHERE user_id = $3`,
        [attempts, lockedUntil, userId]
      );
    } else {
      await pool.query(
        `INSERT INTO face_login_attempts (id, user_id, attempts, last_attempt_at, locked_until, status)
         VALUES ($1, $2, $3, NOW(), $4, 'failed')`,
        [uuidv4(), userId, attempts, lockedUntil]
      );
    }
  }

  /**
   * Clear failed attempts after successful login
   */
  private async clearFailedAttempts(userId: string): Promise<void> {
    await pool.query(
      `DELETE FROM face_login_attempts WHERE user_id = $1`,
      [userId]
    );
  }

  /**
   * Simple similarity calculation (Euclidean distance)
   * In production, use more sophisticated facial recognition algorithms
   */
  private calculateSimilarity(template1: string, template2: string): number {
    try {
      const arr1 = this.templateToVector(template1);
      const arr2 = this.templateToVector(template2);

      if (arr1.length === 0 || arr2.length === 0) {
        return 0;
      }

      let dot = 0;
      let norm1 = 0;
      let norm2 = 0;
      const len = Math.min(arr1.length, arr2.length);

      for (let i = 0; i < len; i++) {
        const a = Number(arr1[i]) || 0;
        const b = Number(arr2[i]) || 0;
        dot += a * b;
        norm1 += a * a;
        norm2 += b * b;
      }

      if (norm1 === 0 || norm2 === 0) {
        return 0;
      }

      return dot / (Math.sqrt(norm1) * Math.sqrt(norm2));
    } catch (error) {
      return 0;
    }
  }

  private templateToVector(template: string): number[] {
    const parsed = JSON.parse(template);

    if (Array.isArray(parsed)) {
      return parsed.map(value => Number(value) || 0);
    }

    if (parsed && typeof parsed === 'object' && typeof parsed.data === 'string') {
      return this.vectorizeBase64(parsed.data);
    }

    if (typeof parsed === 'string') {
      return this.vectorizeBase64(parsed);
    }

    return [];
  }

  private vectorizeBase64(base64: string): number[] {
    const payload = (base64.split(',')[1] || base64).slice(0, 2048);
    if (!payload) {
      return [];
    }

    const bins = new Array(64).fill(0);
    for (let i = 0; i < payload.length; i++) {
      bins[payload.charCodeAt(i) % bins.length] += 1;
    }

    const total = payload.length;
    return bins.map(count => count / total);
  }

  /**
   * Get face enrollment status for user
   */
  async getFaceEnrollmentStatus(userId: string): Promise<{
    enrolled: boolean;
    templateCount: number;
    lastEnrolledAt?: Date;
  }> {
    const result = await pool.query(
      `SELECT COUNT(*) as count, MAX(capture_date) as last_captured
       FROM face_templates 
       WHERE user_id = $1 AND is_active = true`,
      [userId]
    );

    const count = parseInt(result.rows[0].count);

    return {
      enrolled: count > 0,
      templateCount: count,
      lastEnrolledAt: result.rows[0].last_captured ? new Date(result.rows[0].last_captured) : undefined,
    };
  }

  /**
   * Re-enroll face (update templates)
   */
  async reEnrollFace(userId: string, newTemplates: string[]): Promise<FaceTemplate[]> {
    // Deactivate old templates
    await pool.query(
      `UPDATE face_templates SET is_active = false WHERE user_id = $1`,
      [userId]
    );

    // Add new templates
    return this.enrollFace(userId, newTemplates);
  }

  /**
   * Disable facial recognition for user
   */
  async disableFacialRecognition(userId: string): Promise<void> {
    await pool.query(
      `UPDATE users SET facial_recognition_enabled = false WHERE id = $1`,
      [userId]
    );

    await pool.query(
      `UPDATE face_templates SET is_active = false WHERE user_id = $1`,
      [userId]
    );

    await pool.query(
      `DELETE FROM face_login_attempts WHERE user_id = $1`,
      [userId]
    );
  }

  /**
   * Get login attempt history
   */
  async getAttemptHistory(userId: string): Promise<FaceLoginAttempt[]> {
    const result = await pool.query(
      `SELECT * FROM face_login_attempts WHERE user_id = $1 ORDER BY last_attempt_at DESC LIMIT 10`,
      [userId]
    );

    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      attempts: row.attempts,
      lastAttemptAt: new Date(row.last_attempt_at),
      lockedUntil: row.locked_until ? new Date(row.locked_until) : undefined,
      status: row.status,
    }));
  }
}

export default new FacialRecognitionService();
