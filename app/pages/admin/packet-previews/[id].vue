<script setup>
import { ref, computed } from 'vue'

definePageMeta({
  layout: 'admin'
})

const route = useRoute()
const router = useRouter()
const packetId = route.params.id

const { $api } = useNuxtApp()
const search = ref('')

// ✅ Fetch daftar Question Bank di dalam paket ini
const { data: response, pending } = await useAsyncData(`preview-packet-items-${packetId}`, () =>
  $api(`/api/v1/packet-items/by-packet-id/${packetId}`)
)

const packetItems = computed(() => response.value?.data || [])

// ✅ Filter pencarian
const filteredItems = computed(() => {
  if (!search.value) return packetItems.value
  
  const searchLower = search.value.toLowerCase()
  return packetItems.value.filter(item => 
    item.title?.toLowerCase().includes(searchLower) ||
    item.position?.toLowerCase().includes(searchLower) ||
    item.subCategoryTitle?.toLowerCase().includes(searchLower)
  )
})

const goBack = () => {
  router.push('/admin/packet-previews')
}
</script>

<template>
  <main class="min-h-screen bg-tryout-bg p-6 md:p-8 font-sans transition-colors duration-300">
    
    <button @click="goBack" class="flex items-center gap-2 text-sm font-bold text-tryout-subtle hover:text-tryout-primary mb-6 transition-colors group">
      <span class="p-1.5 rounded-lg bg-tryout-surface border border-tryout-border group-hover:border-tryout-primary/50 group-hover:bg-tryout-primary/10 transition-colors">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
      </span>
      Kembali ke Daftar Paket
    </button>

    <div class="mb-8">
      <h1 class="text-3xl font-black text-tryout-text tracking-tight">Pilih Question Bank</h1>
      <p class="text-tryout-muted font-medium mt-2 flex items-center gap-2">
        Melihat isi dari Paket ID: <span class="bg-tryout-hover text-tryout-text px-2 py-0.5 rounded font-bold text-xs">{{ packetId }}</span>
      </p>
    </div>

    <div class="mb-8 max-w-md">
      <div class="relative group">
        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg class="w-5 h-5 text-tryout-subtle group-focus-within:text-tryout-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <input
          v-model="search"
          type="text"
          placeholder="Cari judul soal, formasi, sub-kategori..."
          class="w-full bg-tryout-surface border border-tryout-border rounded-2xl py-3.5 pl-11 pr-10 text-sm font-medium text-tryout-text shadow-sm focus:ring-2 focus:ring-tryout-primary focus:border-tryout-primary outline-none transition-all"
        />
        <button 
          v-if="search" 
          @click="search = ''"
          class="absolute inset-y-0 right-0 pr-4 flex items-center text-tryout-subtle hover:text-tryout-muted transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <p v-if="search" class="text-xs font-bold text-tryout-primary mt-2 ml-2">
        Ditemukan {{ filteredItems.length }} hasil
      </p>
    </div>

    <div v-if="pending" class="flex justify-center items-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-tryout-border border-t-tryout-primary"></div>
    </div>

    <div v-else-if="filteredItems.length === 0" class="text-center py-20 bg-tryout-surface rounded-3xl border border-dashed border-tryout-border">
      <div class="w-16 h-16 bg-tryout-hover rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-tryout-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
      </div>
      <h3 class="text-lg font-bold text-tryout-text">Belum ada Question Bank</h3>
      <p class="text-tryout-muted text-sm mt-1">Paket ini kosong atau tidak ditemukan dengan kata kunci pencarian.</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        v-for="item in filteredItems" 
        :key="item.id"
        class="bg-tryout-surface rounded-3xl p-6 border border-tryout-border shadow-sm hover:shadow-md hover:border-tryout-primary/50 transition-all duration-300 flex flex-col h-full group"
      >
        <div class="flex justify-between items-start mb-4">
          <span class="px-3 py-1 bg-tryout-primary/10 text-tryout-primary rounded-lg text-[10px] font-black uppercase tracking-wider border border-tryout-primary/20 shadow-sm">
            {{ item.subCategoryTitle || 'General' }}
          </span>
          <span class="text-tryout-subtle text-xs font-bold">QB-{{ item.questionBankId }}</span>
        </div>

        <h3 class="text-lg font-extrabold text-tryout-text mb-3 leading-snug line-clamp-2">
          {{ item.title }}
        </h3>
        
        <div class="text-sm font-semibold text-tryout-muted mb-6 flex-1 flex flex-col gap-2">
          <span class="flex items-center gap-2">
            <svg class="w-4 h-4 text-tryout-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            {{ item.position || 'Umum' }}
          </span>
        </div>

        <NuxtLink 
          :to="`/admin/preview/${item.questionBankId}`"
          class="w-full py-3.5 bg-tryout-hover/50 border border-tryout-border text-tryout-text rounded-2xl font-extrabold flex items-center justify-center gap-2 group-hover:bg-tryout-primary group-hover:text-white group-hover:border-tryout-primary transition-all shadow-sm group-hover:shadow-md"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          Mulai Preview
        </NuxtLink>
      </div>
    </div>

  </main>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
.font-sans { font-family: 'Plus Jakarta Sans', sans-serif; }
</style>