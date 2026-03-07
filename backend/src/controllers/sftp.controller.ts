import { Response } from 'express';
import { z } from 'zod';
import path from 'path';
import { Readable } from 'stream';
import { AuthRequest } from '../middleware/auth.middleware';
import { dbGet } from '../services/db.service';
import * as sftpService from '../services/sftp.service';
import { Connection } from '../types';
import { logger } from '../services/logger.service';

const createSessionSchema = z.object({
  connectionId: z.string().uuid(),
});

const pathSchema = z.object({
  path: z.string().min(1),
});

const renameSchema = z.object({
  oldPath: z.string().min(1),
  newPath: z.string().min(1),
});

const writeContentSchema = z.object({
  path: z.string().min(1),
  content: z.string().max(1048576),
});

const MAX_EDIT_SIZE = 1 * 1024 * 1024; // 1MB

function validateSessionAccess(req: AuthRequest, res: Response): string | null {
  const sessionId = req.params.sessionId as string;
  const session = sftpService.getSftpSession(sessionId);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return null;
  }
  if (session.userId !== req.userId) {
    res.status(403).json({ error: 'Access denied' });
    return null;
  }
  return sessionId;
}

export async function createSession(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { connectionId } = createSessionSchema.parse(req.body);

    const data = await dbGet(`connection:${req.userId!}:${connectionId}`);
    if (!data) {
      res.status(404).json({ error: 'Connection not found' });
      return;
    }

    const connection: Connection = JSON.parse(data);
    const sessionId = await sftpService.createSftpSession(req.userId!, connection);
    res.status(201).json({ sessionId });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    logger.error({ err }, 'Create SFTP session error');
    res.status(500).json({ error: err.message || 'Failed to create SFTP session' });
  }
}

export async function listDirectory(req: AuthRequest, res: Response): Promise<void> {
  try {
    const sessionId = validateSessionAccess(req, res);
    if (!sessionId) return;

    const dirPath = (req.query.path as string) || '/';
    const entries = await sftpService.listDirectory(sessionId, dirPath);
    res.json(entries);
  } catch (err) {
    logger.error({ err }, 'List directory error');
    res.status(500).json({ error: 'Failed to list directory' });
  }
}

export async function downloadFile(req: AuthRequest, res: Response): Promise<void> {
  try {
    const sessionId = validateSessionAccess(req, res);
    if (!sessionId) return;

    const filePath = req.query.path as string;
    if (!filePath) {
      res.status(400).json({ error: 'Path is required' });
      return;
    }

    const fileName = path.basename(filePath);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    const readStream = sftpService.createReadStream(sessionId, filePath);
    readStream.pipe(res);

    readStream.on('error', (err: Error) => {
      logger.error({ err }, 'Download file error');
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to download file' });
      }
    });
  } catch (err) {
    logger.error({ err }, 'Download file error');
    res.status(500).json({ error: 'Failed to download file' });
  }
}

export async function uploadFile(req: AuthRequest, res: Response): Promise<void> {
  try {
    const sessionId = validateSessionAccess(req, res);
    if (!sessionId) return;

    const targetPath = req.body.path as string;
    const file = req.file;

    if (!file || !targetPath) {
      res.status(400).json({ error: 'File and path are required' });
      return;
    }

    const remotePath = targetPath.endsWith('/')
      ? `${targetPath}${file.originalname}`
      : targetPath;

    const writeStream = sftpService.createWriteStream(sessionId, remotePath);
    const readStream = Readable.from(file.buffer);

    readStream.pipe(writeStream);

    writeStream.on('close', () => {
      res.json({ success: true, path: remotePath });
    });

    writeStream.on('error', (err: Error) => {
      logger.error({ err }, 'Upload file error');
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to upload file' });
      }
    });
  } catch (err) {
    logger.error({ err }, 'Upload file error');
    res.status(500).json({ error: 'Failed to upload file' });
  }
}

