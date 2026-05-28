<template>
  <div v-if="needRefresh" class="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200 z-50 flex flex-col gap-2">
    <div>
      <h3 class="font-bold text-gray-900">Update Available</h3>
      <p class="text-sm text-gray-600">A new version of FlashFocus is available.</p>
    </div>
    <div class="flex gap-2 justify-end mt-2">
      <button @click="close" class="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md">Dismiss</button>
      <button @click="updateServiceWorker" class="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Update Now</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const needRefresh = ref(false);
let registration: ServiceWorkerRegistration | null = null;

onMounted(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });

    navigator.serviceWorker.getRegistration().then(reg => {
      if (!reg) return;
      registration = reg;

      if (reg.waiting) {
        needRefresh.value = true;
      }

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              needRefresh.value = true;
            }
          });
        }
      });
    });
  }
});

const close = () => {
  needRefresh.value = false;
};

const updateServiceWorker = () => {
  if (registration && registration.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
  needRefresh.value = false;
};
</script>
