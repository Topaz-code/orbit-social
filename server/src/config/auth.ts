import jwt from 'jsonwebtoken';
import { TokenPayload } from '../types/index.js';

if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'orbit_super_secret_jwt_key_development_2026')) {
  throw new Error('FATAL SECURITY ERROR: JWT_SECRET must be explicitly set to a strong secret in production environment variables.');
}

export const JWT_SECRET = process.env.JWT_SECRET || 'orbit_super_secret_jwt_key_development_2026';
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET ? `${process.env.JWT_SECRET}_refresh` : 'orbit_super_secret_refresh_jwt_key_2026');
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
export const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

export function generateAccessToken(payload: TokenPayload, rememberMe = true): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: rememberMe ? (JWT_EXPIRES_IN as any) : '1d',
  });
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN as any,
  });
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}
