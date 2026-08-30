import { Response, NextFunction } from 'express';
import { commentsService } from '../services/comments.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export const commentsController = {
  async updateComment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const updated = await commentsService.updateComment(
        req.params.id,
        req.user!.userId,
        req.body.content
      );
      res.json({ success: true, data: updated });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async deleteComment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await commentsService.deleteComment(req.params.id, req.user!.userId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },
};
