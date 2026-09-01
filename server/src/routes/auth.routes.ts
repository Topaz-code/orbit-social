import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from '../controllers/auth.controller.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  resetPasswordSchema,
} from '../validators/auth.validator.js';

const router = Router();

// Rate limiter for login (brute force protection — OWASP: max 5 per 15 min)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again in 15 minutes.',
  },
});

// Rate limiter for password reset and security questions
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many password reset attempts. Please try again in 15 minutes.',
  },
});

// Rate limiter for account registration
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many accounts created from this IP. Please try again later.',
  },
});

router.post('/register', registerLimiter, validateBody(registerSchema), authController.register);
router.post('/login', loginLimiter, validateBody(loginSchema), authController.login);
router.post('/logout', authenticateToken, authController.logout);
router.post('/refresh', validateBody(refreshSchema), authController.refresh);
router.get('/me', authenticateToken, authController.getMe);
router.post('/reset-password', passwordResetLimiter, validateBody(resetPasswordSchema), authController.resetPassword);
router.get('/security-question', passwordResetLimiter, authController.getSecurityQuestion);
router.post('/change-password', authenticateToken, authController.changePassword);

export default router;
