import { Request, Response, NextFunction } from 'express';

/**
 * Strip HTML tags and dangerous characters from a string value.
 * Lightweight XSS prevention for stored content (messages, posts, bios etc).
 */
function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, '')          // Remove HTML tags
    .replace(/javascript:/gi, '')      // Remove JS protocol
    .replace(/on\w+\s*=/gi, '')        // Remove inline event handlers
    .replace(/data:/gi, '')            // Remove data: URIs
    .trim();
}

function sanitizeDeep(obj: unknown): unknown {
  if (typeof obj === 'string') return stripHtml(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeDeep);
  if (obj !== null && typeof obj === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      cleaned[key] = sanitizeDeep(val);
    }
    return cleaned;
  }
  return obj;
}

/**
 * Express middleware — sanitize req.body string fields before they reach controllers.
 * Prevents stored XSS via messages, posts, bios etc.
 */
export function sanitizeInput(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeDeep(req.body);
  }
  next();
}
