import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { auditService } from '../services/audit.service.js';
import { AuthenticatedRequest } from '../types/index.js';

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
      auditService.recordEvent('AUTH_LOGIN', {
        userId: result.user.id,
        username: result.user.username,
        ipAddress,
      });
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

  async logout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // In JWT stateless architecture, client deletes tokens.
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.refreshToken(req.body.refreshToken);
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
