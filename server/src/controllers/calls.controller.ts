import { Response, NextFunction } from 'express';
import { callsService } from '../services/calls.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export const callsController = {
  async getCallHistory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 30;
      const history = await callsService.getCallHistory(req.user!.userId, limit);
      res.json({ success: true, data: history });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async initiateCall(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const call = await callsService.initiateCall(req.user!.userId, req.body);
      res.status(201).json({ success: true, data: call });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async updateCall(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const updated = await callsService.updateCall(
        req.params.id,
        req.user!.userId,
        req.body
      );
      res.json({ success: true, data: updated });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async deleteCall(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await callsService.deleteCall(req.params.id, req.user!.userId);
      res.json({ success: true, message: 'Call log deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async clearCallHistory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await callsService.clearCallHistory(req.user!.userId);
      res.json({ success: true, message: 'Call history cleared successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

