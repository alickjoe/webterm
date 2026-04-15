<template>
  <div class="login-page">
    <div class="lang-switch-wrapper">
      <LanguageSwitcher />
    </div>
    <div class="login-card card">
      <h1 class="login-title">{{ t('login.title') }}</h1>
      <p class="login-subtitle">{{ t('login.subtitle') }}</p>

      <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
      <div v-if="successMsg" class="success-msg">{{ successMsg }}</div>

      <!-- Login Form -->
      <form v-if="!showRegister" @submit.prevent="handleLogin" class="form">
        <div class="form-group">
          <label>{{ t('login.username') }}</label>
          <input v-model="loginForm.username" type="text" :placeholder="t('login.usernamePlaceholder')" required />
        </div>
        <div class="form-group">
          <label>{{ t('login.password') }}</label>
          <input v-model="loginForm.password" type="password" :placeholder="t('login.passwordPlaceholder')" required />
        </div>
        <button type="submit" class="btn-primary btn-full" :disabled="auth.loading">
          {{ auth.loading ? t('login.signingIn') : t('login.signIn') }}
        </button>
        <p class="toggle-text">
          {{ t('login.noAccount') }}
          <a href="#" @click.prevent="showRegister = true">{{ t('login.register') }}</a>
        </p>
      </form>

      <!-- Register Form -->
      <form v-else @submit.prevent="handleRegister" class="form">
        <div class="form-group">
          <label>{{ t('login.username') }}</label>
          <input v-model="registerForm.username" type="text" :placeholder="t('login.usernamePlaceholderRegister')" required />
        </div>
        <div class="form-group">
          <label>{{ t('login.email') }}</label>
          <input v-model="registerForm.email" type="email" :placeholder="t('login.emailPlaceholder')" required />
        </div>
        <div class="form-group">
          <label>{{ t('login.password') }}</label>
          <input v-model="registerForm.password" type="password" :placeholder="t('login.passwordPlaceholderRegister')" required />
        </div>
        <button type="submit" class="btn-primary btn-full" :disabled="auth.loading">
          {{ auth.loading ? t('login.registering') : t('login.register') }}
        </button>
        <p class="toggle-text">
          {{ t('login.hasAccount') }}
          <a href="#" @click.prevent="showRegister = false">{{ t('login.signIn') }}</a>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth.store';
import LanguageSwitcher from '@/components/LanguageSwitcher.vue';

const { t } = useI18n();
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
    errorMsg.value = err.response?.data?.error || t('login.loginFailed');
  }
}

async function handleRegister() {
  errorMsg.value = '';
  successMsg.value = '';
  try {
    await auth.register(registerForm.username, registerForm.email, registerForm.password);
    successMsg.value = t('login.registrationSuccess');
    showRegister.value = false;
  } catch (err: any) {
    errorMsg.value = err.response?.data?.error || t('login.registrationFailed');
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
  position: relative;
}

.lang-switch-wrapper {
  position: absolute;
  top: 16px;
  right: 16px;
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
