import { Response, NextFunction } from 'express';
import { usersService } from '../services/users.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export const usersController = {
  async getUserProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const targetUserId = req.params.id;
      const currentUserId = req.user?.userId;
      const profile = await usersService.getUserProfile(targetUserId, currentUserId);
      res.json({ success: true, data: profile });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message });
    }
  },

  async updateUserProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const targetUserId = req.params.id;
      if (req.user!.userId !== targetUserId) {
        return res.status(403).json({ success: false, message: 'Unauthorized to modify this profile' });
      }

      const updated = await usersService.updateUserProfile(targetUserId, req.body);
      res.json({ success: true, data: updated });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async getUserPosts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const targetUserId = req.params.id;
      const currentUserId = req.user?.userId;
      const limit = parseInt(req.query.limit as string) || 20;
      const cursor = req.query.cursor as string;

      const result = await usersService.getUserPosts(targetUserId, currentUserId, limit, cursor);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async getUserFriends(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const targetUserId = req.params.id;
      const friends = await usersService.getUserFriends(targetUserId);
      res.json({ success: true, data: friends });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async getUserMedia(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const targetUserId = req.params.id;
      const currentUserId = req.user?.userId;
      const media = await usersService.getUserMedia(targetUserId, currentUserId);
      res.json({ success: true, data: media });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async exportData(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await usersService.exportUserData(req.user!.userId);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=orbit-data-${req.user!.username}.json`);
      res.send(JSON.stringify(data, null, 2));
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async deleteAccount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await usersService.deleteAccount(req.user!.userId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getDiscoverUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const currentUserId = req.user?.userId;
      const users = await usersService.getDiscoverUsers(currentUserId);
      res.json({ success: true, data: users });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};
