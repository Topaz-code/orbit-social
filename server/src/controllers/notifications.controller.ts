import { Response, NextFunction } from 'express';
import { notificationsService } from '../services/notifications.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export const notificationsController = {
  async getNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 30;
      const result = await notificationsService.getNotifications(req.user!.userId, limit);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async markAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const notification = await notificationsService.markAsRead(req.params.id, req.user!.userId);
      res.json({ success: true, data: notification });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async markAllAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await notificationsService.markAllAsRead(req.user!.userId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async deleteNotification(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await notificationsService.deleteNotification(req.params.id, req.user!.userId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async clearAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await notificationsService.clearAllNotifications(req.user!.userId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};
