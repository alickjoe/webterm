import { Level } from 'level';
import config from '../config';
import { logger } from './logger.service';

let db: Level<string, string>;

export async function initDatabase(): Promise<void> {
  db = new Level(config.rocksdbPath, { valueEncoding: 'utf8' });
  await db.open();
  logger.info(`Database opened at ${config.rocksdbPath}`);
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.close();
    logger.info('Database closed');
  }
}

export async function dbGet(key: string): Promise<string | null> {
  try {
    return await db.get(key);
  } catch (err: any) {
    if (err.code === 'LEVEL_NOT_FOUND') {
      return null;
    }
    throw err;
  }
}

export async function dbPut(key: string, value: string): Promise<void> {
  await db.put(key, value);
}

export async function dbDel(key: string): Promise<void> {
  await db.del(key);
}

export async function dbGetMany(prefix: string): Promise<Array<{ key: string; value: string }>> {
  const results: Array<{ key: string; value: string }> = [];
  for await (const [key, value] of db.iterator({
    gte: prefix,
    lte: prefix + '\xFF',
  })) {
    results.push({ key, value });
  }
  return results;
}
