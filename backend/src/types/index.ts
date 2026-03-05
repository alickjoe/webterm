import { Client, ClientChannel, SFTPWrapper } from 'ssh2';
import { Response } from 'express';

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserCreateInput {
  username: string;
  email: string;
  password: string;
}

export interface Connection {
  id: string;
  userId: string;
  name: string;
  host: string;
  port: number;
  username: string;
  authType: 'password' | 'privateKey';
  encryptedPassword?: string;
  encryptedPrivateKey?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectionCreateInput {
  name: string;
  host: string;
  port: number;
  username: string;
  authType: 'password' | 'privateKey';
  password?: string;
  privateKey?: string;
}

export interface TerminalSession {
  id: string;
  userId: string;
  connectionId: string;
  sshClient: Client;
  stream: ClientChannel;
  sseClients: Set<Response>;
  createdAt: Date;
  lastActivityAt: Date;
  cols: number;
  rows: number;
}

export interface SftpSession {
  id: string;
  userId: string;
  connectionId: string;
  sshClient: Client;
  sftp: SFTPWrapper;
  createdAt: Date;
  lastActivityAt: Date;
}

export interface FileEntry {
  name: string;
  path: string;
  type: 'file' | 'directory' | 'symlink';
  size: number;
  modifiedAt: string;
  permissions: string;
  owner: number;
  group: number;
}

export interface JwtPayload {
  sub: string;
  username: string;
  iat: number;
  exp: number;
}
