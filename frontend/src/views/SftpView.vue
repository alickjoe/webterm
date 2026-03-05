<template>
  <div class="sftp-page">
    <header class="sftp-header">
      <div class="flex items-center gap-3">
        <button class="btn-secondary btn-sm" @click="goBack">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back
        </button>
        <span class="sftp-title">SFTP File Manager</span>
      </div>
      <div class="flex items-center gap-2">
        <button class="btn-secondary btn-sm" @click="sftp.goUp()" :disabled="sftp.currentPath.value === '/'">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
          Up
        </button>
        <button class="btn-primary btn-sm" @click="triggerUpload">Upload</button>
        <button class="btn-secondary btn-sm" @click="showMkdir = true">New Folder</button>
        <input ref="fileInput" type="file" class="hidden" @change="handleUpload" multiple />
      </div>
    </header>

    <div class="path-bar">
      <span class="path-label">Path:</span>
      <span class="path-value">{{ sftp.currentPath.value }}</span>
    </div>

    <div v-if="sftp.error.value" class="sftp-error">{{ sftp.error.value }}</div>

    <div v-if="sftp.loading.value && sftp.files.value.length === 0" class="loading">Loading...</div>

    <div v-else class="file-list">
      <table>
        <thead>
          <tr>
            <th class="col-name">Name</th>
            <th class="col-size">Size</th>
            <th class="col-perms">Permissions</th>
            <th class="col-date">Modified</th>
            <th class="col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="file in sftp.files.value"
            :key="file.path"
            :class="['file-row', file.type]"
            @dblclick="sftp.navigateTo(file)"
          >
            <td class="col-name">
              <span class="file-icon">{{ fileIcon(file.type) }}</span>
              <span class="file-name" :class="{ clickable: file.type === 'directory' }">
                {{ file.name }}
              </span>
            </td>
            <td class="col-size">{{ file.type === 'directory' ? '-' : formatSize(file.size) }}</td>
            <td class="col-perms"><code>{{ file.permissions }}</code></td>
            <td class="col-date">{{ formatDate(file.modifiedAt) }}</td>
            <td class="col-actions">
              <div class="flex gap-2">
                <button v-if="file.type === 'file'" class="btn-icon" title="Download" @click="sftp.download(file.path)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </button>
                <button class="btn-icon" title="Rename" @click="startRename(file)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="btn-icon danger" title="Delete" @click="confirmDelete(file)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mkdir Dialog -->
    <div v-if="showMkdir" class="modal-overlay" @click.self="showMkdir = false">
      <div class="modal card" style="width: 360px">
        <h3>New Folder</h3>
        <form @submit.prevent="createFolder" class="form">
          <input v-model="newFolderName" type="text" placeholder="Folder name" required autofocus />
          <div class="flex gap-2 justify-end">
            <button type="button" class="btn-secondary" @click="showMkdir = false">Cancel</button>
            <button type="submit" class="btn-primary">Create</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Rename Dialog -->
    <div v-if="showRename" class="modal-overlay" @click.self="showRename = false">
      <div class="modal card" style="width: 360px">
        <h3>Rename</h3>
        <form @submit.prevent="doRename" class="form">
          <input v-model="renameNewName" type="text" placeholder="New name" required autofocus />
          <div class="flex gap-2 justify-end">
            <button type="button" class="btn-secondary" @click="showRename = false">Cancel</button>
            <button type="submit" class="btn-primary">Rename</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSftp } from '@/composables/useSftp';
import type { FileEntry } from '@/types';

const route = useRoute();
const router = useRouter();
const connectionId = route.params.connectionId as string;

const sftp = useSftp();
const fileInput = ref<HTMLInputElement | null>(null);

const showMkdir = ref(false);
const newFolderName = ref('');
const showRename = ref(false);
const renameTarget = ref<FileEntry | null>(null);
const renameNewName = ref('');

onMounted(() => {
  sftp.connect(connectionId);
});

onUnmounted(() => {
  sftp.disconnect();
});

function goBack() {
  router.push('/');
}

function fileIcon(type: string) {
  if (type === 'directory') return '\uD83D\uDCC1';
  if (type === 'symlink') return '\uD83D\uDD17';
  return '\uD83D\uDCC4';
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + ' ' + units[i];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function triggerUpload() {
  fileInput.value?.click();
}

async function handleUpload(e: Event) {
  const input = e.target as HTMLInputElement;
  if (!input.files) return;
  for (const file of input.files) {
    await sftp.upload(file);
  }
  input.value = '';
}

function confirmDelete(file: FileEntry) {
  if (confirm(`Delete "${file.name}"?`)) {
    sftp.remove(file.path);
  }
}

async function createFolder() {
  if (!newFolderName.value) return;
  await sftp.mkdir(newFolderName.value);
  newFolderName.value = '';
  showMkdir.value = false;
}

function startRename(file: FileEntry) {
  renameTarget.value = file;
  renameNewName.value = file.name;
  showRename.value = true;
}

async function doRename() {
  if (!renameTarget.value || !renameNewName.value) return;
  const parentPath = renameTarget.value.path.split('/').slice(0, -1).join('/') || '/';
  const newPath = parentPath === '/' ? `/${renameNewName.value}` : `${parentPath}/${renameNewName.value}`;
  await sftp.rename(renameTarget.value.path, newPath);
  showRename.value = false;
  renameTarget.value = null;
}
</script>

<style scoped>
.sftp-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.sftp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.sftp-title {
  font-family: var(--font-mono);
  font-size: 14px;
  color: var(--text-secondary);
}

.path-bar {
  padding: 8px 16px;
  background: var(--bg-tertiary);
  font-family: var(--font-mono);
  font-size: 13px;
  flex-shrink: 0;
}

.path-label {
  color: var(--text-muted);
  margin-right: 8px;
}

.path-value {
  color: var(--accent);
}

.sftp-error {
  padding: 8px 16px;
  background: rgba(247, 118, 142, 0.1);
  color: var(--danger);
  font-size: 13px;
  flex-shrink: 0;
}

.loading {
  padding: 40px;
  text-align: center;
  color: var(--text-muted);
}

.file-list {
  flex: 1;
  overflow-y: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: var(--bg-secondary);
  position: sticky;
  top: 0;
  z-index: 1;
}

th {
  text-align: left;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  border-bottom: 1px solid var(--border);
}

td {
  padding: 6px 12px;
  font-size: 13px;
  border-bottom: 1px solid rgba(59, 66, 97, 0.3);
}

.file-row {
  transition: background 0.1s;
}

.file-row:hover {
  background: var(--bg-secondary);
}

.file-row.directory {
  cursor: pointer;
}

.col-name {
  min-width: 300px;
}

.col-size {
  width: 100px;
  text-align: right;
}

.col-perms {
  width: 120px;
}

.col-date {
  width: 180px;
}

.col-actions {
  width: 120px;
}

.file-icon {
  margin-right: 8px;
}

.file-name.clickable {
  color: var(--accent);
}

code {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-muted);
}

.btn-icon {
  background: none;
  padding: 4px;
  color: var(--text-muted);
}

.btn-icon:hover {
  color: var(--text-primary);
}

.btn-icon.danger:hover {
  color: var(--danger);
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.hidden {
  display: none;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal h3 {
  margin-bottom: 12px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.justify-end {
  justify-content: flex-end;
}
</style>
