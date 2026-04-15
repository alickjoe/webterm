<template>
  <div class="dashboard">
    <header class="dashboard-header">
      <div class="flex items-center gap-3">
        <h1 class="logo">{{ t('login.title') }}</h1>
      </div>
      <div class="flex items-center gap-3">
        <LanguageSwitcher />
        <span class="username">{{ auth.user?.username }}</span>
        <button class="btn-secondary" @click="handleLogout">{{ t('dashboard.logout') }}</button>
      </div>
    </header>

    <main class="dashboard-content">
      <div class="section-header flex items-center justify-between">
        <h2>{{ t('dashboard.connections') }}</h2>
        <button class="btn-primary" @click="showForm = true">{{ t('dashboard.newConnection') }}</button>
      </div>

      <div v-if="connections.loading" class="loading">{{ t('dashboard.loadingConnections') }}</div>

      <div v-else-if="connections.connections.length === 0" class="empty-state card">
        <p>{{ t('dashboard.noConnections') }}</p>
      </div>

      <div v-else class="connection-grid">
        <div v-for="conn in connections.connections" :key="conn.id" class="connection-card card">
          <div class="conn-header">
            <h3>{{ conn.name }}</h3>
            <div class="conn-actions flex gap-2">
              <button class="btn-icon" :title="t('common.edit')" @click="editConn(conn)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="btn-icon danger" :title="t('common.delete')" @click="deleteConn(conn)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
          <p class="conn-info">{{ conn.username }}@{{ conn.host }}:{{ conn.port }}</p>
          <p class="conn-auth">{{ t('dashboard.auth') }}: {{ conn.authType }}</p>
          <div class="conn-buttons flex gap-2">
            <button class="btn-primary" @click="openTerminal(conn.id)">{{ t('dashboard.terminal') }}</button>
            <button class="btn-secondary" @click="openSftp(conn.id)">{{ t('dashboard.sftp') }}</button>
            <button class="btn-success btn-sm" @click="testConn(conn)" :disabled="testingId === conn.id">
              {{ testingId === conn.id ? t('common.testing') : t('common.test') }}
            </button>
          </div>
          <p v-if="testResults[conn.id]" :class="['test-result', testResults[conn.id].success ? 'success' : 'error']">
            {{ testResults[conn.id].message }}
          </p>
        </div>
      </div>
    </main>

    <!-- Connection Form Modal -->
    <div v-if="showForm" class="modal-overlay" @click.self="closeForm">
      <div class="modal card">
        <h2>{{ editingId ? t('dashboard.editConnection') : t('dashboard.newConnectionTitle') }}</h2>
        <form @submit.prevent="saveConnection" class="form">
          <div class="form-group">
            <label>{{ t('dashboard.name') }}</label>
            <input v-model="form.name" type="text" placeholder="My Server" required />
          </div>
          <div class="form-row">
            <div class="form-group" style="flex: 3">
              <label>{{ t('dashboard.host') }}</label>
              <input v-model="form.host" type="text" placeholder="192.168.1.100" required />
            </div>
            <div class="form-group" style="flex: 1">
              <label>{{ t('dashboard.port') }}</label>
              <input v-model.number="form.port" type="number" placeholder="22" required />
            </div>
          </div>
          <div class="form-group">
            <label>{{ t('dashboard.username') }}</label>
            <input v-model="form.username" type="text" placeholder="root" required />
          </div>
          <div class="form-group">
            <label>{{ t('dashboard.authType') }}</label>
            <select v-model="form.authType">
              <option value="password">{{ t('dashboard.password') }}</option>
              <option value="privateKey">{{ t('dashboard.privateKey') }}</option>
            </select>
          </div>
          <div v-if="form.authType === 'password'" class="form-group">
            <label>{{ t('dashboard.password') }}</label>
            <input v-model="form.password" type="password" :placeholder="editingId ? t('login.passwordPlaceholderEdit') : t('login.passwordPlaceholder')" />
          </div>
          <div v-else class="form-group">
            <label>{{ t('dashboard.privateKey') }}</label>
            <textarea v-model="form.privateKey" rows="4" :placeholder="editingId ? t('login.passwordPlaceholderEdit') : t('login.privateKeyPlaceholder')"></textarea>
          </div>
          <div v-if="formError" class="error-msg">{{ formError }}</div>
          <div class="flex gap-2 justify-end">
            <button type="button" class="btn-secondary" @click="closeForm">{{ t('common.cancel') }}</button>
            <button type="submit" class="btn-primary" :disabled="saving">
              {{ saving ? t('common.saving') : t('common.save') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth.store';
import { useConnectionsStore } from '@/stores/connections.store';
import { useWorkspaceStore } from '@/stores/workspace.store';
import LanguageSwitcher from '@/components/LanguageSwitcher.vue';
import type { Connection, ConnectionInput } from '@/types';

const { t } = useI18n();
const router = useRouter();
const auth = useAuthStore();
const connections = useConnectionsStore();
const workspaceStore = useWorkspaceStore();

const showForm = ref(false);
const editingId = ref<string | null>(null);
const saving = ref(false);
const formError = ref('');
const testingId = ref<string | null>(null);
const testResults = ref<Record<string, { success: boolean; message: string }>>({});

const form = reactive<ConnectionInput>({
  name: '',
  host: '',
  port: 22,
  username: 'root',
  authType: 'password',
  password: '',
  privateKey: '',
});

onMounted(() => {
  connections.fetchConnections();
});

function openTerminal(connectionId: string) {
  const conn = connections.connections.find(c => c.id === connectionId);
  if (conn) workspaceStore.addTab(conn, 'terminal');
  router.push({ name: 'workspace' });
}

function openSftp(connectionId: string) {
  const conn = connections.connections.find(c => c.id === connectionId);
  if (conn) workspaceStore.addTab(conn, 'sftp');
  router.push({ name: 'workspace' });
}

function editConn(conn: Connection) {
  editingId.value = conn.id;
  form.name = conn.name;
  form.host = conn.host;
  form.port = conn.port;
  form.username = conn.username;
  form.authType = conn.authType;
  form.password = '';
  form.privateKey = '';
  showForm.value = true;
}

async function deleteConn(conn: Connection) {
  if (!confirm(t('dashboard.deleteConfirm', { name: conn.name }))) return;
  try {
    await connections.removeConnection(conn.id);
  } catch (err: any) {
    alert(err.response?.data?.error || t('dashboard.deleteFailed'));
  }
}

async function testConn(conn: Connection) {
  testingId.value = conn.id;
  try {
    const result = await connections.testConn(conn.id);
    testResults.value[conn.id] = result;
  } catch (err: any) {
    testResults.value[conn.id] = { success: false, message: err.response?.data?.error || t('dashboard.testFailed') };
  } finally {
    testingId.value = null;
  }
}

async function saveConnection() {
  saving.value = true;
  formError.value = '';
  try {
    if (editingId.value) {
      await connections.editConnection(editingId.value, form);
    } else {
      await connections.addConnection(form);
    }
    closeForm();
  } catch (err: any) {
    formError.value = err.response?.data?.error || t('dashboard.saveFailed');
  } finally {
    saving.value = false;
  }
}

function closeForm() {
  showForm.value = false;
  editingId.value = null;
  formError.value = '';
  form.name = '';
  form.host = '';
  form.port = 22;
  form.username = 'root';
  form.authType = 'password';
  form.password = '';
  form.privateKey = '';
}

function handleLogout() {
  auth.logout();
  router.push('/login');
}
</script>

<style scoped>
.dashboard {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
}

.logo {
  font-size: 20px;
  font-weight: 700;
  color: var(--accent);
  font-family: var(--font-mono);
}

.username {
  color: var(--text-muted);
  font-size: 14px;
}

.dashboard-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.section-header {
  margin-bottom: 20px;
}

.section-header h2 {
  font-size: 20px;
}

.connection-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.connection-card {
  transition: border-color 0.2s;
}

.connection-card:hover {
  border-color: var(--accent);
}

.conn-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.conn-header h3 {
  font-size: 16px;
  font-weight: 600;
}

.conn-info {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.conn-auth {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.conn-buttons {
  margin-top: 8px;
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
}

.test-result {
  font-size: 12px;
  margin-top: 8px;
  padding: 4px 8px;
  border-radius: 4px;
}

.test-result.success {
  color: var(--success);
  background: rgba(158, 206, 106, 0.1);
}

.test-result.error {
  color: var(--danger);
  background: rgba(247, 118, 142, 0.1);
}

.loading, .empty-state {
  text-align: center;
  padding: 40px;
  color: var(--text-muted);
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

.modal {
  width: 480px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
}

.modal h2 {
  margin-bottom: 16px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-group label {
  font-size: 13px;
  color: var(--text-secondary);
}

.form-row {
  display: flex;
  gap: 12px;
}

.justify-end {
  justify-content: flex-end;
}

.error-msg {
  background: rgba(247, 118, 142, 0.1);
  border: 1px solid var(--danger);
  color: var(--danger);
  padding: 8px 12px;
  border-radius: var(--radius);
  font-size: 13px;
}
</style>
