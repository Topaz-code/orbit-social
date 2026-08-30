import { Response, NextFunction } from 'express';
import { postsService } from '../services/posts.service.js';
import { commentsService } from '../services/comments.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export const postsController = {
  async getFeed(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const cursor = req.query.cursor as string;
      const result = await postsService.getFeed(req.user!.userId, limit, cursor);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getExploreFeed(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const cursor = req.query.cursor as string;
      const result = await postsService.getExploreFeed(req.user?.userId, limit, cursor);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getPostById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const post = await postsService.getPostById(req.params.id, req.user?.userId);
      res.json({ success: true, data: post });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message });
    }
  },

  async createPost(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const post = await postsService.createPost(req.user!.userId, req.body);
      res.status(201).json({ success: true, data: post });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async updatePost(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const post = await postsService.updatePost(req.params.id, req.user!.userId, req.body);
      res.json({ success: true, data: post });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async deletePost(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await postsService.deletePost(req.params.id, req.user!.userId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async likePost(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await postsService.likePost(req.params.id, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async unlikePost(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await postsService.unlikePost(req.params.id, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async getComments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const comments = await commentsService.getCommentsByPostId(req.params.id);
      res.json({ success: true, data: comments });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async createComment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const comment = await commentsService.createComment(req.user!.userId, req.params.id, req.body);
      res.status(201).json({ success: true, data: comment });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },
};
