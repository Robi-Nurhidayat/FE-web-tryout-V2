<script setup>
import { ref, computed } from 'vue'

definePageMeta({
  layout: 'admin'
})

const { $api } = useNuxtApp()
const search = ref('')

// ✅ Fetch semua packets
const { data: response, pending } = await useAsyncData('preview-packets', () =>
  $api('/api/v1/packets')
)

const packets = computed(() => response.value?.data || [])

// ✅ Filter pencarian
const filteredPackets = computed(() => {
  if (!search.value) return packets.value
  
  const searchLower = search.value.toLowerCase()
  return packets.value.filter(packet => 
    packet.title?.toLowerCase().includes(searchLower) ||
    packet.category?.toLowerCase().includes(searchLower) ||
    packet.position?.toLowerCase().includes(searchLower)
  )
})
</script>

<template>
  <main class="min-h-screen bg-tryout-bg p-6 md:p-8 font-sans transition-colors duration-300">
    
    <div class="mb-8">
      <h1 class="text-3xl font-black text-tryout-text tracking-tight">Preview Bank Soal</h1>
      <p class="text-tryout-muted font-medium mt-2">Pilih paket ujian yang ingin Anda tinjau tampilannya.</p>
    </div>

    <div class="mb-8 max-w-md">
      <div class="relative group">
        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg class="w-5 h-5 text-tryout-subtle group-focus-within:text-tryout-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <input
          v-model="search"
          type="text"
          placeholder="Cari nama paket, kategori, formasi..."
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
        Ditemukan {{ filteredPackets.length }} hasil untuk "{{ search }}"
      </p>
    </div>

    <div v-if="pending" class="flex justify-center items-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-tryout-border border-t-tryout-primary"></div>
    </div>

    <div v-else-if="filteredPackets.length === 0" class="text-center py-20 bg-tryout-surface rounded-3xl border border-dashed border-tryout-border">
      <div class="w-16 h-16 bg-tryout-hover rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-tryout-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
      </div>
      <h3 class="text-lg font-bold text-tryout-text">Tidak ada paket ditemukan</h3>
      <p class="text-tryout-muted text-sm mt-1">Coba gunakan kata kunci pencarian yang lain.</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <NuxtLink 
        v-for="packet in filteredPackets" 
        :key="packet.id"
        :to="`/admin/packet-previews/${packet.id}`"
        class="group bg-tryout-surface rounded-3xl p-6 border border-tryout-border shadow-sm hover:shadow-md hover:border-tryout-primary/50 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full cursor-pointer"
      >
        <div class="flex justify-between items-start mb-4 gap-2">
          <span class="px-3 py-1.5 bg-tryout-primary/10 text-tryout-primary rounded-lg text-xs font-black uppercase tracking-wider border border-tryout-primary/20 shadow-sm">
            {{ packet.category }}
          </span>
          <span class="text-tryout-subtle text-xs font-extrabold bg-tryout-hover px-2 py-1 rounded-md">ID: {{ packet.id }}</span>
        </div>

        <h3 class="text-xl font-black text-tryout-text mb-2 group-hover:text-tryout-primary transition-colors line-clamp-2">
          {{ packet.title }}
        </h3>
        
        <p class="text-sm font-semibold text-tryout-muted mb-6 flex-1">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-tryout-hover text-tryout-text border border-tryout-border">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            {{ packet.position || 'Semua Formasi' }}
          </span>
        </p>

        <div class="mt-auto pt-4 border-t border-tryout-divider flex items-center justify-between">
          <div class="text-xs font-bold text-tryout-subtle uppercase tracking-widest">
            Lihat Isi Paket
          </div>
          <div class="w-8 h-8 rounded-full bg-tryout-primary/10 flex items-center justify-center group-hover:bg-tryout-primary transition-colors">
            <svg class="w-4 h-4 text-tryout-primary group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7" /></svg>
          </div>
        </div>
      </NuxtLink>
    </div>

  </main>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
.font-sans { font-family: 'Plus Jakarta Sans', sans-serif; }
</style>