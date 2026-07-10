import { Router } from 'express';
import { AuthRequest, authenticate } from '../middleware/auth.middleware';
import FacialRecognitionService from '../services/FacialRecognitionService';
import jwt from 'jsonwebtoken';
import pool from '../../database/connection';

const router = Router();

/**
 * POST /api/auth/face/enroll
 * Register user's face(s) for biometric login
 */
router.post('/face/enroll', authenticate, async (req: AuthRequest, res) => {
  try {
    const { faceTemplates } = req.body; // Array of face template data (JSON strings)

    if (!Array.isArray(faceTemplates) || faceTemplates.length === 0) {
      return res.status(400).json({ error: 'At least one face template required' });
    }

    if (faceTemplates.length > 5) {
      return res.status(400).json({ error: 'Maximum 5 face templates allowed' });
    }

    const enrolled = await FacialRecognitionService.enrollFace(req.user?.id!, faceTemplates);

    res.json({
      message: 'Face enrollment successful',
      templateCount: enrolled.length,
      enrolled: true,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/auth/face/login
 * Authenticate user using facial recognition
 */
router.post('/face/login', async (req, res) => {
  try {
    const { email, phone, faceTemplate } = req.body;
    const identifier = (email || phone || '').trim();

    if (!identifier || !faceTemplate) {
      return res.status(400).json({ error: 'Phone/email and face template required' });
    }

    // Find user by email or phone
    const userResult = await pool.query(
      `SELECT id, email, phone, is_admin, facial_recognition_enabled 
       FROM users 
       WHERE email = $1 OR phone = $1`,
      [identifier]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    if (!user.facial_recognition_enabled) {
      return res.status(403).json({ error: 'Facial recognition not enabled for this account' });
    }

    // Verify face
    const verification = await FacialRecognitionService.verifyFace(user.id, faceTemplate);

    if (!verification.success) {
      return res.status(401).json({
        error: verification.message,
        matchScore: verification.matchScore,
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, phone: user.phone, isAdmin: user.is_admin },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Facial recognition login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        isAdmin: user.is_admin,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/auth/face/status
 * Get facial recognition enrollment status
 */
router.get('/face/status', authenticate, async (req: AuthRequest, res) => {
  try {
    const status = await FacialRecognitionService.getFaceEnrollmentStatus(req.user?.id!);

    res.json(status);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/auth/face/re-enroll
 * Update face enrollment with new templates
 */
router.post('/face/re-enroll', authenticate, async (req: AuthRequest, res) => {
  try {
    const { faceTemplates } = req.body;

    if (!Array.isArray(faceTemplates) || faceTemplates.length === 0) {
      return res.status(400).json({ error: 'At least one face template required' });
    }

    const enrolled = await FacialRecognitionService.reEnrollFace(req.user?.id!, faceTemplates);

    res.json({
      message: 'Face re-enrollment successful',
      templateCount: enrolled.length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/auth/face/disable
 * Disable facial recognition for user
 */
router.post('/face/disable', authenticate, async (req: AuthRequest, res) => {
  try {
    await FacialRecognitionService.disableFacialRecognition(req.user?.id!);

    res.json({ message: 'Facial recognition disabled' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/auth/face/attempts
 * Get login attempt history
 */
router.get('/face/attempts', authenticate, async (req: AuthRequest, res) => {
  try {
    const attempts = await FacialRecognitionService.getAttemptHistory(req.user?.id!);

    res.json({ attempts });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
