import { Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { AuthenticatedRequest } from '../types/index.js';
import { moderationService } from '../services/moderation.service.js';

export const reportsController = {
  /**
   * Submit a new community report.
   */
  async createReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const reporterId = req.user!.userId;
      const { reported_type, reported_id, reason, details } = req.body;

      if (!reported_type || !reported_id || !reason) {
        return res.status(400).json({
          success: false,
          message: 'reported_type, reported_id, and reason are required.',
        });
      }

      const type = reported_type.toUpperCase();

      // Prevent duplicate reports by the same user on the same target
      const existingReport = await prisma.report.findFirst({
        where: {
          reporter_id: reporterId,
          reported_type: type,
          reported_id: reported_id,
          status: { not: 'DISMISSED' },
        },
      });

      if (existingReport) {
        return res.status(400).json({
          success: false,
          message: 'You have already submitted an active report for this content.',
        });
      }

      // Resolve author/reported_user_id
      let reportedUserId: string | null = null;
      if (type === 'POST') {
        const post = await prisma.post.findUnique({ where: { id: reported_id }, select: { user_id: true } });
        reportedUserId = post?.user_id || null;
      } else if (type === 'COMMENT') {
        const comment = await prisma.comment.findUnique({ where: { id: reported_id }, select: { user_id: true } });
        reportedUserId = comment?.user_id || null;
      } else if (type === 'STORY') {
        const story = await prisma.story.findUnique({ where: { id: reported_id }, select: { user_id: true } });
        reportedUserId = story?.user_id || null;
      } else if (type === 'MESSAGE') {
        const msg = await prisma.message.findUnique({ where: { id: reported_id }, select: { sender_id: true } });
        reportedUserId = msg?.sender_id || null;
      } else if (type === 'USER') {
        reportedUserId = reported_id;
      }

      // Disallow self-reporting
      if (reportedUserId && reportedUserId === reporterId) {
        return res.status(400).json({
          success: false,
          message: 'You cannot report your own content or account.',
        });
      }

      // Create Report
      const report = await prisma.report.create({
        data: {
          reporter_id: reporterId,
          reported_type: type,
          reported_id: reported_id,
          reported_user_id: reportedUserId,
          reason: reason.toUpperCase(),
          details: details || '',
          status: 'PENDING',
        },
        include: {
          reporter: {
            select: { id: true, username: true, display_name: true, avatar_url: true },
          },
          reported_user: {
            select: { id: true, username: true, display_name: true, avatar_url: true },
          },
        },
      });

      // Trigger Auto-Hide Engine evaluation
      const { autoHidden, totalReports } = await moderationService.handleNewReport({
        reported_type: type,
        reported_id,
        reporter_id: reporterId,
      });

      res.status(201).json({
        success: true,
        message: autoHidden
          ? 'Report submitted. The content has been automatically hidden due to multiple community reports.'
          : 'Report submitted successfully for moderator review.',
        data: {
          ...report,
          autoHidden,
          totalReports,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * Get list of reports with content preview (Admin & Moderator only).
   */
  async getReports(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const status = (req.query.status as string)?.toUpperCase();
      const reportedType = (req.query.reported_type as string)?.toUpperCase();

      const where: any = {};
      if (status && status !== 'ALL') {
        where.status = status;
      }
      if (reportedType && reportedType !== 'ALL') {
        where.reported_type = reportedType;
      }

      const total = await prisma.report.count({ where });

      const reports = await prisma.report.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          reporter: {
            select: { id: true, username: true, display_name: true, avatar_url: true },
          },
          reported_user: {
            select: { id: true, username: true, display_name: true, avatar_url: true, is_banned: true, strike_count: true },
          },
          resolver: {
            select: { id: true, username: true, display_name: true },
          },
        },
      });

      // Hydrate with content preview
      const hydratedReports = await Promise.all(
        reports.map(async (rep) => {
          let contentPreview: any = null;
          let contentStatus = 'UNKNOWN';

          try {
            if (rep.reported_type === 'POST') {
              const post = await prisma.post.findUnique({
                where: { id: rep.reported_id },
                select: { id: true, content_text: true, media_url: true, media_type: true, status: true, report_count: true },
              });
              if (post) {
                contentPreview = {
                  text: post.content_text,
                  media_url: post.media_url,
                  media_type: post.media_type,
                };
                contentStatus = post.status;
              } else {
                contentStatus = 'DELETED';
              }
            } else if (rep.reported_type === 'COMMENT') {
              const comment = await prisma.comment.findUnique({
                where: { id: rep.reported_id },
                select: { id: true, content: true, status: true, report_count: true },
              });
              if (comment) {
                contentPreview = { text: comment.content };
                contentStatus = comment.status;
              } else {
                contentStatus = 'DELETED';
              }
            } else if (rep.reported_type === 'STORY') {
              const story = await prisma.story.findUnique({
                where: { id: rep.reported_id },
                select: { id: true, caption: true, media_url: true, media_type: true, status: true, report_count: true },
              });
              if (story) {
                contentPreview = {
                  text: story.caption,
                  media_url: story.media_url,
                  media_type: story.media_type,
                };
                contentStatus = story.status;
              } else {
                contentStatus = 'DELETED';
              }
            } else if (rep.reported_type === 'MESSAGE') {
              const message = await prisma.message.findUnique({
                where: { id: rep.reported_id },
                select: { id: true, content: true, media_url: true, media_type: true },
              });
              if (message) {
                contentPreview = {
                  text: message.content,
                  media_url: message.media_url,
                  media_type: message.media_type,
                };
                contentStatus = 'ACTIVE';
              } else {
                contentStatus = 'DELETED';
              }
            } else if (rep.reported_type === 'USER') {
              if (rep.reported_user) {
                contentPreview = {
                  text: `@${rep.reported_user.username} - ${rep.reported_user.display_name}`,
                };
                contentStatus = rep.reported_user.is_banned ? 'BANNED' : 'ACTIVE';
              }
            }
          } catch {
            contentStatus = 'ERROR';
          }

          return {
            ...rep,
            contentPreview,
            contentStatus,
          };
        })
      );

      res.json({
        success: true,
        data: hydratedReports,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * Update report status (RESOLVED or DISMISSED).
   */
  async updateReportStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, action_taken } = req.body;
      const adminId = req.user!.userId;

      if (!status || !['RESOLVED', 'DISMISSED'].includes(status.toUpperCase())) {
        return res.status(400).json({
          success: false,
          message: 'Status must be RESOLVED or DISMISSED.',
        });
      }

      const report = await prisma.report.findUnique({ where: { id } });
      if (!report) {
        return res.status(404).json({ success: false, message: 'Report not found.' });
      }

      const updated = await prisma.report.update({
        where: { id },
        data: {
          status: status.toUpperCase(),
          resolved_by: adminId,
        },
        include: {
          resolver: {
            select: { id: true, username: true, display_name: true },
          },
        },
      });

      // Audit Log
      await prisma.moderationLog.create({
        data: {
          admin_id: adminId,
          action: status.toUpperCase() === 'RESOLVED' ? 'RESOLVE_REPORT' : 'DISMISS_REPORT',
          target_type: 'REPORT',
          target_id: id,
          reason: action_taken || `Marked report as ${status.toUpperCase()}`,
        },
      });

      res.json({
        success: true,
        message: `Report marked as ${status.toUpperCase()}.`,
        data: updated,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};
