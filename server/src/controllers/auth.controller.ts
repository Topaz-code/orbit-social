import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { auditService } from '../services/audit.service.js';
import { AuthenticatedRequest } from '../types/index.js';

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    try {
      const result = await authService.register(req.body);
      auditService.recordEvent('AUTH_REGISTER', {
        userId: result.user.id,
        username: result.user.username,
        ipAddress,
      });

      if (result.refreshToken) {
        res.cookie('orbit_refresh_token', result.refreshToken, getCookieOptions());
      }

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result,
      });
    } catch (error: any) {
      auditService.recordEvent('AUTH_FAILED', {
        username: req.body?.username || req.body?.email,
        ipAddress,
        details: { reason: 'Registration error', message: error.message },
      });
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    try {
      const result = await authService.login(req.body);

      // If 2FA OTP is required, return challenge without session cookies
      if ((result as any).requires2FA) {
        return res.json({
          success: true,
          requires2FA: true,
          tempToken: (result as any).tempToken,
          message: (result as any).message,
        });
      }

      auditService.recordEvent('AUTH_LOGIN', {
        userId: (result as any).user.id,
        username: (result as any).user.username,
        ipAddress,
      });

      if ((result as any).refreshToken) {
        res.cookie('orbit_refresh_token', (result as any).refreshToken, getCookieOptions());
      }

      res.json({
        success: true,
        message: 'Logged in successfully',
        data: result,
      });
    } catch (error: any) {
      auditService.recordEvent('AUTH_FAILED', {
        username: req.body?.identifier || req.body?.username,
        ipAddress,
        details: { reason: 'Login failed', message: error.message },
      });
      res.status(401).json({ success: false, message: error.message });
    }
  },

  async verify2FA(req: Request, res: Response, next: NextFunction) {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    try {
      const { tempToken, code } = req.body;
      if (!tempToken || !code) {
        return res.status(400).json({ success: false, message: 'Verification session and code are required' });
      }

      const result = await authService.verify2FALogin(tempToken, code);
      auditService.recordEvent('AUTH_LOGIN', {
        userId: result.user.id,
        username: result.user.username,
        ipAddress,
        details: { method: '2FA_OTP' },
      });

      if (result.refreshToken) {
        res.cookie('orbit_refresh_token', result.refreshToken, getCookieOptions());
      }

      res.json({
        success: true,
        message: '2FA verified successfully',
        data: result,
      });
    } catch (error: any) {
      res.status(401).json({ success: false, message: error.message });
    }
  },

  async toggle2FA(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const enabled = Boolean(req.body.enabled);
      const updated = await authService.toggle2FA(req.user!.userId, enabled);
      res.json({
        success: true,
        message: `Two-factor authentication ${enabled ? 'enabled' : 'disabled'} successfully`,
        data: updated,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async logout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.clearCookie('orbit_refresh_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
        path: '/',
      });
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const token = (req as any).cookies?.orbit_refresh_token || req.body?.refreshToken;
      if (!token) {
        return res.status(401).json({ success: false, message: 'Refresh token required' });
      }
      const result = await authService.refreshToken(token);
      if (result.refreshToken) {
        res.cookie('orbit_refresh_token', result.refreshToken, getCookieOptions());
      }
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(401).json({ success: false, message: error.message });
    }
  },

  async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = await authService.getCurrentUser(req.user!.userId);
      res.json({ success: true, data: user });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message });
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    try {
      const result = await authService.resetPassword(req.body);
      auditService.recordEvent('PASSWORD_RESET', {
        username: req.body?.identifier,
        ipAddress,
      });
      res.json(result);
    } catch (error: any) {
      auditService.recordEvent('AUTH_FAILED', {
        username: req.body?.identifier,
        ipAddress,
        details: { reason: 'Password reset failure', message: error.message },
      });
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    try {
      const result = await authService.changePassword(req.user!.userId, req.body);
      auditService.recordEvent('PASSWORD_CHANGED', {
        userId: req.user!.userId,
        username: req.user!.username,
        ipAddress,
      });
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async getSecurityQuestion(req: Request, res: Response, next: NextFunction) {
    try {
      const identifier = req.query.identifier as string;
      if (!identifier) {
        return res.status(400).json({ success: false, message: 'Identifier query param is required' });
      }
      const result = await authService.getSecurityQuestion(identifier);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message });
    }
  },
};
