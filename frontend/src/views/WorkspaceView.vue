<template>
  <div class="workspace">
    <header class="workspace-header">
      <div class="flex items-center gap-2">
        <button class="btn-secondary btn-sm" @click="goToDashboard">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Dashboard
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
            <button class="host-tab-close" @click.stop="closeTab(tab.id)" title="Close">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
        <button class="btn-add-tab" @click="goToDashboard" title="Add connection">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </div>
    </header>

    <ConnectionPanel
      v-for="tab in workspaceStore.tabs"
      :key="tab.id"
      v-show="tab.id === workspaceStore.activeTabId"
      :connection-id="tab.connectionId"
      :is-active="tab.id === workspaceStore.activeTabId"
      :active-sub-tab="tab.activeSubTab"
      @sub-tab-change="(st) => workspaceStore.setSubTab(tab.id, st)"
      @close="closeTab(tab.id)"
    />
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'WorkspaceView' });

import { useRouter } from 'vue-router';
import { useWorkspaceStore } from '@/stores/workspace.store';
import ConnectionPanel from '@/views/ConnectionPanel.vue';

const router = useRouter();
const workspaceStore = useWorkspaceStore();

function goToDashboard() {
  router.push({ name: 'dashboard' });
}

function closeTab(tabId: string) {
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
  padding: 0 12px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  min-height: 42px;
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
</style>
