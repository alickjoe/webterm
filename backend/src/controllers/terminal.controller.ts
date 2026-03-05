import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';
import { dbGet } from '../services/db.service';
import * as sshService from '../services/ssh.service';
import { Connection } from '../types';
import { logger } from '../services/logger.service';

const createSessionSchema = z.object({
  connectionId: z.string().uuid(),
});

const inputSchema = z.object({
  data: z.string(), // Base64 encoded input
});

const resizeSchema = z.object({
  cols: z.number().int().min(1).max(500),
  rows: z.number().int().min(1).max(200),
});

export async function createSession(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { connectionId } = createSessionSchema.parse(req.body);

    const data = await dbGet(`connection:${req.userId!}:${connectionId}`);
    if (!data) {
      res.status(404).json({ error: 'Connection not found' });
      return;
    }

    const connection: Connection = JSON.parse(data);
    const sessionId = await sshService.createSession(req.userId!, connection);
    res.status(201).json({ sessionId });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    logger.error({ err }, 'Create terminal session error');
    res.status(500).json({ error: err.message || 'Failed to create session' });
  }
}

export function streamOutput(req: AuthRequest, res: Response): void {
  const sessionId = req.params.sessionId as string;
  const session = sshService.getSession(sessionId);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  if (session.userId !== req.userId) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  // Send initial connected event
  res.write(`event: connected\ndata: ${JSON.stringify({ sessionId })}\n\n`);

  // Register this response as an SSE client
  sshService.addSSEClient(sessionId, res);
}

export function sendInput(req: AuthRequest, res: Response): void {
  try {
    const { data } = inputSchema.parse(req.body);
    const sessionId = req.params.sessionId as string;
    const session = sshService.getSession(sessionId);

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }
    if (session.userId !== req.userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    sshService.sendInput(sessionId, data);
    res.json({ success: true });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    logger.error({ err }, 'Send input error');
    res.status(500).json({ error: 'Failed to send input' });
  }
}

export function resizeTerminal(req: AuthRequest, res: Response): void {
  try {
    const { cols, rows } = resizeSchema.parse(req.body);
    const sessionId = req.params.sessionId as string;
    const session = sshService.getSession(sessionId);

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }
    if (session.userId !== req.userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    sshService.resizeTerminal(sessionId, cols, rows);
    res.json({ success: true });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    logger.error({ err }, 'Resize terminal error');
    res.status(500).json({ error: 'Failed to resize terminal' });
  }
}

export function closeSession(req: AuthRequest, res: Response): void {
  const sessionId = req.params.sessionId as string;
  const session = sshService.getSession(sessionId);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }
  if (session.userId !== req.userId) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  sshService.closeSession(sessionId);
  res.json({ success: true });
}

export function listSessions(req: AuthRequest, res: Response): void {
  const sessions = sshService.listUserSessions(req.userId!);
  res.json(sessions);
}
