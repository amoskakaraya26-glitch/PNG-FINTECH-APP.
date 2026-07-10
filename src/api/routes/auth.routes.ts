import { Router } from 'express';
import {
  changePin,
  completeOnboarding,
  getProfile,
  login,
  register,
  updateProfile,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/change-pin', authenticate, changePin);
router.post('/complete-onboarding', authenticate, completeOnboarding);
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    service: 'auth',
  });
});

export default router;