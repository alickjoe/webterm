import { ref } from 'vue';
import type { FileEntry } from '@/types';
import * as sftpApi from '@/api/sftp.api';

export function useSftp() {
  const sessionId = ref<string | null>(null);
  const currentPath = ref('/');
  const files = ref<FileEntry[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function connect(connectionId: string) {
    loading.value = true;
    error.value = null;
    try {
      const { sessionId: sid } = await sftpApi.createSftpSession(connectionId);
      sessionId.value = sid;
      await listDir('/');
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message;
    } finally {
      loading.value = false;
    }
  }

  async function listDir(path: string) {
    if (!sessionId.value) return;
    loading.value = true;
    error.value = null;
    try {
      files.value = await sftpApi.listDirectory(sessionId.value, path);
      currentPath.value = path;
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message;
    } finally {
      loading.value = false;
    }
  }

  async function navigateTo(entry: FileEntry) {
    if (entry.type === 'directory') {
      await listDir(entry.path);
    }
  }

  async function goUp() {
    if (currentPath.value === '/') return;
    const parent = currentPath.value.split('/').slice(0, -1).join('/') || '/';
    await listDir(parent);
  }

  async function download(filePath: string) {
    if (!sessionId.value) return;
    try {
      const blob = await sftpApi.downloadFile(sessionId.value, filePath);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filePath.split('/').pop() || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message;
    }
  }

  async function upload(file: File) {
    if (!sessionId.value) return;
    loading.value = true;
    error.value = null;
    try {
      await sftpApi.uploadFile(sessionId.value, currentPath.value + '/', file);
      await listDir(currentPath.value);
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message;
    } finally {
      loading.value = false;
    }
  }

  async function remove(path: string) {
    if (!sessionId.value) return;
    loading.value = true;
    try {
      await sftpApi.deleteFileOrDir(sessionId.value, path);
      await listDir(currentPath.value);
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message;
    } finally {
      loading.value = false;
    }
  }

  async function mkdir(dirName: string) {
    if (!sessionId.value) return;
    const fullPath = currentPath.value === '/'
      ? `/${dirName}`
      : `${currentPath.value}/${dirName}`;
    try {
      await sftpApi.makeDirectory(sessionId.value, fullPath);
      await listDir(currentPath.value);
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message;
    }
  }

  async function rename(oldPath: string, newPath: string) {
    if (!sessionId.value) return;
    try {
      await sftpApi.renameFile(sessionId.value, oldPath, newPath);
      await listDir(currentPath.value);
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message;
    }
  }

  async function disconnect() {
    if (sessionId.value) {
      try {
        await sftpApi.closeSftpSession(sessionId.value);
      } catch {}
      sessionId.value = null;
    }
    files.value = [];
    currentPath.value = '/';
  }

  return {
    sessionId,
    currentPath,
    files,
    loading,
    error,
    connect,
    listDir,
    navigateTo,
    goUp,
    download,
    upload,
    remove,
    mkdir,
    rename,
    disconnect,
  };
}
