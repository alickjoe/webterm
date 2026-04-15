import { createI18n } from 'vue-i18n';
import en from './locales/en';
import zh from './locales/zh';

const STORAGE_KEY = 'webterm-language';

export type AppLocale = 'en' | 'zh';

function getDefaultLocale(): AppLocale {
  // 1. Check localStorage
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && (stored === 'en' || stored === 'zh')) {
    return stored;
  }
  // 2. Default to English
  return 'en';
}

export const i18n = createI18n({
  legacy: false, // Use Composition API
  locale: getDefaultLocale(),
  fallbackLocale: 'en',
  messages: {
    en,
    zh,
  },
});

export function setLocale(locale: AppLocale): void {
  i18n.global.locale.value = locale;
  localStorage.setItem(STORAGE_KEY, locale);
  document.documentElement.setAttribute('lang', locale);
}

export function getLocale(): AppLocale {
  return i18n.global.locale.value as AppLocale;
}

export const SUPPORTED_LOCALES: { code: AppLocale; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'zh', name: '中文' },
];
