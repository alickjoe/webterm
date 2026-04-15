<template>
  <div class="workspace">
    <header class="workspace-header">
      <div class="flex items-center gap-2">
        <button class="btn-secondary btn-sm" @click="goToDashboard">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          {{ t('workspace.dashboard') }}
        </button>
        <div class="host-tabs">
          <div
            v-for="tab in workspaceStore.tabs"
            :key="tab.id"
            :class="['host-tab', { active: tab.id === workspaceStore.activeTabId }]"
            @click="workspaceStore.setActiveTab(tab.id)"
          >
            <span class="host-tab-label">{{ tab.label }}</span>
            <span class="host-tab-host">{{ tab.host }}</span>
            <button class="host-tab-close" @click.stop="closeTab(tab.id)" :title="t('workspace.close')">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
        <button class="btn-add-tab" @click="goToDashboard" :title="t('workspace.addConnection')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
        </button>
        <div class="history-wrapper">
          <button class="btn-add-tab" @click="toggleHistory" :title="t('workspace.commandHistory')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </button>
          <div v-if="showHistory" class="history-popup">
            <div class="history-header">
              <span class="history-title">{{ t('workspace.commandHistory') }}</span>
              <button v-if="historyCommands.length > 0" class="btn-danger btn-sm" @click="handleClearHistory">{{ t('workspace.clear') }}</button>
            </div>
            <div v-if="historyLoading" class="history-empty">{{ t('workspace.loading') }}</div>
            <div v-else-if="historyCommands.length === 0" class="history-empty">{{ t('workspace.noCommands') }}</div>
            <div v-else class="history-list">
              <div
                v-for="(cmd, index) in historyCommands"
                :key="index"
                class="history-item"
                @click="selectCommand(cmd)"
                :title="cmd"
              >
                {{ cmd }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="header-right">
        <LanguageSwitcher />
      </div>
    </header>

    <div v-if="showHistory" class="history-backdrop" @click="showHistory = false"></div>

    <ConnectionPanel
      v-for="tab in workspaceStore.tabs"
      :key="tab.id"
      :ref="(el: any) => setPanelRef(tab.id, el)"
      v-show="tab.id === workspaceStore.activeTabId"
      :connection-id="tab.connectionId"
      :is-active="tab.id === workspaceStore.activeTabId"
      :active-sub-tab="tab.activeSubTab"
      @sub-tab-change="(st: 'terminal' | 'sftp') => workspaceStore.setSubTab(tab.id, st)"
      @close="closeTab(tab.id)"
    />
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'WorkspaceView' });

import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { getCommandHistory, clearCommandHistory } from '@/api/history.api';
import ConnectionPanel from '@/views/ConnectionPanel.vue';
import LanguageSwitcher from '@/components/LanguageSwitcher.vue';

const { t } = useI18n();
const router = useRouter();
const workspaceStore = useWorkspaceStore();

// Panel template refs
const panelRefs = ref<Record<string, InstanceType<typeof ConnectionPanel>>>({});

function setPanelRef(tabId: string, el: any) {
  if (el) {
    panelRefs.value[tabId] = el;
  } else {
    delete panelRefs.value[tabId];
  }
}

// History state
const showHistory = ref(false);
const historyCommands = ref<string[]>([]);
const historyLoading = ref(false);

async function toggleHistory() {
  if (showHistory.value) {
    showHistory.value = false;
    return;
  }
  showHistory.value = true;
  historyLoading.value = true;
  try {
    historyCommands.value = await getCommandHistory();
  } catch {
    historyCommands.value = [];
  } finally {
    historyLoading.value = false;
  }
}

function selectCommand(cmd: string) {
  showHistory.value = false;
  const activeId = workspaceStore.activeTabId;
  if (activeId && panelRefs.value[activeId]) {
    panelRefs.value[activeId].writeCommand(cmd);
  }
}

async function handleClearHistory() {
  try {
    await clearCommandHistory();
    historyCommands.value = [];
  } catch {
    // ignore
  }
}

function goToDashboard() {
  router.push({ name: 'dashboard' });
}

function closeTab(tabId: string) {
  delete panelRefs.value[tabId];
  const allClosed = workspaceStore.removeTab(tabId);
  if (allClosed) {
    router.push({ name: 'dashboard' });
  }
}
</script>

<style scoped>
.workspace {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
}

.workspace-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  min-height: 42px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.host-tabs {
  display: flex;
  gap: 0;
  overflow-x: auto;
  margin-left: 4px;
}

.host-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 13px;
  color: var(--text-muted);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
  white-space: nowrap;
  max-width: 240px;
  min-width: 120px;
  position: relative;
}

.host-tab:hover {
  color: var(--text-secondary);
  background: rgba(122, 162, 247, 0.05);
}

.host-tab.active {
  color: var(--text-primary);
  border-bottom-color: var(--accent);
}

.host-tab + .host-tab {
  border-left: 1px solid var(--border);
}

.host-tab-label {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
}

.host-tab-host {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
}

.host-tab.active .host-tab-host {
  color: var(--text-secondary);
}

.host-tab-close {
  background: none;
  border: none;
  padding: 2px;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s, color 0.15s, background 0.15s;
  flex-shrink: 0;
}

.host-tab:hover .host-tab-close,
.host-tab.active .host-tab-close {
  opacity: 1;
}

.host-tab-close:hover {
  color: var(--danger);
  background: rgba(247, 118, 142, 0.15);
}

.btn-add-tab {
  background: none;
  border: none;
  padding: 6px;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s, background 0.15s;
  margin-left: 4px;
  flex-shrink: 0;
}

.btn-add-tab:hover {
  color: var(--accent);
  background: rgba(122, 162, 247, 0.1);
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

/* History dropdown */
.history-wrapper {
  position: relative;
  flex-shrink: 0;
}

.history-backdrop {
  position: fixed;
  inset: 0;
  z-index: 99;
}

.history-popup {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 6px;
  width: 420px;
  max-height: 400px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  z-index: 100;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.history-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.history-list {
  overflow-y: auto;
  flex: 1;
}

.history-item {
  padding: 8px 14px;
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: background 0.1s, color 0.1s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-bottom: 1px solid rgba(59, 66, 97, 0.2);
}

.history-item:last-child {
  border-bottom: none;
}

.history-item:hover {
  background: rgba(122, 162, 247, 0.1);
  color: var(--text-primary);
}

.history-empty {
  padding: 24px 14px;
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
}
</style>
