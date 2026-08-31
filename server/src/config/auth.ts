import jwt from 'jsonwebtoken';
import { TokenPayload } from '../types/index.js';

const ORBIT_ISSUER = 'orbit-api';
const ORBIT_AUDIENCE = 'orbit-client';

// ── Production secret guard ────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const secret = process.env.JWT_SECRET || '';
  if (!secret || secret === 'orbit_super_secret_jwt_key_development_2026') {
    throw new Error('FATAL: JWT_SECRET must be set to a strong secret in production (≥32 chars).');
  }
  if (secret.length < 32) {
    throw new Error('FATAL: JWT_SECRET is too short — must be at least 32 characters.');
  }
}

export const JWT_SECRET = process.env.JWT_SECRET || 'orbit_super_secret_jwt_key_development_2026';
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET
  ? process.env.JWT_REFRESH_SECRET
  : process.env.JWT_SECRET
    ? `${process.env.JWT_SECRET}_refresh`
    : 'orbit_super_secret_refresh_jwt_key_2026';

// Short-lived access token (2h in prod, 7d in dev for convenience), 14d refresh
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || (process.env.NODE_ENV === 'production' ? '2h' : '7d');
export const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '14d';

export function generateAccessToken(payload: TokenPayload, rememberMe = true): string {
  return jwt.sign(payload, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: rememberMe ? (JWT_EXPIRES_IN as any) : '1h',
    issuer: ORBIT_ISSUER,
    audience: ORBIT_AUDIENCE,
  });
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    algorithm: 'HS256',
    expiresIn: JWT_REFRESH_EXPIRES_IN as any,
    issuer: ORBIT_ISSUER,
    audience: ORBIT_AUDIENCE,
  });
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: ORBIT_ISSUER,
      audience: ORBIT_AUDIENCE,
    }) as TokenPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET, {
      algorithms: ['HS256'],
      issuer: ORBIT_ISSUER,
      audience: ORBIT_AUDIENCE,
    }) as TokenPayload;
  } catch {
    return null;
  }
}
