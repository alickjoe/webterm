export interface User {
  id: string;
  username: string;
  email: string;
}

export interface Connection {
  id: string;
  userId: string;
  name: string;
  host: string;
  port: number;
  username: string;
  authType: 'password' | 'privateKey';
  hasPassword?: boolean;
  hasPrivateKey?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectionInput {
  name: string;
  host: string;
  port: number;
  username: string;
  authType: 'password' | 'privateKey';
  password?: string;
  privateKey?: string;
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

export interface TerminalSessionInfo {
  id: string;
  connectionId: string;
  createdAt: string;
  lastActivityAt: string;
}

export interface WorkspaceTab {
  id: string;
  connectionId: string;
  label: string;
  host: string;
  activeSubTab: 'terminal' | 'sftp';
}
