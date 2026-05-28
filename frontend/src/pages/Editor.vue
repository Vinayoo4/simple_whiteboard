<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-900">{{ isEditing ? 'Edit Page' : 'Create Page' }}</h1>
      <div class="flex items-center gap-4">
        <span v-if="isOffline" class="text-yellow-600 text-sm flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          Offline (Draft saved locally)
        </span>
        <button @click="savePage" :disabled="isSaving" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 font-medium">
          {{ isSaving ? 'Saving...' : 'Save Page' }}
        </button>
      </div>
    </div>

    <div class="space-y-6">
      <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="block text-sm font-medium text-gray-700">Title</label>
            <input v-model="page.title" type="text" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-indigo-500 focus:ring-indigo-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Slug</label>
            <input v-model="page.slug" type="text" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-indigo-500 focus:ring-indigo-500" placeholder="my-awesome-project" />
          </div>
          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-gray-700">Description</label>
            <textarea v-model="page.description" rows="2" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-indigo-500 focus:ring-indigo-500"></textarea>
          </div>
          <div class="sm:col-span-2 flex items-center gap-2">
             <input v-model="page.isPublished" type="checkbox" id="published" class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500">
             <label for="published" class="text-sm font-medium text-gray-700">Published</label>
          </div>
        </div>
      </div>

      <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Blocks</h3>

        <div class="space-y-4 mb-6">
          <div v-for="(block, index) in page.blocks" :key="block.id" class="p-4 border border-gray-200 rounded-md bg-gray-50 relative">
            <div class="absolute top-2 right-2 flex gap-2">
              <button @click="moveBlockUp(index)" :disabled="index === 0" class="text-gray-400 hover:text-gray-600">↑</button>
              <button @click="moveBlockDown(index)" :disabled="page.blocks ? index === page.blocks.length - 1 : true" class="text-gray-400 hover:text-gray-600">↓</button>
              <button @click="removeBlock(index)" class="text-red-400 hover:text-red-600">×</button>
            </div>

            <h4 class="font-medium text-gray-900 mb-3 uppercase text-xs tracking-wider">{{ block.type }} block</h4>

            <div v-if="block.type === 'hero'" class="space-y-3">
              <input v-model="block.data.headline" type="text" placeholder="Headline" class="w-full p-2 border rounded" />
              <textarea v-model="block.data.subheadline" placeholder="Subheadline" class="w-full p-2 border rounded"></textarea>
              <input v-model="block.data.ctaText" type="text" placeholder="CTA Button Text" class="w-full p-2 border rounded" />
            </div>

            <div v-if="block.type === 'features'" class="space-y-3">
              <input v-model="block.data.title" type="text" placeholder="Features Title" class="w-full p-2 border rounded" />
              <div v-for="(_, i) in block.data.items" :key="i" class="flex gap-2">
                 <input v-model="block.data.items[i]" type="text" placeholder="Feature item" class="w-full p-2 border rounded text-sm" />
                 <button @click="block.data.items.splice(i,1)" class="text-red-500 px-2">&times;</button>
              </div>
              <button @click="block.data.items.push('')" class="text-sm text-indigo-600">+ Add Item</button>
            </div>
          </div>

          <div v-if="!page.blocks || page.blocks?.length || 0 === 0" class="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-md">
            No blocks added yet. Choose a template below.
          </div>
        </div>

        <div class="pt-4 border-t border-gray-200">
          <h4 class="text-sm font-medium text-gray-700 mb-2">Add a block:</h4>
          <div class="flex gap-2 flex-wrap">
            <button v-for="t in templates" :key="t.id" @click="addBlock(t)" class="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 border border-gray-300">
              + {{ t.name }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import { useOfflineDraft } from '../composables/useOfflineDraft';
import { PageConfig, BlockTemplate } from '../../../shared/types/index';
import { generateId } from '../../../shared/utils/index';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const pageId = route.params.id as string | undefined;
const isEditing = !!pageId;

const { isOffline, saveDraft, loadDraft, clearDraft } = useOfflineDraft(pageId);

const page = ref<Partial<PageConfig>>({
  title: '',
  slug: '',
  description: '',
  blocks: [],
  isPublished: false
});

const templates = ref<BlockTemplate[]>([]);
const isSaving = ref(false);

const loadData = async () => {
  // Load templates
  try {
    const tRes = await fetch('/api/templates');
    if (tRes.ok) templates.value = await tRes.json();
  } catch (e) {
    // ignore
  }

  // Check for draft first
  const draft = loadDraft();
  if (draft) {
    page.value = draft;
  } else if (isEditing) {
    try {
      const res = await fetch(`/api/pages/id/${pageId}`, {
        headers: { 'Authorization': `Bearer ${authStore.token}` }
      });
      if (res.ok) {
        page.value = await res.json();
      } else {
         const data = await res.json();
         alert(data.error || 'Failed to load page');
         router.push('/dashboard');
      }
    } catch (e) {
      // ignore
    }
  }
};

onMounted(loadData);

watch(page, (newVal) => {
  saveDraft(newVal);
}, { deep: true });

const addBlock = (t: BlockTemplate) => {
  page.value.blocks = page.value.blocks || [];
  page.value.blocks.push({
    id: generateId(),
    type: t.type,
    data: JSON.parse(JSON.stringify(t.defaultData)),
    order: page.value.blocks.length
  });
};

const removeBlock = (index: number) => {
  page.value.blocks?.splice(index, 1);
};

const moveBlockUp = (index: number) => {
  if (index > 0 && page.value.blocks) {
    const temp = page.value.blocks[index];
    page.value.blocks[index] = page.value.blocks[index - 1];
    page.value.blocks[index - 1] = temp;
  }
};

const moveBlockDown = (index: number) => {
  if (page.value.blocks && index < page.value.blocks.length - 1) {
    const temp = page.value.blocks[index];
    page.value.blocks[index] = page.value.blocks[index + 1];
    page.value.blocks[index + 1] = temp;
  }
};

const savePage = async () => {
  if (isOffline.value) {
    alert('You are offline. Draft saved locally. Please connect to internet to save permanently.');
    return;
  }

  isSaving.value = true;
  try {
    const url = isEditing ? `/api/pages/${pageId}` : '/api/pages';
    const method = isEditing ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify(page.value)
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to save');
    }

    clearDraft();
    router.push('/dashboard');
  } catch (error: any) {
    alert(error.message);
  } finally {
    isSaving.value = false;
  }
};
</script>
