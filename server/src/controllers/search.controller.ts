import { Request, Response, NextFunction } from 'express';
import { searchService } from '../services/search.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export const searchController = {
  async search(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const query = (req.query.q as string) || '';
      const type = (req.query.type as string) || 'all';
      const result = await searchService.search(query, type, req.user?.userId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getTrending(req: Request, res: Response, next: NextFunction) {
    try {
      const trending = await searchService.getTrendingTopics();
      res.json({ success: true, data: trending });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};
