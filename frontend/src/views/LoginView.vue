<template>
  <div class="login-page">
    <div class="login-card card">
      <h1 class="login-title">WebTerm</h1>
      <p class="login-subtitle">SSH Terminal in your browser</p>

      <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
      <div v-if="successMsg" class="success-msg">{{ successMsg }}</div>

      <!-- Login Form -->
      <form v-if="!showRegister" @submit.prevent="handleLogin" class="form">
        <div class="form-group">
          <label>Username</label>
          <input v-model="loginForm.username" type="text" placeholder="Username" required />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input v-model="loginForm.password" type="password" placeholder="Password" required />
        </div>
        <button type="submit" class="btn-primary btn-full" :disabled="auth.loading">
          {{ auth.loading ? 'Signing in...' : 'Sign In' }}
        </button>
        <p class="toggle-text">
          Don't have an account?
          <a href="#" @click.prevent="showRegister = true">Register</a>
        </p>
      </form>

      <!-- Register Form -->
      <form v-else @submit.prevent="handleRegister" class="form">
        <div class="form-group">
          <label>Username</label>
          <input v-model="registerForm.username" type="text" placeholder="Username (3-32 chars)" required />
        </div>
        <div class="form-group">
          <label>Email</label>
          <input v-model="registerForm.email" type="email" placeholder="Email" required />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input v-model="registerForm.password" type="password" placeholder="Password (min 6 chars)" required />
        </div>
        <button type="submit" class="btn-primary btn-full" :disabled="auth.loading">
          {{ auth.loading ? 'Registering...' : 'Register' }}
        </button>
        <p class="toggle-text">
          Already have an account?
          <a href="#" @click.prevent="showRegister = false">Sign In</a>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';

const router = useRouter();
const auth = useAuthStore();

const showRegister = ref(false);
const errorMsg = ref('');
const successMsg = ref('');

const loginForm = reactive({ username: '', password: '' });
const registerForm = reactive({ username: '', email: '', password: '' });

async function handleLogin() {
  errorMsg.value = '';
  try {
    await auth.login(loginForm.username, loginForm.password);
    router.push('/');
  } catch (err: any) {
    errorMsg.value = err.response?.data?.error || 'Login failed';
  }
}

async function handleRegister() {
  errorMsg.value = '';
  successMsg.value = '';
  try {
    await auth.register(registerForm.username, registerForm.email, registerForm.password);
    successMsg.value = 'Registration successful! Please sign in.';
    showRegister.value = false;
  } catch (err: any) {
    errorMsg.value = err.response?.data?.error || 'Registration failed';
  }
}
</script>

<style scoped>
.login-page {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--bg-primary) 0%, #16161e 100%);
}

.login-card {
  width: 400px;
  max-width: 90vw;
  text-align: center;
}

.login-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--accent);
  margin-bottom: 4px;
  font-family: var(--font-mono);
}

.login-subtitle {
  color: var(--text-muted);
  margin-bottom: 24px;
  font-size: 14px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  text-align: left;
}

.form-group label {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.btn-full {
  width: 100%;
  padding: 10px;
  font-size: 15px;
}

.toggle-text {
  font-size: 13px;
  color: var(--text-muted);
}

.error-msg {
  background: rgba(247, 118, 142, 0.1);
  border: 1px solid var(--danger);
  color: var(--danger);
  padding: 8px 12px;
  border-radius: var(--radius);
  font-size: 13px;
  margin-bottom: 8px;
}

.success-msg {
  background: rgba(158, 206, 106, 0.1);
  border: 1px solid var(--success);
  color: var(--success);
  padding: 8px 12px;
  border-radius: var(--radius);
  font-size: 13px;
  margin-bottom: 8px;
}
</style>
