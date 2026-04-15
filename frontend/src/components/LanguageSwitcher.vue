<template>
  <div class="lang-switcher">
    <button class="lang-btn" @click="toggleDropdown">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
      <span class="lang-current">{{ currentLocaleName }}</span>
      <svg class="chevron" :class="{ open: showDropdown }" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </button>
    <div v-if="showDropdown" class="lang-dropdown">
      <button
        v-for="locale in locales"
        :key="locale.code"
        :class="['lang-option', { active: locale.code === currentLocale }]"
        @click="changeLocale(locale.code)"
      >
        {{ locale.name }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { setLocale, SUPPORTED_LOCALES, type AppLocale } from '@/i18n';

const { locale } = useI18n();
const showDropdown = ref(false);
const locales = SUPPORTED_LOCALES;

const currentLocale = computed(() => locale.value);
const currentLocaleName = computed(() => {
  const loc = locales.find(l => l.code === locale.value);
  return loc ? loc.name : 'English';
});

function toggleDropdown() {
  showDropdown.value = !showDropdown.value;
}

function changeLocale(code: AppLocale) {
  setLocale(code);
  showDropdown.value = false;
}
</script>

<style scoped>
.lang-switcher {
  position: relative;
}

.lang-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.lang-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border-color: var(--accent);
}

.lang-current {
  min-width: 50px;
}

.chevron {
  transition: transform 0.2s;
}

.chevron.open {
  transform: rotate(180deg);
}

.lang-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 100;
  min-width: 120px;
}

.lang-option {
  display: block;
  width: 100%;
  padding: 8px 14px;
  background: none;
  border: none;
  text-align: left;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}

.lang-option:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.lang-option.active {
  color: var(--accent);
  background: rgba(122, 162, 247, 0.1);
}
</style>
