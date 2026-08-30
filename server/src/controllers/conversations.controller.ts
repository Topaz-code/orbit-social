import { Response, NextFunction } from 'express';
import { conversationsService } from '../services/conversations.service.js';
import { messagesService } from '../services/messages.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export const conversationsController = {
  async getConversations(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const conversations = await conversationsService.getConversations(req.user!.userId);
      res.json({ success: true, data: conversations });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getConversationById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const conversation = await conversationsService.getConversationById(
        req.params.id,
        req.user!.userId
      );
      res.json({ success: true, data: conversation });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message });
    }
  },

  async createConversation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const conversation = await conversationsService.createConversation(
        req.user!.userId,
        req.body
      );
      res.status(201).json({ success: true, data: conversation });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async markAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await conversationsService.markAsRead(req.params.id, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async getMessages(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const cursor = req.query.cursor as string;
      const result = await messagesService.getMessages(
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

  async sendMessage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const message = await messagesService.sendMessage(
        req.params.id,
        req.user!.userId,
        req.body
      );
      res.status(201).json({ success: true, data: message });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },
};
