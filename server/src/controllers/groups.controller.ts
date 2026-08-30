import { Response, NextFunction } from 'express';
import { groupsService } from '../services/groups.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export const groupsController = {
  async getMyGroups(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const groups = await groupsService.getMyGroups(req.user!.userId);
      res.json({ success: true, data: groups });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getDiscoverGroups(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const groups = await groupsService.getDiscoverGroups(req.user!.userId);
      res.json({ success: true, data: groups });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getGroupById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const group = await groupsService.getGroupById(req.params.id, req.user?.userId);
      res.json({ success: true, data: group });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message });
    }
  },

  async createGroup(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const group = await groupsService.createGroup(req.user!.userId, req.body);
      res.status(201).json({ success: true, data: group });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async updateGroup(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const group = await groupsService.updateGroup(req.params.id, req.user!.userId, req.body);
      res.json({ success: true, data: group });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async deleteGroup(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await groupsService.deleteGroup(req.params.id, req.user!.userId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async joinGroup(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await groupsService.joinGroup(req.params.id, req.user!.userId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async leaveGroup(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await groupsService.leaveGroup(req.params.id, req.user!.userId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async addMember(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await groupsService.addMember(
        req.params.id,
        req.user!.userId,
        req.body.user_id,
        req.body.role
      );
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async removeMember(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await groupsService.removeMember(
        req.params.id,
        req.user!.userId,
        req.params.userId
      );
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async getGroupPosts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const cursor = req.query.cursor as string;
      const result = await groupsService.getGroupPosts(
        req.params.id,
        req.user!.userId,
        limit,
        cursor
      );
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async createGroupPost(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const post = await groupsService.createGroupPost(
        req.params.id,
        req.user!.userId,
        req.body
      );
      res.status(201).json({ success: true, data: post });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },
};
