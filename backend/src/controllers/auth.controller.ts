import { Request, Response } from 'express';
import { z } from 'zod';
import { createUser, authenticateUser, getUserById } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { logger } from '../services/logger.service';

const registerSchema = z.object({
  username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_-]+$/),
  email: z.string().email(),
  password: z.string().min(6).max(128),
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const input = registerSchema.parse(req.body);
    const user = await createUser(input);
    res.status(201).json({
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    if (err.message === 'Username already exists' || err.message === 'Email already exists') {
      res.status(409).json({ error: err.message });
      return;
    }
    logger.error({ err }, 'Registration error');
    res.status(500).json({ error: 'Registration failed' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const input = loginSchema.parse(req.body);
    const { user, token } = await authenticateUser(input.username, input.password);
    res.json({
      user: { id: user.id, username: user.username, email: user.email },
      token,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    if (err.message === 'Invalid credentials') {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }
    logger.error({ err }, 'Login error');
    res.status(500).json({ error: 'Login failed' });
  }
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = await getUserById(req.userId!);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (err) {
    logger.error({ err }, 'Get user error');
    res.status(500).json({ error: 'Failed to get user info' });
  }
}
