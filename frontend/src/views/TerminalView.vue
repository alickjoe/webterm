<template>
  <div class="terminal-page">
    <header class="terminal-header">
      <div class="flex items-center gap-3">
        <button class="btn-secondary btn-sm" @click="goBack">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back
        </button>
        <span class="terminal-title">Terminal</span>
        <span v-if="connected" class="status-badge connected">Connected</span>
        <span v-else class="status-badge disconnected">Disconnected</span>
      </div>
      <div class="flex items-center gap-2">
        <button v-if="!connected" class="btn-primary btn-sm" @click="handleConnect">Reconnect</button>
        <button v-else class="btn-danger btn-sm" @click="handleDisconnect">Disconnect</button>
      </div>
    </header>
    <div class="terminal-container" ref="terminalContainer"></div>
    <div v-if="error" class="terminal-error">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTerminal } from '@/composables/useTerminal';
import '@xterm/xterm/css/xterm.css';

const route = useRoute();
const router = useRouter();
const connectionId = route.params.connectionId as string;

const terminalContainer = ref<HTMLElement | null>(null);
const { connected, error, initTerminal, connect, disconnect } = useTerminal(terminalContainer);

onMounted(() => {
  initTerminal();
  handleConnect();
});

onUnmounted(() => {
  disconnect();
});

async function handleConnect() {
  await connect(connectionId);
}

async function handleDisconnect() {
  await disconnect();
}

function goBack() {
  router.push('/');
}
</script>

<style scoped>
.terminal-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #1a1b26;
}

.terminal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.terminal-title {
  font-family: var(--font-mono);
  font-size: 14px;
  color: var(--text-secondary);
}

.status-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.status-badge.connected {
  background: rgba(158, 206, 106, 0.15);
  color: var(--success);
}

.status-badge.disconnected {
  background: rgba(247, 118, 142, 0.15);
  color: var(--danger);
}

.terminal-container {
  flex: 1;
  padding: 4px;
  overflow: hidden;
}

.terminal-container :deep(.xterm) {
  height: 100%;
}

.terminal-error {
  padding: 8px 16px;
  background: rgba(247, 118, 142, 0.1);
  color: var(--danger);
  font-size: 13px;
  flex-shrink: 0;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
