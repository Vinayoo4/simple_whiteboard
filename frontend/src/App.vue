<template>
  <div class="min-h-screen flex flex-col bg-gray-50 text-gray-900">
    <nav class="bg-white shadow-sm sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <router-link to="/" class="flex-shrink-0 flex items-center gap-2">
              <span class="text-2xl font-black tracking-tighter text-indigo-600">FlashFocus</span>
            </router-link>
          </div>
          <div class="flex items-center gap-4">
            <router-link v-if="!authStore.isAuthenticated" to="/login" class="text-gray-600 hover:text-gray-900 font-medium">Login</router-link>
            <template v-else>
              <router-link to="/dashboard" class="text-gray-600 hover:text-gray-900 font-medium">Dashboard</router-link>
              <button @click="handleLogout" class="text-gray-600 hover:text-gray-900 font-medium">Logout</button>
            </template>
          </div>
        </div>
      </div>
    </nav>

    <main class="flex-grow">
      <router-view />
    </main>

    <InstallPrompt />
    <UpdatePrompt />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from './stores/authStore';
import InstallPrompt from './components/pwa/InstallPrompt.vue';
import UpdatePrompt from './components/pwa/UpdatePrompt.vue';
import { onMounted } from 'vue';

const router = useRouter();
const authStore = useAuthStore();

const handleLogout = () => {
  authStore.logout();
  router.push('/');
};

onMounted(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Intentionally empty to prevent console noise on fail
    });
  }
});
</script>

<style>
/* Add base styles here if not using Tailwind's main css import */
</style>
