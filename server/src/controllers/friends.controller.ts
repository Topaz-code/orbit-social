import { Response, NextFunction } from 'express';
import { friendsService } from '../services/friends.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export const friendsController = {
  async getFriends(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const friends = await friendsService.getFriends(req.user!.userId);
      res.json({ success: true, data: friends });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getFriendRequests(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const requests = await friendsService.getFriendRequests(req.user!.userId);
      res.json({ success: true, data: requests });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async sendFriendRequest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const targetUserId = req.params.userId;
      const result = await friendsService.sendFriendRequest(req.user!.userId, targetUserId);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async acceptFriendRequest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const requestId = req.params.requestId;
      const result = await friendsService.acceptFriendRequest(requestId, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async rejectFriendRequest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const requestId = req.params.requestId;
      const result = await friendsService.rejectFriendRequest(requestId, req.user!.userId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async removeFriend(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const friendshipId = req.params.friendshipId;
      const result = await friendsService.removeFriend(friendshipId, req.user!.userId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async blockUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const targetUserId = req.params.userId;
      const result = await friendsService.blockUser(req.user!.userId, targetUserId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },
};
