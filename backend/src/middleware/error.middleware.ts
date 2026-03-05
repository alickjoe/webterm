import { Request, Response, NextFunction } from 'express';
import { logger } from '../services/logger.service';

export function errorMiddleware(err: Error, req: Request, res: Response, _next: NextFunction): void {
  logger.error({ err, path: req.path, method: req.method }, 'Unhandled error');
  res.status(500).json({ error: 'Internal server error' });
}
