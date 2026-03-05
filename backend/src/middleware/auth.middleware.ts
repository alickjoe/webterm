import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/auth.service';
import { logger } from '../services/logger.service';

export interface AuthRequest extends Request {
  userId?: string;
  username?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  // Also support token in query params (needed for SSE EventSource)
  const queryToken = req.query.token as string | undefined;

  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : queryToken;

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const payload = verifyToken(token);
    req.userId = payload.sub;
    req.username = payload.username;
    next();
  } catch (err) {
    logger.debug({ err }, 'Invalid token');
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
