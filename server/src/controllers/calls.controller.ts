import { Response, NextFunction } from 'express';
import { callsService } from '../services/calls.service.js';
import { livekitService } from '../services/livekit.service.js';
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

  async getCallById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const call = await callsService.getCallById(req.params.id, req.user!.userId);
      if (!call) {
        return res.status(404).json({ success: false, message: 'Call not found' });
      }
      res.json({ success: true, data: call });
    } catch (error: any) {
      res.status(error.message === 'Unauthorized' ? 403 : 500).json({ success: false, message: error.message });
    }
  },

  async initiateCall(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const call = await callsService.initiateCall(req.user!.userId, req.body);
      const userId = req.user!.userId;
      const userName = (req.user as any)?.username || (req.user as any)?.display_name || userId;
      const roomName = `orbit_call_${call.id}`;
      const token = await livekitService.generateToken(roomName, userId, userName);

      res.status(201).json({
        success: true,
        data: {
          ...call,
          livekit: {
            token,
            url: livekitService.getUrl(),
            room: roomName,
          },
        },
      });
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

  async declineCall(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const updated = await callsService.declineCall(req.params.id, req.user!.userId);
      res.json({ success: true, data: updated });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async cancelCall(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const updated = await callsService.cancelCall(req.params.id, req.user!.userId);
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

  async getCallToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const call = await callsService.getCallById(req.params.id, req.user!.userId);
      if (!call) {
        return res.status(404).json({ success: false, message: 'Call not found' });
      }

      const userId = req.user!.userId;
      const userName = (req.user as any)?.username || (req.user as any)?.display_name || userId;
      const roomName = `orbit_call_${call.id}`;

      const token = await livekitService.generateToken(roomName, userId, userName);
      res.json({
        success: true,
        data: {
          token,
          url: livekitService.getUrl(),
          room: roomName,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

