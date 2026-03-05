import client from './client';
import type { Connection, ConnectionInput } from '@/types';

export async function listConnections() {
  const { data } = await client.get<Connection[]>('/connections');
  return data;
}

export async function getConnection(id: string) {
  const { data } = await client.get<Connection>(`/connections/${id}`);
  return data;
}

export async function createConnection(input: ConnectionInput) {
  const { data } = await client.post<Connection>('/connections', input);
  return data;
}

export async function updateConnection(id: string, input: ConnectionInput) {
  const { data } = await client.put<Connection>(`/connections/${id}`, input);
  return data;
}

export async function deleteConnection(id: string) {
  await client.delete(`/connections/${id}`);
}

export async function testConnection(id: string) {
  const { data } = await client.post<{ success: boolean; message: string }>(
    `/connections/${id}/test`
  );
  return data;
}
