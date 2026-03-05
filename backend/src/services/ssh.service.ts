import { v4 as uuidv4 } from 'uuid';
import { Client } from 'ssh2';
import { Response } from 'express';
import { TerminalSession, Connection } from '../types';
import { decrypt } from './crypto.service';
import { logger } from './logger.service';
import config from '../config';

// In-memory session store
const sessions = new Map<string, TerminalSession>();

// Session cleanup interval
setInterval(() => {
  const now = Date.now();
  const timeout = config.sessionTimeoutMinutes * 60 * 1000;

  for (const [id, session] of sessions) {
    if (now - session.lastActivityAt.getTime() > timeout) {
      logger.info({ sessionId: id }, 'Session timed out, closing');
      closeSession(id);
    }
  }
}, 60 * 1000);

export function getUserSessionCount(userId: string): number {
  let count = 0;
  for (const session of sessions.values()) {
    if (session.userId === userId) count++;
  }
  return count;
}

export async function createSession(
  userId: string,
  connection: Connection
): Promise<string> {
  if (getUserSessionCount(userId) >= config.maxSessionsPerUser) {
    throw new Error(`Maximum sessions (${config.maxSessionsPerUser}) reached`);
  }

  const sessionId = uuidv4();

  // Decrypt credentials
  let password: string | undefined;
  let privateKey: string | undefined;

  if (connection.authType === 'password' && connection.encryptedPassword) {
    password = decrypt(connection.encryptedPassword, connection.userId);
  } else if (connection.authType === 'privateKey' && connection.encryptedPrivateKey) {
    privateKey = decrypt(connection.encryptedPrivateKey, connection.userId);
  }

  return new Promise((resolve, reject) => {
    const client = new Client();

    client.on('ready', () => {
      client.shell({ term: 'xterm-256color', cols: 80, rows: 24 }, (err, stream) => {
        if (err) {
          client.end();
          return reject(err);
        }

        const session: TerminalSession = {
          id: sessionId,
          userId,
          connectionId: connection.id,
          sshClient: client,
          stream,
          sseClients: new Set(),
          createdAt: new Date(),
          lastActivityAt: new Date(),
          cols: 80,
          rows: 24,
        };

        // Relay SSH output to all SSE clients
        stream.on('data', (data: Buffer) => {
          session.lastActivityAt = new Date();
          const base64Data = data.toString('base64');
          for (const res of session.sseClients) {
            try {
              res.write(`event: output\ndata: ${JSON.stringify({ output: base64Data })}\n\n`);
            } catch (e) {
              logger.error({ sessionId, err: e }, 'Error writing to SSE client');
              session.sseClients.delete(res);
            }
          }
        });

        stream.on('close', () => {
          logger.info({ sessionId }, 'SSH stream closed');
          // Only cleanup if session still exists (avoid double-cleanup)
          if (!sessions.has(sessionId)) return;
          for (const res of session.sseClients) {
            try {
              res.write(`event: close\ndata: ${JSON.stringify({ reason: 'stream_closed' })}\n\n`);
              res.end();
            } catch {}
          }
          sessions.delete(sessionId);
          client.end();
        });

        stream.stderr.on('data', (data: Buffer) => {
          const base64Data = data.toString('base64');
          for (const res of session.sseClients) {
            try {
              res.write(`event: output\ndata: ${JSON.stringify({ output: base64Data })}\n\n`);
            } catch {}
          }
        });

        sessions.set(sessionId, session);
        logger.info({ sessionId, host: connection.host }, 'SSH session created');
        resolve(sessionId);
      });
    });

    client.on('error', (err) => {
      logger.error({ err, sessionId }, 'SSH client error');
      const session = sessions.get(sessionId);
      if (session) {
        for (const res of session.sseClients) {
          try {
            res.write(
              `event: error\ndata: ${JSON.stringify({ code: 'SSH_ERROR', message: err.message })}\n\n`
            );
            res.end();
          } catch {}
        }
        sessions.delete(sessionId);
      }
      // Only reject if promise hasn't resolved yet
      reject(err);
    });

    client.on('close', () => {
      logger.info({ sessionId }, 'SSH client connection closed');
      const session = sessions.get(sessionId);
      if (session) {
        for (const res of session.sseClients) {
          try {
            res.write(`event: close\ndata: ${JSON.stringify({ reason: 'ssh_disconnected' })}\n\n`);
            res.end();
          } catch {}
        }
        sessions.delete(sessionId);
      }
    });

    const connectConfig: any = {
      host: connection.host,
      port: connection.port,
      username: connection.username,
      readyTimeout: 10000,
    };

    if (password) {
      connectConfig.password = password;
    } else if (privateKey) {
      connectConfig.privateKey = privateKey;
    }

    client.connect(connectConfig);
  });
}

export function getSession(sessionId: string): TerminalSession | undefined {
  return sessions.get(sessionId);
}

export function addSSEClient(sessionId: string, res: Response): void {
  const session = sessions.get(sessionId);
  if (!session) throw new Error('Session not found');

  session.sseClients.add(res);
  session.lastActivityAt = new Date();

  // Start heartbeat for this SSE connection
  const heartbeat = setInterval(() => {
    if (session.sseClients.has(res)) {
      res.write(`event: ping\ndata: {}\n\n`);
    } else {
      clearInterval(heartbeat);
    }
  }, 15000);

  // Cleanup on client disconnect
  res.on('close', () => {
    session.sseClients.delete(res);
    clearInterval(heartbeat);
    logger.debug({ sessionId }, 'SSE client disconnected');
  });
}

export function sendInput(sessionId: string, data: string): void {
  const session = sessions.get(sessionId);
  if (!session) throw new Error('Session not found');

  session.lastActivityAt = new Date();
  session.stream.write(Buffer.from(data, 'base64'));
}

export function resizeTerminal(sessionId: string, cols: number, rows: number): void {
  const session = sessions.get(sessionId);
  if (!session) throw new Error('Session not found');

  session.cols = cols;
  session.rows = rows;
  session.stream.setWindow(rows, cols, 0, 0);
  logger.debug({ sessionId, cols, rows }, 'Terminal resized');
}

export function closeSession(sessionId: string): void {
  const session = sessions.get(sessionId);
  if (!session) return;

  for (const res of session.sseClients) {
    res.write(`event: close\ndata: ${JSON.stringify({ reason: 'session_closed' })}\n\n`);
    res.end();
  }

  session.stream.close();
  session.sshClient.end();
  sessions.delete(sessionId);
  logger.info({ sessionId }, 'Session closed');
}

export function listUserSessions(userId: string): Array<{
  id: string;
  connectionId: string;
  createdAt: Date;
  lastActivityAt: Date;
}> {
  const result = [];
  for (const session of sessions.values()) {
    if (session.userId === userId) {
      result.push({
        id: session.id,
        connectionId: session.connectionId,
        createdAt: session.createdAt,
        lastActivityAt: session.lastActivityAt,
      });
    }
  }
  return result;
}
