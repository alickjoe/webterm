import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from '@/types';
import * as authApi from '@/api/auth.api';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem('token'));
  const loading = ref(false);

  const isAuthenticated = computed(() => !!token.value);

  async function login(username: string, password: string) {
    loading.value = true;
    try {
      const data = await authApi.login(username, password);
      user.value = data.user;
      token.value = data.token;
      localStorage.setItem('token', data.token);
    } finally {
      loading.value = false;
    }
  }

  async function register(username: string, email: string, password: string) {
    loading.value = true;
    try {
      await authApi.register(username, email, password);
    } finally {
      loading.value = false;
    }
  }

  async function fetchUser() {
    if (!token.value) return;
    try {
      const data = await authApi.getMe();
      user.value = data.user;
    } catch {
      logout();
    }
  }

  function logout() {
    user.value = null;
    token.value = null;
    localStorage.removeItem('token');
  }

  return { user, token, loading, isAuthenticated, login, register, fetchUser, logout };
});
