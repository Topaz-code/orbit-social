import { Response, NextFunction } from 'express';
import { storiesService } from '../services/stories.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export const storiesController = {
  async getStories(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const stories = await storiesService.getStories(req.user!.userId);
      res.json({ success: true, data: stories });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getStoryById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const story = await storiesService.getStoryById(req.params.id, req.user!.userId);
      res.json({ success: true, data: story });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message });
    }
  },

  async createStory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const story = await storiesService.createStory(req.user!.userId, req.body);
      res.status(201).json({ success: true, data: story });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async markAsViewed(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await storiesService.markAsViewed(req.params.id, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async deleteStory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await storiesService.deleteStory(req.params.id, req.user!.userId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },
};
