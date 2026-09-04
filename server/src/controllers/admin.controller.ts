import { Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { AuthenticatedRequest } from '../types/index.js';

export const adminController = {
  /**
   * KPI Metrics for Admin Dashboard Overview
   */
  async getMetrics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const [pendingReportsCount, hiddenPostsCount, bannedUsersCount, actionsTodayCount, recentLogs] =
        await Promise.all([
          prisma.report.count({
            where: { status: 'PENDING' },
          }),
          prisma.post.count({
            where: { status: 'HIDDEN' },
          }),
          prisma.user.count({
            where: {
              OR: [{ is_banned: true }, { banned_until: { gt: now } }],
            },
          }),
          prisma.moderationLog.count({
            where: {
              created_at: { gte: startOfToday },
            },
          }),
          prisma.moderationLog.findMany({
            take: 6,
            orderBy: { created_at: 'desc' },
            include: {
              admin: {
                select: { id: true, username: true, display_name: true, avatar_url: true },
              },
            },
          }),
        ]);

      res.json({
        success: true,
        data: {
          pendingReportsCount,
          hiddenPostsCount,
          bannedUsersCount,
          actionsTodayCount,
          recentLogs,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * Searchable and filterable user management list
   */
  async getUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const search = (req.query.search as string)?.trim().toLowerCase();
      const role = (req.query.role as string)?.toUpperCase();
      const status = (req.query.status as string)?.toUpperCase();

      const now = new Date();
      const where: any = {};

      if (search) {
        where.OR = [
          { username: { contains: search } },
          { email: { contains: search } },
          { display_name: { contains: search } },
        ];
      }

      if (role && role !== 'ALL') {
        where.role = role;
      }

      if (status === 'BANNED') {
        where.is_banned = true;
      } else if (status === 'TIMEOUT') {
        where.is_banned = false;
        where.banned_until = { gt: now };
      } else if (status === 'ACTIVE') {
        where.is_banned = false;
        where.OR = [{ banned_until: null }, { banned_until: { lte: now } }];
      }

      const total = await prisma.user.count({ where });

      const users = await prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          username: true,
          email: true,
          display_name: true,
          avatar_url: true,
          role: true,
          is_banned: true,
          banned_until: true,
          ban_reason: true,
          strike_count: true,
          created_at: true,
          last_seen: true,
          _count: {
            select: {
              posts: true,
              reports_against: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: users,
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
   * Ban, Timeout, or Unban a user
   */
  async moderateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { action, duration_hours, reason } = req.body;
      const adminId = req.user!.userId;

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      // Prevent banning other admins unless you are an admin
      if (user.role === 'ADMIN' && req.user!.role !== 'ADMIN') {
        return res.status(403).json({ success: false, message: 'Only Admins can moderate other Admins.' });
      }

      let updateData: any = {};
      let logAction = 'BAN_USER';

      if (action === 'ban') {
        updateData = {
          is_banned: true,
          ban_reason: reason || 'Violation of Community Guidelines',
          strike_count: { increment: 1 },
        };
        logAction = 'BAN_USER';
      } else if (action === 'timeout') {
        const hours = parseInt(duration_hours) || 24;
        const bannedUntil = new Date(Date.now() + hours * 60 * 60 * 1000);
        updateData = {
          is_banned: false,
          banned_until: bannedUntil,
          ban_reason: reason || `Temporary timeout for ${hours} hours`,
          strike_count: { increment: 1 },
        };
        logAction = 'TIMEOUT_USER';
      } else if (action === 'unban') {
        updateData = {
          is_banned: false,
          banned_until: null,
          ban_reason: '',
        };
        logAction = 'UNBAN_USER';
      } else {
        return res.status(400).json({ success: false, message: 'Invalid action. Must be ban, timeout, or unban.' });
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          username: true,
          role: true,
          is_banned: true,
          banned_until: true,
          ban_reason: true,
          strike_count: true,
        },
      });

      // Audit Log
      await prisma.moderationLog.create({
        data: {
          admin_id: adminId,
          action: logAction,
          target_type: 'USER',
          target_id: id,
          reason: reason || action,
        },
      });

      res.json({
        success: true,
        message: `User ${action} action completed successfully.`,
        data: updatedUser,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * Change user role (USER <-> MODERATOR <-> ADMIN)
   */
  async updateUserRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const adminId = req.user!.userId;

      const upperRole = role?.toUpperCase();
      if (!['USER', 'MODERATOR', 'ADMIN'].includes(upperRole)) {
        return res.status(400).json({ success: false, message: 'Role must be USER, MODERATOR, or ADMIN.' });
      }

      // Only ADMIN can change roles
      if (req.user!.role !== 'ADMIN') {
        return res.status(403).json({ success: false, message: 'Only Admins can change user roles.' });
      }

      // Prevent self-demotion from ADMIN
      if (id === adminId && upperRole !== 'ADMIN') {
        return res.status(400).json({ success: false, message: 'Cannot demote your own Admin account.' });
      }

      const updated = await prisma.user.update({
        where: { id },
        data: { role: upperRole },
        select: { id: true, username: true, role: true },
      });

      // Audit Log
      await prisma.moderationLog.create({
        data: {
          admin_id: adminId,
          action: 'UPDATE_ROLE',
          target_type: 'USER',
          target_id: id,
          reason: `Role changed to ${upperRole}`,
        },
      });

      res.json({
        success: true,
        message: `User role updated to ${upperRole}.`,
        data: updated,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * Moderate content (Delete/Remove, Hide, Unhide, or Dismiss reports)
   */
  async moderateContent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { type, id } = req.params;
      const { action, reason } = req.body;
      const adminId = req.user!.userId;

      const upperType = type.toUpperCase();
      const upperAction = action.toUpperCase();

      if (!['DISMISS', 'HIDE', 'UNHIDE', 'REMOVE'].includes(upperAction)) {
        return res.status(400).json({
          success: false,
          message: 'Action must be DISMISS, HIDE, UNHIDE, or REMOVE.',
        });
      }

      let newStatus = 'ACTIVE';
      if (upperAction === 'REMOVE') newStatus = 'REMOVED';
      else if (upperAction === 'HIDE') newStatus = 'HIDDEN';
      else if (upperAction === 'UNHIDE') newStatus = 'ACTIVE';

      // Update content status in the database
      if (upperType === 'POST') {
        await prisma.post.update({
          where: { id },
          data: { status: newStatus },
        });
      } else if (upperType === 'COMMENT') {
        await prisma.comment.update({
          where: { id },
          data: { status: newStatus },
        });
      } else if (upperType === 'STORY') {
        await prisma.story.update({
          where: { id },
          data: { status: newStatus },
        });
      }

      // If action is REMOVE or HIDE, mark all pending reports on this content as RESOLVED
      if (upperAction === 'REMOVE' || upperAction === 'HIDE') {
        await prisma.report.updateMany({
          where: {
            reported_type: upperType,
            reported_id: id,
            status: 'PENDING',
          },
          data: {
            status: 'RESOLVED',
            resolved_by: adminId,
          },
        });
      } else if (upperAction === 'DISMISS') {
        // If dismissing, mark all pending reports on this content as DISMISSED
        await prisma.report.updateMany({
          where: {
            reported_type: upperType,
            reported_id: id,
            status: 'PENDING',
          },
          data: {
            status: 'DISMISSED',
            resolved_by: adminId,
          },
        });
      }

      // Audit Log
      await prisma.moderationLog.create({
        data: {
          admin_id: adminId,
          action: `${upperAction}_CONTENT`,
          target_type: upperType,
          target_id: id,
          reason: reason || `Content status changed to ${newStatus}`,
        },
      });

      res.json({
        success: true,
        message: `Content successfully ${upperAction.toLowerCase()}d.`,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * Chronological Audit Logs
   */
  async getLogs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const action = req.query.action as string;
      const targetType = req.query.target_type as string;

      const where: any = {};
      if (action && action !== 'ALL') {
        where.action = action.toUpperCase();
      }
      if (targetType && targetType !== 'ALL') {
        where.target_type = targetType.toUpperCase();
      }

      const total = await prisma.moderationLog.count({ where });

      const logs = await prisma.moderationLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          admin: {
            select: { id: true, username: true, display_name: true, avatar_url: true, role: true },
          },
        },
      });

      res.json({
        success: true,
        data: logs,
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
};
