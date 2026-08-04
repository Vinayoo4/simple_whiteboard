<template>
  <div v-if="showInstallPrompt" class="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200 z-50 flex items-center gap-4">
    <div>
      <h3 class="font-bold text-gray-900">Install Business OS</h3>
      <p class="text-sm text-gray-600">Install for a better experience</p>
    </div>
    <div class="flex gap-2">
      <button @click="dismiss" class="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md">Not now</button>
      <button @click="install" class="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Install</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const showInstallPrompt = ref(false);
let deferredPrompt: any = null;

onMounted(() => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallPrompt.value = true;
  });
});

const dismiss = () => {
  showInstallPrompt.value = false;
};

const install = async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') {
    showInstallPrompt.value = false;
  }
  deferredPrompt = null;
};
</script>
