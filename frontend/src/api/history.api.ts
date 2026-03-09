import client from './client';

export async function getCommandHistory(): Promise<string[]> {
  const { data } = await client.get<{ commands: string[] }>('/history');
  return data.commands;
}

export async function saveCommand(command: string): Promise<void> {
  await client.post('/history', { command });
}

export async function clearCommandHistory(): Promise<void> {
  await client.delete('/history');
}
