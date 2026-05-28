<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Your Pages</h1>
      <router-link to="/editor" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 font-medium shadow-sm">
        Create New Page
      </router-link>
    </div>

    <div v-if="loading" class="text-gray-500 text-center py-10">Loading...</div>
    <div v-else-if="pages.length === 0" class="text-gray-500 text-center py-10">
      You haven't created any pages yet.
    </div>
    <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="page in pages" :key="page.id" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col hover:shadow-md transition-shadow">
        <h3 class="text-lg font-semibold text-gray-900 mb-2 truncate">{{ page.title || 'Untitled Page' }}</h3>
        <p class="text-sm text-gray-500 mb-4 truncate">{{ page.description || 'No description' }}</p>
        <div class="mt-auto flex justify-between items-center text-sm">
          <span class="text-gray-400 text-xs">Views: {{ page.viewCount }}</span>
          <div class="flex gap-2">
            <router-link :to="`/p/${page.slug}`" target="_blank" class="text-indigo-600 hover:text-indigo-800 font-medium">View</router-link>
            <router-link :to="`/editor/${page.id}`" class="text-gray-600 hover:text-gray-900 font-medium">Edit</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/authStore';
import { PageConfig } from '../../../shared/types/index';

const pages = ref<PageConfig[]>([]);
const loading = ref(true);
const authStore = useAuthStore();

onMounted(async () => {
  try {
    const res = await fetch('/api/pages', {
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    });
    if (res.ok) {
      pages.value = await res.json();
    }
  } catch (error) {
  } finally {
    loading.value = false;
  }
});
</script>
