import client from './client';
import type { FileEntry } from '@/types';

export async function createSftpSession(connectionId: string) {
  const { data } = await client.post<{ sessionId: string }>('/sftp/sessions', { connectionId });
  return data;
}

export async function listDirectory(sessionId: string, path: string) {
  const { data } = await client.get<FileEntry[]>(`/sftp/sessions/${sessionId}/list`, {
    params: { path },
  });
  return data;
}

export async function downloadFile(sessionId: string, filePath: string) {
  const response = await client.get(`/sftp/sessions/${sessionId}/download`, {
    params: { path: filePath },
    responseType: 'blob',
  });
  return response.data;
}

export async function uploadFile(sessionId: string, targetPath: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('path', targetPath);

  const { data } = await client.post(`/sftp/sessions/${sessionId}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function deleteFileOrDir(sessionId: string, path: string) {
  await client.delete(`/sftp/sessions/${sessionId}/file`, { data: { path } });
}

export async function makeDirectory(sessionId: string, path: string) {
  await client.post(`/sftp/sessions/${sessionId}/mkdir`, { path });
}

export async function renameFile(sessionId: string, oldPath: string, newPath: string) {
  await client.post(`/sftp/sessions/${sessionId}/rename`, { oldPath, newPath });
}

export async function closeSftpSession(sessionId: string) {
  await client.delete(`/sftp/sessions/${sessionId}`);
}
