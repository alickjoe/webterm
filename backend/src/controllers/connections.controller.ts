import { Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth.middleware';
import { dbGet, dbPut, dbDel, dbGetMany } from '../services/db.service';
import { encrypt, decrypt } from '../services/crypto.service';
import { Connection, ConnectionCreateInput } from '../types';
import { logger } from '../services/logger.service';
import { Client } from 'ssh2';

const connectionSchema = z.object({
  name: z.string().min(1).max(128),
  host: z.string().min(1).max(256),
  port: z.number().int().min(1).max(65535).default(22),
  username: z.string().min(1).max(128),
  authType: z.enum(['password', 'privateKey']),
  password: z.string().optional(),
  privateKey: z.string().optional(),
});

export async function listConnections(req: AuthRequest, res: Response): Promise<void> {
  try {
    const entries = await dbGetMany(`connection:${req.userId!}:`);
    const connections = entries.map((e) => {
      const conn: Connection = JSON.parse(e.value);
      // Don't expose encrypted secrets to client
      const { encryptedPassword, encryptedPrivateKey, ...safe } = conn;
      return { ...safe, hasPassword: !!encryptedPassword, hasPrivateKey: !!encryptedPrivateKey };
    });
    res.json(connections);
  } catch (err) {
    logger.error({ err }, 'List connections error');
    res.status(500).json({ error: 'Failed to list connections' });
  }
}

export async function getConnection(req: AuthRequest, res: Response): Promise<void> {
  try {
    const data = await dbGet(`connection:${req.userId!}:${req.params.id}`);
    if (!data) {
      res.status(404).json({ error: 'Connection not found' });
      return;
    }
    const conn: Connection = JSON.parse(data);
    const { encryptedPassword, encryptedPrivateKey, ...safe } = conn;
    res.json({ ...safe, hasPassword: !!encryptedPassword, hasPrivateKey: !!encryptedPrivateKey });
  } catch (err) {
    logger.error({ err }, 'Get connection error');
    res.status(500).json({ error: 'Failed to get connection' });
  }
}

export async function createConnection(req: AuthRequest, res: Response): Promise<void> {
  try {
    const input = connectionSchema.parse(req.body);
    const id = uuidv4();
    const now = new Date().toISOString();

    const connection: Connection = {
      id,
      userId: req.userId!,
      name: input.name,
      host: input.host,
      port: input.port,
      username: input.username,
      authType: input.authType,
      createdAt: now,
      updatedAt: now,
    };

    if (input.authType === 'password' && input.password) {
      connection.encryptedPassword = encrypt(input.password, req.userId!);
    } else if (input.authType === 'privateKey' && input.privateKey) {
      connection.encryptedPrivateKey = encrypt(input.privateKey, req.userId!);
    }

    await dbPut(`connection:${req.userId!}:${id}`, JSON.stringify(connection));
    logger.info({ connectionId: id }, 'Connection created');

    const { encryptedPassword, encryptedPrivateKey, ...safe } = connection;
    res.status(201).json(safe);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    logger.error({ err }, 'Create connection error');
    res.status(500).json({ error: 'Failed to create connection' });
  }
}

export async function updateConnection(req: AuthRequest, res: Response): Promise<void> {
  try {
    const input = connectionSchema.parse(req.body);
    const key = `connection:${req.userId!}:${req.params.id}`;
    const existing = await dbGet(key);
    if (!existing) {
      res.status(404).json({ error: 'Connection not found' });
      return;
    }

    const old: Connection = JSON.parse(existing);
    const connection: Connection = {
      ...old,
      name: input.name,
      host: input.host,
      port: input.port,
      username: input.username,
      authType: input.authType,
      updatedAt: new Date().toISOString(),
    };

    // Update encrypted credentials
    if (input.authType === 'password') {
      connection.encryptedPrivateKey = undefined;
      if (input.password) {
        connection.encryptedPassword = encrypt(input.password, req.userId!);
      }
    } else if (input.authType === 'privateKey') {
      connection.encryptedPassword = undefined;
      if (input.privateKey) {
        connection.encryptedPrivateKey = encrypt(input.privateKey, req.userId!);
      }
    }

    await dbPut(key, JSON.stringify(connection));
    logger.info({ connectionId: req.params.id }, 'Connection updated');

    const { encryptedPassword, encryptedPrivateKey, ...safe } = connection;
    res.json(safe);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    logger.error({ err }, 'Update connection error');
    res.status(500).json({ error: 'Failed to update connection' });
  }
}

export async function deleteConnection(req: AuthRequest, res: Response): Promise<void> {
  try {
    const key = `connection:${req.userId!}:${req.params.id}`;
    const existing = await dbGet(key);
    if (!existing) {
      res.status(404).json({ error: 'Connection not found' });
      return;
    }

    await dbDel(key);
    logger.info({ connectionId: req.params.id }, 'Connection deleted');
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, 'Delete connection error');
    res.status(500).json({ error: 'Failed to delete connection' });
  }
}

export async function testConnection(req: AuthRequest, res: Response): Promise<void> {
  try {
    const data = await dbGet(`connection:${req.userId!}:${req.params.id}`);
    if (!data) {
      res.status(404).json({ error: 'Connection not found' });
      return;
    }

    const connection: Connection = JSON.parse(data);

    let password: string | undefined;
    let privateKey: string | undefined;

    if (connection.authType === 'password' && connection.encryptedPassword) {
      password = decrypt(connection.encryptedPassword, connection.userId);
    } else if (connection.authType === 'privateKey' && connection.encryptedPrivateKey) {
      privateKey = decrypt(connection.encryptedPrivateKey, connection.userId);
    }

    const result = await new Promise<{ success: boolean; message: string }>((resolve) => {
      const client = new Client();
      const timeout = setTimeout(() => {
        client.end();
        resolve({ success: false, message: 'Connection timeout' });
      }, 10000);

      client.on('ready', () => {
        clearTimeout(timeout);
        client.end();
        resolve({ success: true, message: 'Connection successful' });
      });

      client.on('error', (err) => {
        clearTimeout(timeout);
        resolve({ success: false, message: err.message });
      });

      const connectConfig: any = {
        host: connection.host,
        port: connection.port,
        username: connection.username,
        readyTimeout: 10000,
      };

      if (password) connectConfig.password = password;
      else if (privateKey) connectConfig.privateKey = privateKey;

      client.connect(connectConfig);
    });

    res.json(result);
  } catch (err) {
    logger.error({ err }, 'Test connection error');
    res.status(500).json({ error: 'Failed to test connection' });
  }
}
