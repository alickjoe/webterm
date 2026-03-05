import { v4 as uuidv4 } from 'uuid';
import { Client, SFTPWrapper, FileEntry as SSH2FileEntry } from 'ssh2';
import { Connection, SftpSession, FileEntry } from '../types';
import { decrypt } from './crypto.service';
import { logger } from './logger.service';

// In-memory SFTP session store
const sftpSessions = new Map<string, SftpSession>();

export async function createSftpSession(
  userId: string,
  connection: Connection
): Promise<string> {
  const sessionId = uuidv4();

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
      client.sftp((err, sftp) => {
        if (err) {
          client.end();
          return reject(err);
        }

        const session: SftpSession = {
          id: sessionId,
          userId,
          connectionId: connection.id,
          sshClient: client,
          sftp,
          createdAt: new Date(),
          lastActivityAt: new Date(),
        };

        sftpSessions.set(sessionId, session);
        logger.info({ sessionId, host: connection.host }, 'SFTP session created');
        resolve(sessionId);
      });
    });

    client.on('error', (err) => {
      logger.error({ err, sessionId }, 'SFTP client error');
      sftpSessions.delete(sessionId);
      reject(err);
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

export function getSftpSession(sessionId: string): SftpSession | undefined {
  return sftpSessions.get(sessionId);
}

function formatPermissions(mode: number): string {
  const perms = ['---', '--x', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx'];
  const owner = perms[(mode >> 6) & 7];
  const group = perms[(mode >> 3) & 7];
  const other = perms[mode & 7];
  return owner + group + other;
}

function getFileType(attrs: any): 'file' | 'directory' | 'symlink' {
  if (attrs.isDirectory()) return 'directory';
  if (attrs.isSymbolicLink()) return 'symlink';
  return 'file';
}

export async function listDirectory(sessionId: string, dirPath: string): Promise<FileEntry[]> {
  const session = sftpSessions.get(sessionId);
  if (!session) throw new Error('Session not found');

  session.lastActivityAt = new Date();

  return new Promise((resolve, reject) => {
    session.sftp.readdir(dirPath, (err, list) => {
      if (err) return reject(err);

      const entries: FileEntry[] = list.map((item: SSH2FileEntry) => ({
        name: item.filename,
        path: dirPath === '/' ? `/${item.filename}` : `${dirPath}/${item.filename}`,
        type: getFileType(item.attrs),
        size: item.attrs.size,
        modifiedAt: new Date((item.attrs.mtime || 0) * 1000).toISOString(),
        permissions: formatPermissions(item.attrs.mode & 0o777),
        owner: item.attrs.uid,
        group: item.attrs.gid,
      }));

      // Sort: directories first, then by name
      entries.sort((a, b) => {
        if (a.type === 'directory' && b.type !== 'directory') return -1;
        if (a.type !== 'directory' && b.type === 'directory') return 1;
        return a.name.localeCompare(b.name);
      });

      resolve(entries);
    });
  });
}

export function createReadStream(sessionId: string, filePath: string) {
  const session = sftpSessions.get(sessionId);
  if (!session) throw new Error('Session not found');
  session.lastActivityAt = new Date();
  return session.sftp.createReadStream(filePath);
}

export function createWriteStream(sessionId: string, filePath: string) {
  const session = sftpSessions.get(sessionId);
  if (!session) throw new Error('Session not found');
  session.lastActivityAt = new Date();
  return session.sftp.createWriteStream(filePath);
}

export async function deleteFile(sessionId: string, filePath: string): Promise<void> {
  const session = sftpSessions.get(sessionId);
  if (!session) throw new Error('Session not found');
  session.lastActivityAt = new Date();

  return new Promise((resolve, reject) => {
    session.sftp.unlink(filePath, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

export async function deleteDirectory(sessionId: string, dirPath: string): Promise<void> {
  const session = sftpSessions.get(sessionId);
  if (!session) throw new Error('Session not found');
  session.lastActivityAt = new Date();

  return new Promise((resolve, reject) => {
    session.sftp.rmdir(dirPath, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

export async function makeDirectory(sessionId: string, dirPath: string): Promise<void> {
  const session = sftpSessions.get(sessionId);
  if (!session) throw new Error('Session not found');
  session.lastActivityAt = new Date();

  return new Promise((resolve, reject) => {
    session.sftp.mkdir(dirPath, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

export async function rename(
  sessionId: string,
  oldPath: string,
  newPath: string
): Promise<void> {
  const session = sftpSessions.get(sessionId);
  if (!session) throw new Error('Session not found');
  session.lastActivityAt = new Date();

  return new Promise((resolve, reject) => {
    session.sftp.rename(oldPath, newPath, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

export async function stat(sessionId: string, filePath: string): Promise<FileEntry> {
  const session = sftpSessions.get(sessionId);
  if (!session) throw new Error('Session not found');
  session.lastActivityAt = new Date();

  return new Promise((resolve, reject) => {
    session.sftp.stat(filePath, (err, attrs) => {
      if (err) return reject(err);
      const name = filePath.split('/').pop() || filePath;
      resolve({
        name,
        path: filePath,
        type: getFileType(attrs),
        size: attrs.size,
        modifiedAt: new Date((attrs.mtime || 0) * 1000).toISOString(),
        permissions: formatPermissions(attrs.mode & 0o777),
        owner: attrs.uid,
        group: attrs.gid,
      });
    });
  });
}

export function closeSftpSession(sessionId: string): void {
  const session = sftpSessions.get(sessionId);
  if (!session) return;

  session.sshClient.end();
  sftpSessions.delete(sessionId);
  logger.info({ sessionId }, 'SFTP session closed');
}
