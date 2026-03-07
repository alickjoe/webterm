import { ref } from 'vue';
import type { FileEntry } from '@/types';
import * as sftpApi from '@/api/sftp.api';
import {
  getFileLanguageLabel,
  canFormat as checkCanFormat,
  getPrettierConfig,
} from '@/utils/editor-languages';

const MAX_EDIT_SIZE = 1 * 1024 * 1024; // 1MB

export function useFileEditor() {
  const isOpen = ref(false);
  const filePath = ref<string | null>(null);
  const fileName = ref('');
  const originalContent = ref('');
  const loading = ref(false);
  const saving = ref(false);
  const error = ref<string | null>(null);
  const isDirty = ref(false);
  const languageLabel = ref('Text');
  const canFormatFile = ref(false);

  function updateLanguageInfo(name: string) {
    languageLabel.value = getFileLanguageLabel(name);
    canFormatFile.value = checkCanFormat(name);
  }

  async function openFile(sessionId: string, file: FileEntry): Promise<boolean> {
    if (file.size > MAX_EDIT_SIZE) {
      error.value = `File too large for editing (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum: 1MB`;
      return false;
    }

    loading.value = true;
    error.value = null;
    try {
      const result = await sftpApi.readFileContent(sessionId, file.path);
      filePath.value = file.path;
      fileName.value = file.name;
      originalContent.value = result.content;
      isDirty.value = false;
      updateLanguageInfo(file.name);
      isOpen.value = true;
      return true;
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message;
      return false;
    } finally {
      loading.value = false;
    }
  }

  function createNewFile(_currentPath: string) {
    filePath.value = null;
    fileName.value = 'untitled.txt';
    originalContent.value = '';
    isDirty.value = false;
    error.value = null;
    updateLanguageInfo('untitled.txt');
    isOpen.value = true;
  }

  async function saveFile(
    sessionId: string,
    content: string,
    currentPath: string
  ): Promise<boolean> {
    saving.value = true;
    error.value = null;
    try {
      const savePath = filePath.value || buildNewFilePath(currentPath, fileName.value);
      await sftpApi.writeFileContent(sessionId, savePath, content);
      filePath.value = savePath;
      originalContent.value = content;
      isDirty.value = false;
      return true;
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message;
      return false;
    } finally {
      saving.value = false;
    }
  }

  async function formatContent(content: string): Promise<string | null> {
    const config = getPrettierConfig(fileName.value);
    if (!config) return null;

    try {
      const prettier = await import('prettier/standalone');
      let plugins: any[] = [];

      switch (config.parser) {
        case 'json':
        case 'babel':
        case 'typescript': {
          const mod = await import('prettier/plugins/babel');
          const estree = await import('prettier/plugins/estree');
          plugins = [mod.default || mod, estree.default || estree];
          break;
        }
        case 'html': {
          const mod = await import('prettier/plugins/html');
          plugins = [mod.default || mod];
          break;
        }
        case 'css':
        case 'scss':
        case 'less': {
          const mod = await import('prettier/plugins/postcss');
          plugins = [mod.default || mod];
          break;
        }
        case 'yaml': {
          const mod = await import('prettier/plugins/yaml');
          plugins = [mod.default || mod];
          break;
        }
        case 'markdown': {
          const mod = await import('prettier/plugins/markdown');
          plugins = [mod.default || mod];
          break;
        }
        default:
          return null;
      }

      const formatted = await prettier.format(content, {
        parser: config.parser,
        plugins,
        tabWidth: 2,
        singleQuote: true,
        trailingComma: 'es5',
      });
      return formatted;
    } catch (err: any) {
      error.value = `Format error: ${err.message}`;
      return null;
    }
  }

  function closeEditor(): boolean {
    if (isDirty.value) {
      if (!confirm('You have unsaved changes. Discard them?')) {
        return false;
      }
    }
    isOpen.value = false;
    filePath.value = null;
    fileName.value = '';
    originalContent.value = '';
    isDirty.value = false;
    error.value = null;
    return true;
  }

  function setFileName(name: string) {
    fileName.value = name;
    updateLanguageInfo(name);
  }

  return {
    isOpen,
    filePath,
    fileName,
    originalContent,
    loading,
    saving,
    error,
    isDirty,
    languageLabel,
    canFormatFile,
    openFile,
    createNewFile,
    saveFile,
    formatContent,
    closeEditor,
    setFileName,
  };
}

function buildNewFilePath(currentPath: string, name: string): string {
  if (currentPath === '/') return `/${name}`;
  return `${currentPath}/${name}`;
}
