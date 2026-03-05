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
    logger.error({ sessionId }, 'SSE stream: session not found');
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  if (session.userId !== req.userId) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  // Set SSE headers - prevent any proxy from buffering/compressing
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Content-Encoding', 'none');
  res.status(200);
  res.flushHeaders();

  // Send padding comment (~2KB) to force proxy buffers to flush.
  // Many reverse proxies (Cloudflare, Nginx, etc.) buffer the first
  // chunk of a response. Sending enough data forces them to deliver
  // the headers + initial data to the client immediately.
  const padding = ':' + ' '.repeat(2048) + '\n\n';
  res.write(padding);

  // Send initial connected event
  res.write(`event: connected\ndata: ${JSON.stringify({ sessionId })}\n\n`);

  // Register this response as an SSE client
  sshService.addSSEClient(sessionId, res);
  logger.info({ sessionId }, 'SSE client connected');
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
