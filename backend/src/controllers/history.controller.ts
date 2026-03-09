import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';
import { dbGet, dbPut, dbDel } from '../services/db.service';
import { logger } from '../services/logger.service';

const MAX_HISTORY = 15;

const addCommandSchema = z.object({
  command: z.string().min(1).max(4096),
});

export async function getHistory(req: AuthRequest, res: Response): Promise<void> {
  try {
    const data = await dbGet(`history:${req.userId!}`);
    const commands: string[] = data ? JSON.parse(data) : [];
    res.json({ commands });
  } catch (err) {
    logger.error({ err }, 'Get command history error');
    res.status(500).json({ error: 'Failed to get command history' });
  }
}

export async function addCommand(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { command } = addCommandSchema.parse(req.body);

    const data = await dbGet(`history:${req.userId!}`);
    let commands: string[] = data ? JSON.parse(data) : [];

    // Deduplicate: remove existing entry if present
    commands = commands.filter((c) => c !== command);

    // Add to front
    commands.unshift(command);

    // Trim to max
    if (commands.length > MAX_HISTORY) {
      commands = commands.slice(0, MAX_HISTORY);
    }

    await dbPut(`history:${req.userId!}`, JSON.stringify(commands));
    res.json({ success: true });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    logger.error({ err }, 'Add command history error');
    res.status(500).json({ error: 'Failed to add command' });
  }
}

export async function clearHistory(req: AuthRequest, res: Response): Promise<void> {
  try {
    await dbDel(`history:${req.userId!}`);
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, 'Clear command history error');
    res.status(500).json({ error: 'Failed to clear history' });
  }
}
