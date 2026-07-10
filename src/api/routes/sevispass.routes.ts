import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import sevisPassService from '../../integrations/sevispass/service';
import pool from '../../database/connection';
import jwt from 'jsonwebtoken';

const router = Router();

/**
 * Step 1: Initiate SevisPass login
 * Returns the redirect URL to SevisPass OAuth provider
 */
router.get('/sevispass/login', async (req: Request, res: Response) => {
  try {
    const mockMode = process.env.SEVISPASS_USE_MOCK === 'true';
    const missingConfig =
      !process.env.SEVISPASS_CLIENT_ID ||
      !process.env.SEVISPASS_CLIENT_SECRET ||
      !process.env.SEVISPASS_AUTH_URL ||
      !process.env.SEVISPASS_API_URL ||
      !process.env.SEVISPASS_REDIRECT_URI;
    const placeholderConfig =
      process.env.SEVISPASS_CLIENT_ID === 'your_sevispass_client_id' ||
      process.env.SEVISPASS_CLIENT_SECRET === 'your_sevispass_client_secret' ||
      process.env.SEVISPASS_AUTH_URL === 'https://auth.sevispass.png' ||
      process.env.SEVISPASS_API_URL === 'https://api.sevispass.png';

    if (!mockMode && (missingConfig || placeholderConfig)) {
      return res.status(500).json({
        success: false,
        error:
          'SevisPass is not configured for real credentials. Set SEVISPASS_CLIENT_ID, SEVISPASS_CLIENT_SECRET, SEVISPASS_AUTH_URL, SEVISPASS_API_URL, and SEVISPASS_REDIRECT_URI in .env, or set SEVISPASS_USE_MOCK=true for testing.',
      });
    }

    // Generate a unique state value for CSRF protection
    const state = uuidv4();

    // Store state in session (you might want to use Redis or a session store)
    // For now, we'll just generate it
    const loginUrl = sevisPassService.getLoginUrl(state);

    res.json({
      success: true,
      loginUrl,
      state, // Return state so frontend can verify later if needed
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * Step 2: Handle SevisPass OAuth callback
 * This endpoint receives the authorization code from SevisPass
 */
router.get('/sevispass/callback', async (req: Request, res: Response) => {
  try {
    const { code, state, error, error_description } = req.query;

    // Check for errors from SevisPass
    if (error) {
      return res.status(400).json({
        success: false,
        error: error_description || 'SevisPass authentication failed',
      });
    }

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing authorization code',
      });
    }

    // Exchange code for access token
    const tokenResponse = await sevisPassService.exchangeCodeForToken(code);

    // Get user information from SevisPass
    const sevisPassUser = await sevisPassService.getUserInfo(tokenResponse.accessToken);

    // Check if user exists in our database
    let user = await pool.query('SELECT * FROM users WHERE phone = $1', [sevisPassUser.phone]);

    if (user.rows.length === 0) {
      // Create new user from SevisPass data
      const userId = uuidv4();
      const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      user = await pool.query(
        `INSERT INTO users (id, phone, full_name, email, kyc_status, is_active, referral_code, sevispass_id) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         RETURNING *`,
        [
          userId,
          sevisPassUser.phone,
          sevisPassUser.fullName,
          sevisPassUser.email,
          sevisPassUser.verified ? 'verified' : 'pending',
          true,
          referralCode,
          sevisPassUser.id,
        ]
      );

      // Create wallet for new user
      await pool.query(
        'INSERT INTO wallets (id, user_id, balance, currency) VALUES ($1, $2, $3, $4)',
        [uuidv4(), userId, 0, 'PGK']
      );
    } else {
      // Update existing user with SevisPass data
      await pool.query(
        `UPDATE users SET sevispass_id = $1, kyc_status = $2, email = $3, full_name = $4, updated_at = NOW() 
         WHERE phone = $5`,
        [
          sevisPassUser.id,
          sevisPassUser.verified ? 'verified' : user.rows[0].kyc_status,
          sevisPassUser.email,
          sevisPassUser.fullName,
          sevisPassUser.phone,
        ]
      );
    }

    const userData = user.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { id: userData.id, phone: userData.phone, isAdmin: userData.is_admin },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    // Store SevisPass tokens in database for future use
    await pool.query(
      `INSERT INTO sevispass_tokens (id, user_id, access_token, refresh_token, expires_at) 
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) DO UPDATE SET access_token = $3, refresh_token = $4, expires_at = $5`,
      [
        uuidv4(),
        userData.id,
        tokenResponse.accessToken,
        tokenResponse.refreshToken,
        new Date(Date.now() + tokenResponse.expiresIn * 1000),
      ]
    );

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const redirectUrl = `${frontendUrl}/dashboard?token=${token}&sevispass=true`;

    res.redirect(redirectUrl);
  } catch (error: any) {
    console.error('SevisPass callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(error.message)}`);
  }
});

/**
 * Get current user's SevisPass verification status
 */
router.get('/sevispass/status', async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const result = await pool.query('SELECT sevispass_id, kyc_status FROM users WHERE id = $1', [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      sevispassId: result.rows[0].sevispass_id,
      kycStatus: result.rows[0].kyc_status,
      verified: !!result.rows[0].sevispass_id,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * Refresh SevisPass token
 */
router.post('/sevispass/refresh-token', async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const tokenResult = await pool.query(
      'SELECT refresh_token FROM sevispass_tokens WHERE user_id = $1',
      [userId]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ success: false, error: 'No SevisPass token found' });
    }

    const newTokens = await sevisPassService.refreshAccessToken(tokenResult.rows[0].refresh_token);

    // Update tokens in database
    await pool.query(
      `UPDATE sevispass_tokens SET access_token = $1, refresh_token = $2, expires_at = $3 
       WHERE user_id = $4`,
      [
        newTokens.accessToken,
        newTokens.refreshToken,
        new Date(Date.now() + newTokens.expiresIn * 1000),
        userId,
      ]
    );

    res.json({ success: true, message: 'Token refreshed successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
