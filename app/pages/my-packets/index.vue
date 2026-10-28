<script setup>
import { ref, computed } from 'vue'

definePageMeta({ layout: 'default' })

const { $api } = useNuxtApp()

const { data: response, pending, error, refresh } = await useAsyncData(
  'my-packets',
  () => $api('/api/v1/transactions/my', { method: 'GET' }),
  { server: false, lazy: true }
)

const search = ref('')
const myPackets = computed(() => response.value?.data || [])

const filteredPackets = computed(() => {
  if (!search.value) return myPackets.value
  const q = search.value.toLowerCase()
  return myPackets.value.filter(item => item.title?.toLowerCase().includes(q))
})
</script>

<template>
  <div class="w-full pb-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

      <!-- ── Page Header ── -->
      <div class="mb-10 pt-8 border-l-4 border-amber-500 pl-6">
        <h1 class="text-2xl md:text-3xl font-extrabold mb-1 text-slate-800 dark:text-white">
          Paket Tryout Saya
        </h1>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          Akses dan kerjakan paket tryout yang sudah menjadi milik Anda.
        </p>
      </div>

      <!-- ── Search Bar ── -->
      <div class="mb-8 max-w-md">
        <div class="relative">
          <input
            v-model="search"
            type="text"
            placeholder="Cari nama paket Anda..."
            class="w-full rounded-xl py-3 pl-11 pr-4 text-sm outline-none transition-all
                   bg-white dark:bg-slate-800/70
                   border border-slate-200 dark:border-slate-700
                   text-slate-800 dark:text-slate-100
                   placeholder:text-slate-400 dark:placeholder:text-slate-500
                   focus:border-blue-500 dark:focus:border-blue-400
                   shadow-sm dark:shadow-none"
          />
          <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500"
               fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <!-- ── Loading ── -->
      <div
        v-if="pending"
        class="text-center py-20 rounded-2xl
               bg-white dark:bg-slate-800/60
               border border-slate-100 dark:border-slate-700
               shadow-sm dark:shadow-none"
      >
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p class="mt-4 font-medium text-slate-500 dark:text-slate-400">Memuat paket Anda...</p>
      </div>

      <!-- ── Error ── -->
      <div
        v-else-if="error"
        class="text-center py-16 rounded-2xl
               bg-white dark:bg-slate-800/60
               border border-slate-100 dark:border-slate-700
               shadow-sm dark:shadow-none"
      >
        <div class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4
                    bg-red-50 dark:bg-red-900/20">
          <svg class="h-8 w-8 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 class="text-lg font-bold text-slate-800 dark:text-white">Gagal memuat data</h3>
        <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {{ error?.data?.message || 'Pastikan koneksi internet Anda stabil.' }}
        </p>
        <button
          @click="refresh"
          class="mt-5 px-6 py-2.5 rounded-xl font-medium transition-all
                 bg-blue-500 hover:bg-blue-600 text-white shadow-md"
        >
          Coba Lagi
        </button>
      </div>

      <!-- ── Empty State ── -->
      <div
        v-else-if="filteredPackets.length === 0"
        class="text-center py-20 rounded-2xl
               bg-white dark:bg-slate-800/60
               border border-slate-100 dark:border-slate-700
               shadow-sm dark:shadow-none"
      >
        <div class="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-5
                    bg-slate-50 dark:bg-slate-700
                    border border-slate-100 dark:border-slate-600">
          <svg class="h-12 w-12 text-slate-300 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h3 class="text-xl font-bold text-slate-800 dark:text-white">
          {{ search ? 'Paket tidak ditemukan' : 'Belum ada paket' }}
        </h3>
        <p class="mt-2 max-w-sm mx-auto text-slate-500 dark:text-slate-400">
          {{ search
            ? 'Coba gunakan kata kunci lain untuk mencari paket Anda.'
            : 'Anda belum membeli paket tryout apapun. Silakan beli paket untuk mulai berlatih.' }}
        </p>
        <NuxtLink
          v-if="!search"
          to="/paket"
          class="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all
                 bg-gradient-to-r from-blue-500 to-purple-600
                 hover:from-blue-600 hover:to-purple-700
                 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5"
        >
          Lihat Katalog Paket
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </NuxtLink>
      </div>

      <!-- ── Packet Grid ── -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="item in filteredPackets"
          :key="item.id"
          class="packet-card group relative rounded-[1.4rem] overflow-hidden flex flex-col
                 border-[1.5px] transition-all duration-300 ease-spring
                 bg-white dark:bg-[#1e293b]
                 border-slate-200 dark:border-slate-700
                 hover:scale-[1.025] hover:-translate-y-1
                 hover:border-amber-400 dark:hover:border-amber-500/70
                 hover:bg-slate-50 dark:hover:bg-[#243348]
                 hover:shadow-xl dark:hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
        >

          <!-- ══ Card Top — header gelap navy ══ -->
          <div
            class="relative p-6 border-b transition-colors duration-300
                   bg-[#1e3a5f] dark:bg-[#0f172a]
                   border-slate-200/10 dark:border-slate-700
                   group-hover:bg-[#1e4575] dark:group-hover:bg-[#162032]"
          >
            <!-- Amber accent line di atas -->
            <div class="absolute top-0 left-0 right-0 h-[3px] bg-amber-500"></div>

            <!-- Badge row -->
            <div class="flex flex-wrap gap-2 mb-3 mt-1">
              <span class="px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase
                           bg-amber-500 text-white">
                {{ item.category || 'SKD' }}
              </span>
              <span
                v-if="item.subCategory"
                class="px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase
                       bg-blue-400/15 text-blue-300 border border-blue-400/25"
              >
                {{ item.subCategory }}
              </span>
            </div>

            <!-- Posisi -->
            <p v-if="item.position"
               class="text-[10px] font-semibold tracking-widest uppercase mb-1.5 text-slate-400">
              {{ item.position }}
            </p>

            <!-- Judul paket -->
            <h3 class="text-lg font-bold leading-snug text-white line-clamp-2">
              {{ item.title }}
            </h3>
          </div>

          <!-- ══ Card Body ══ -->
          <div class="flex flex-col flex-1 p-5 gap-4">

            <!-- Deskripsi -->
            <p class="text-sm leading-relaxed line-clamp-3 flex-1
                      text-slate-500 dark:text-slate-400">
              {{ item.description || 'Paket latihan soal terpadu untuk persiapan ujian Anda. Berisi kumpulan tryout lengkap dengan pembahasan.' }}
            </p>

            <!-- Divider -->
            <div class="h-px bg-slate-100 dark:bg-slate-700 group-hover:bg-amber-100 dark:group-hover:bg-amber-500/10 transition-colors"></div>

            <!-- CTA Button -->
            <NuxtLink
              :to="`/my-packets/${item.id}/details`"
              class="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-300
                     border-[1.5px]
                     border-blue-500/30 dark:border-blue-500/25
                     bg-blue-500/6 dark:bg-blue-400/8
                     text-blue-600 dark:text-blue-400
                     group-hover:bg-blue-500 dark:group-hover:bg-blue-500
                     group-hover:border-blue-500 dark:group-hover:border-blue-500
                     group-hover:text-white dark:group-hover:text-white"
            >
              Buka Paket Belajar
              <svg class="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                   fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                  d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </NuxtLink>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* Smooth spring-like hover */
.ease-spring {
  transition-timing-function: cubic-bezier(0.34, 1.4, 0.64, 1);
}

.packet-card {
  /* Pastikan transition duration konsisten */
  transition-duration: 280ms;
}
</style>