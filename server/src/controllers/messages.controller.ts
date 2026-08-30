import { Response, NextFunction } from 'express';
import { messagesService } from '../services/messages.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export const messagesController = {
  async deleteMessage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const forEveryone = req.query.forEveryone === 'true';
      const result = await messagesService.deleteMessage(
        req.params.id,
        req.user!.userId,
        forEveryone
      );
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },
};
