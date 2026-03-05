import client from './client';

export async function createTerminalSession(connectionId: string) {
  const { data } = await client.post<{ sessionId: string }>('/terminal/sessions', {
    connectionId,
  });
  return data;
}

export async function sendInput(sessionId: string, inputData: string) {
  await client.post(`/terminal/sessions/${sessionId}/input`, { data: inputData });
}

export async function resizeTerminal(sessionId: string, cols: number, rows: number) {
  await client.post(`/terminal/sessions/${sessionId}/resize`, { cols, rows });
}

export async function closeTerminalSession(sessionId: string) {
  await client.delete(`/terminal/sessions/${sessionId}`);
}

export async function listSessions() {
  const { data } = await client.get('/terminal/sessions');
  return data;
}