export async function deleteFile(req: AuthRequest, res: Response): Promise<void> {
  try {
    const sessionId = validateSessionAccess(req, res);
    if (!sessionId) return;

    const { path: filePath } = pathSchema.parse(req.body);

    // Try stat to check if it's a directory
    const info = await sftpService.stat(sessionId, filePath);
    if (info.type === 'directory') {
      await sftpService.deleteDirectory(sessionId, filePath);
    } else {
      await sftpService.deleteFile(sessionId, filePath);
    }

    res.json({ success: true });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    logger.error({ err }, 'Delete file error');
    res.status(500).json({ error: 'Failed to delete file' });
  }
}

export async function makeDirectory(req: AuthRequest, res: Response): Promise<void> {
  try {
    const sessionId = validateSessionAccess(req, res);
    if (!sessionId) return;

    const { path: dirPath } = pathSchema.parse(req.body);
    await sftpService.makeDirectory(sessionId, dirPath);
    res.json({ success: true });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    logger.error({ err }, 'Make directory error');
    res.status(500).json({ error: 'Failed to create directory' });
  }
}

export async function renameFile(req: AuthRequest, res: Response): Promise<void> {
  try {
    const sessionId = validateSessionAccess(req, res);
    if (!sessionId) return;

    const { oldPath, newPath } = renameSchema.parse(req.body);
    await sftpService.rename(sessionId, oldPath, newPath);
    res.json({ success: true });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    logger.error({ err }, 'Rename file error');
    res.status(500).json({ error: 'Failed to rename' });
  }
}

export async function statFile(req: AuthRequest, res: Response): Promise<void> {
  try {
    const sessionId = validateSessionAccess(req, res);
    if (!sessionId) return;

    const filePath = req.query.path as string;
    if (!filePath) {
      res.status(400).json({ error: 'Path is required' });
      return;
    }

    const info = await sftpService.stat(sessionId, filePath);
    res.json(info);
  } catch (err) {
    logger.error({ err }, 'Stat file error');
    res.status(500).json({ error: 'Failed to get file info' });
  }
}

export async function readFileContent(req: AuthRequest, res: Response): Promise<void> {
  try {
    const sessionId = validateSessionAccess(req, res);
    if (!sessionId) return;

    const filePath = req.query.path as string;
    if (!filePath) {
      res.status(400).json({ error: 'Path is required' });
      return;
    }

    // Check file size first
    const info = await sftpService.stat(sessionId, filePath);
    if (info.type === 'directory') {
      res.status(400).json({ error: 'Cannot edit a directory' });
      return;
    }
    if (info.size > MAX_EDIT_SIZE) {
      res.status(413).json({
        error: 'File too large for editing',
        size: info.size,
        limit: MAX_EDIT_SIZE,
      });
      return;
    }

    const content = await sftpService.readFileContent(sessionId, filePath);
    res.json({ content, path: filePath, size: info.size });
  } catch (err: any) {
    logger.error({ err }, 'Read file content error');
    const message = err.message || 'Failed to read file content';
    if (message === 'Binary file cannot be edited') {
      res.status(422).json({ error: message });
      return;
    }
    res.status(500).json({ error: message });
  }
}

export async function writeFileContent(req: AuthRequest, res: Response): Promise<void> {
  try {
    const sessionId = validateSessionAccess(req, res);
    if (!sessionId) return;

    const { path: filePath, content } = writeContentSchema.parse(req.body);
    await sftpService.writeFileContent(sessionId, filePath, content);
    const size = Buffer.byteLength(content, 'utf-8');
    res.json({ success: true, path: filePath, size });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    logger.error({ err }, 'Write file content error');
    res.status(500).json({ error: err.message || 'Failed to write file content' });
  }
}

export function closeSession(req: AuthRequest, res: Response): void {
  const sessionId = validateSessionAccess(req, res);
  if (!sessionId) return;

  sftpService.closeSftpSession(sessionId);
  res.json({ success: true });
}
