<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth.store';

const auth = useAuthStore();

onMounted(async () => {
  if (auth.isAuthenticated) {
    await auth.fetchUser();
  }
});
</script>
