import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Connection, WorkspaceTab } from '@/types';

export const useWorkspaceStore = defineStore('workspace', () => {
  const tabs = ref<WorkspaceTab[]>([]);
  const activeTabId = ref<string | null>(null);

  const activeTab = computed(() =>
    tabs.value.find((t) => t.id === activeTabId.value) ?? null,
  );

  const hasOpenTabs = computed(() => tabs.value.length > 0);

  function addTab(connection: Connection, subTab: 'terminal' | 'sftp' = 'terminal') {
    const existing = tabs.value.find((t) => t.connectionId === connection.id);
    if (existing) {
      activeTabId.value = existing.id;
      existing.activeSubTab = subTab;
      return;
    }

    const tab: WorkspaceTab = {
      id: connection.id,
      connectionId: connection.id,
      label: connection.name,
      host: `${connection.username}@${connection.host}:${connection.port}`,
      activeSubTab: subTab,
    };

    tabs.value.push(tab);
    activeTabId.value = tab.id;
  }

  function removeTab(tabId: string): boolean {
    const index = tabs.value.findIndex((t) => t.id === tabId);
    if (index === -1) return tabs.value.length === 0;

    tabs.value.splice(index, 1);

    if (activeTabId.value === tabId) {
      if (tabs.value.length === 0) {
        activeTabId.value = null;
      } else {
        const newIndex = Math.min(index, tabs.value.length - 1);
        activeTabId.value = tabs.value[newIndex].id;
      }
    }

    return tabs.value.length === 0;
  }

  function setActiveTab(tabId: string) {
    if (tabs.value.some((t) => t.id === tabId)) {
      activeTabId.value = tabId;
    }
  }

  function setSubTab(tabId: string, subTab: 'terminal' | 'sftp') {
    const tab = tabs.value.find((t) => t.id === tabId);
    if (tab) {
      tab.activeSubTab = subTab;
    }
  }

  function clearAll() {
    tabs.value = [];
    activeTabId.value = null;
  }

  return {
    tabs,
    activeTabId,
    activeTab,
    hasOpenTabs,
    addTab,
    removeTab,
    setActiveTab,
    setSubTab,
    clearAll,
  };
});
