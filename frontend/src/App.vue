<template>
  <div class="min-h-screen flex flex-col bg-gray-50 text-gray-900">
    <nav class="bg-white shadow-sm sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <router-link to="/insights" class="flex-shrink-0 flex items-center gap-2">
              <span class="text-lg font-black tracking-tighter text-indigo-600">SALTEDHASH</span>
              <span class="text-sm font-semibold text-gray-400 hidden sm:inline">Business OS</span>
            </router-link>
          </div>
          <div class="flex items-center gap-4">
            <router-link to="/expenses" class="text-gray-600 hover:text-gray-900 font-medium">Expenses</router-link>
            <router-link to="/insights" class="text-gray-600 hover:text-gray-900 font-medium">Insights</router-link>
          </div>
        </div>
      </div>
    </nav>

    <main class="flex-grow">
      <router-view />
    </main>

    <InstallPrompt />
  </div>
</template>

<script setup lang="ts">
import InstallPrompt from './components/pwa/InstallPrompt.vue';
import { onMounted } from 'vue';
import { registerServiceWorker } from './pwa/register';

onMounted(() => {
  registerServiceWorker();
});
</script>
