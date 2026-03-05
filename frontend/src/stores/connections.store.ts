import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Connection, ConnectionInput } from '@/types';
import * as api from '@/api/connections.api';

export const useConnectionsStore = defineStore('connections', () => {
  const connections = ref<Connection[]>([]);
  const loading = ref(false);

  async function fetchConnections() {
    loading.value = true;
    try {
      connections.value = await api.listConnections();
    } finally {
      loading.value = false;
    }
  }

  async function addConnection(input: ConnectionInput) {
    const conn = await api.createConnection(input);
    connections.value.push(conn);
    return conn;
  }

  async function editConnection(id: string, input: ConnectionInput) {
    const conn = await api.updateConnection(id, input);
    const idx = connections.value.findIndex((c) => c.id === id);
    if (idx !== -1) connections.value[idx] = conn;
    return conn;
  }

  async function removeConnection(id: string) {
    await api.deleteConnection(id);
    connections.value = connections.value.filter((c) => c.id !== id);
  }

  async function testConn(id: string) {
    return await api.testConnection(id);
  }

  return { connections, loading, fetchConnections, addConnection, editConnection, removeConnection, testConn };
});
