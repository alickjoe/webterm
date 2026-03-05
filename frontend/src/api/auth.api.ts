import client from './client';
import type { User } from '@/types';

export async function register(username: string, email: string, password: string) {
  const { data } = await client.post<{ user: User }>('/auth/register', {
    username,
    email,
    password,
  });
  return data;
}

export async function login(username: string, password: string) {
  const { data } = await client.post<{ user: User; token: string }>('/auth/login', {
    username,
    password,
  });
  return data;
}

export async function getMe() {
  const { data } = await client.get<{ user: User }>('/auth/me');
  return data;
}
