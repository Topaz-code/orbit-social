import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  const requestId = (req as any).requestId || 'unknown';
  console.error(`[Error Handler] [${requestId}] ${req.method} ${req.originalUrl}:`, err);

  const statusCode = err.status || err.statusCode || 500;
  
  // Sanitize internal server errors — never leak raw SQL, Prisma internals, or stack traces
  let clientMessage = err.message || 'Internal Server Error';
  if (statusCode >= 500 && process.env.NODE_ENV === 'production') {
    clientMessage = 'An unexpected internal error occurred. Please try again later.';
  } else if (typeof clientMessage === 'string' && (clientMessage.includes('prisma') || clientMessage.includes('SQL') || clientMessage.includes('database'))) {
    clientMessage = 'A database error occurred. Please try again later.';
  }

  res.status(statusCode).json({
    success: false,
    message: clientMessage,
    requestId,
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} not found`,
    requestId: (req as any).requestId,
  });
}

