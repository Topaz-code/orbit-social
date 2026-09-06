import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Response, NextFunction } from 'express';
import { verifyAccessToken, JWT_SECRET } from '../config/auth.js';
import { AuthenticatedRequest } from '../types/index.js';
import { prisma } from '../config/database.js';

export async function authenticateTokenOrDeclineToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  // 1. Signed decline token query param or body
  const targetCallId = req.params.id || req.body?.callId || (req.query.callId as string);
  const declineToken = (req.query.token || req.body?.token || req.headers['x-orbit-decline-token']) as string;
  if (declineToken) {
    try {
      const decoded = jwt.verify(declineToken, JWT_SECRET) as any;
      if (
        decoded &&
        (decoded.callId === targetCallId || decoded.callId === req.params.id) &&
        decoded.purpose === 'decline_call'
      ) {
        req.user = { userId: decoded.userId, role: 'USER' } as any;
        return next();
      }
    } catch {
      // Fall through
    }
  }

  // 2. Cookieless HMAC decline proof support (from deviceIdentity)
  const deviceHash = (req.headers['x-orbit-device-hash'] || req.query.deviceHash || req.body?.deviceHash) as string;
  const proof = (req.headers['x-orbit-decline-proof'] || req.query.proof || req.body?.proof) as string;
  const ts = (req.headers['x-orbit-decline-ts'] || req.query.ts || req.body?.ts) as string;

  if (deviceHash && proof && ts && targetCallId && Math.abs(Date.now() - Number(ts)) < 15 * 60 * 1000) {
    try {
      const key = crypto.createHash('sha256').update(deviceHash).digest();
      const expected = crypto.createHmac('sha256', key).update(`${targetCallId}:${ts}`).digest('hex');
      const expectedBuf = Buffer.from(expected, 'utf8');
      const proofBuf = Buffer.from(proof, 'utf8');
      if (expectedBuf.length === proofBuf.length && crypto.timingSafeEqual(expectedBuf, proofBuf)) {
        const call = await prisma.call.findUnique({ where: { id: targetCallId } });
        if (call) {
          req.user = { userId: call.receiver_id, role: 'USER' } as any;
          return next();
        }
      }
    } catch {
      // Fall through
    }
  }

  // 3. Fallback to standard Bearer token authentication
  return authenticateToken(req, res, next);
}

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
 * Ensures user has strictly verified ADMIN or MODERATOR role in the database.
 */
export async function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  if (!req.user || !req.user.userId) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { role: true, is_banned: true },
    });

    if (!dbUser || dbUser.is_banned) {
      res.status(403).json({ success: false, message: 'Forbidden: Account unauthorized or suspended' });
      return;
    }

    const role = (dbUser.role || '').toUpperCase();
    if (role !== 'ADMIN' && role !== 'MODERATOR') {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Access restricted to administrators and moderators',
      });
      return;
    }

    req.user.role = role;
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Authorization check failed' });
  }
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

