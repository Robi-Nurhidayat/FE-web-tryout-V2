<script setup>
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNuxtApp, useAsyncData } from '#imports'

definePageMeta({
  layout: 'default'
})

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()

const packetId = route.params.id

const {
  data: response,
  pending,
  error,
  refresh
} = await useAsyncData(
  `packet-items-${packetId}`,
  () => $api(
    `/api/v1/packet-items/by-packet-id/${packetId}`,
    {
      method: 'GET'
    }
  ),
  {
    server: false,
    lazy: true
  }
)

const {
  data: packetData
} = await useAsyncData(
  `packet-info-${packetId}`,
  () => $api(
    `/api/v1/packets/${packetId}`,
    {
      method: 'GET'
    }
  ),
  {
    server: false,
    lazy: true
  }
)

const packetItems = computed(() =>
  response.value?.data || []
)

/*
 * ==========================================
 * DEBUGGING
 * ==========================================
 */
watch(
  packetItems,
  (newData) => {
    if (newData && newData.length > 0) {
      newData.forEach((item, index) => {
        // console.log(`[Item ${index + 1}] Judul:`, item.title || item.questionBank?.title)
        // console.log(`[Item ${index + 1}] isSubSession:`, item.isSubSession)
        // console.log(`[Item ${index + 1}] questionBank.isSubSession:`, item.questionBank?.isSubSession)
      })
    }
  },
  {
    immediate: true
  }
)

/*
 * ==========================================
 * FILTER ITEM TRYOUT
 * ==========================================
 */
const visiblePacketItems = computed(() => {
  return packetItems.value.filter(item => {
    const val1 = item.isSubSession
    const val2 = item.questionBank?.isSubSession

    const isTrue = (value) => {
      return value === true
        || value === 1
        || value === '1'
        || String(value).toLowerCase() === 'true'
    }

    const isSub =
      isTrue(val1)
      || isTrue(val2)

    return !isSub
  })
})

/*
 * ==========================================
 * URL GROUP SOSMED
 * ==========================================
 *
 * Fungsi ini menjaga agar link Telegram, WhatsApp,
 * Instagram, dan sosmed lain tetap aman dibuka.
 *
 * Contoh:
 * t.me/grupKamu
 * akan menjadi:
 * https://t.me/grupKamu
 *
 * Kalau sudah:
 * https://t.me/grupKamu
 * maka tidak diubah.
 */
const urlGroup = computed(() => {
  const rawUrl =
    packetData.value?.data?.urlGroup

  if (!rawUrl) {
    return null
  }

  const cleanUrl =
    String(rawUrl)
      .trim()
      .replace(/[\u200B-\u200D\uFEFF]/g, '')

  if (!cleanUrl) {
    return null
  }

  /*
   * URL tidak boleh mengandung spasi.
   * Kalau ada spasi, tombol disembunyikan agar tidak membuka link rusak.
   */
  if (/\s/.test(cleanUrl)) {
    return null
  }

  /*
   * Kalau sudah punya http:// atau https://,
   * langsung pakai apa adanya.
   */
  if (/^https?:\/\//i.test(cleanUrl)) {
    return cleanUrl
  }

  /*
   * Kalau admin hanya isi:
   * t.me/grupKamu
   * chat.whatsapp.com/xxxx
   * instagram.com/username
   *
   * Maka otomatis dibuat jadi:
   * https://...
   */
  return `https://${cleanUrl}`
})

const packetTitle = computed(() =>
  packetData.value?.data?.title || 'Detail Paket Belajar'
)

const goBack = () => {
  router.push('/my-packets')
}
</script>

<template>
  <div class="w-full pb-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="pt-8 mb-6">
        <button
          @click="goBack"
          class="group flex items-center gap-2 text-sm font-bold transition-colors
                 text-slate-500 dark:text-slate-400
                 hover:text-blue-600 dark:hover:text-white"
        >
          <span
            class="p-1.5 rounded-lg transition-all
                   bg-white dark:bg-slate-700
                   border border-slate-200 dark:border-slate-600
                   group-hover:border-blue-300 dark:group-hover:border-slate-500
                   group-hover:bg-blue-50 dark:group-hover:bg-slate-600"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </span>

          Kembali ke Daftar Paket Saya
        </button>
      </div>

      <div
        class="mb-8 p-6 md:p-8 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6
               bg-white dark:bg-slate-800/60
               border border-slate-200 dark:border-slate-700
               shadow-sm dark:shadow-none"
      >
        <div class="border-l-4 border-amber-500 pl-5">
          <h1
            class="text-2xl md:text-3xl font-extrabold mb-1.5 text-slate-800 dark:text-white"
          >
            {{ packetTitle }}
          </h1>

          <p class="text-sm font-medium text-slate-500 dark:text-slate-400">
            Persiapkan dirimu dengan mengerjakan daftar tryout di bawah ini.
          </p>
        </div>

        <a
          v-if="urlGroup"
          :href="urlGroup"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all
                 w-full md:w-auto whitespace-nowrap
                 bg-emerald-500 hover:bg-emerald-400
                 text-white shadow-md shadow-emerald-500/20
                 hover:-translate-y-0.5 hover:shadow-emerald-500/30"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
            />
          </svg>

          Gabung Grup Belajar
        </a>
      </div>

      <div
        v-if="pending"
        class="text-center py-20 rounded-2xl
               bg-white dark:bg-slate-800/60
               border border-slate-100 dark:border-slate-700
               shadow-sm dark:shadow-none"
      >
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"
        ></div>

        <p class="mt-4 font-medium text-slate-500 dark:text-slate-400">
          Memuat daftar tryout...
        </p>
      </div>

      <div
        v-else-if="error"
        class="text-center py-16 rounded-2xl
               bg-white dark:bg-slate-800/60
               border border-slate-100 dark:border-slate-700
               shadow-sm dark:shadow-none"
      >
        <div
          class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4
                 bg-red-50 dark:bg-red-900/20"
        >
          <svg
            class="h-8 w-8 text-red-500 dark:text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h3 class="text-lg font-bold text-slate-800 dark:text-white">
          Gagal memuat data
        </h3>

        <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {{ error?.data?.message || 'Terjadi kesalahan saat mengambil data.' }}
        </p>

        <button
          @click="refresh"
          class="mt-5 px-6 py-2.5 rounded-xl font-medium transition-all
                 bg-blue-500 hover:bg-blue-600 text-white shadow-md"
        >
          Coba Lagi
        </button>
      </div>

      <div
        v-else-if="visiblePacketItems.length === 0"
        class="text-center py-20 rounded-2xl
               bg-white dark:bg-slate-800/60
               border border-slate-100 dark:border-slate-700
               shadow-sm dark:shadow-none"
      >
        <div
          class="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-5
                 bg-slate-50 dark:bg-slate-700
                 border border-slate-100 dark:border-slate-600"
        >
          <svg
            class="h-12 w-12 text-slate-300 dark:text-slate-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>

        <h3 class="text-xl font-bold text-slate-800 dark:text-white">
          Tidak ada item Tryout
        </h3>

        <p class="mt-2 text-slate-500 dark:text-slate-400">
          Paket ini belum memiliki daftar tryout untuk dikerjakan.
        </p>
      </div>

      <div v-else>
        <div class="mb-6 flex items-center justify-between px-1">
          <h2
            class="text-base font-bold flex items-center gap-2 text-slate-700 dark:text-slate-200"
          >
            <svg
              class="w-5 h-5 text-blue-500 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>

            Daftar Tryout Anda
          </h2>

          <span
            class="text-sm font-bold px-4 py-1.5 rounded-full
                   bg-blue-50 dark:bg-blue-400/10
                   text-blue-700 dark:text-blue-400
                   border border-blue-100 dark:border-blue-400/20"
          >
            {{ visiblePacketItems.length }} Ujian
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="item in visiblePacketItems"
            :key="item.id"
            class="tryout-card group relative rounded-[1.4rem] overflow-hidden flex flex-col
                   border-[1.5px] transition-all duration-300 ease-spring
                   bg-white dark:bg-[#1e293b]
                   border-slate-200 dark:border-slate-700
                   hover:scale-[1.025] hover:-translate-y-1
                   hover:border-amber-400 dark:hover:border-amber-500/70
                   hover:bg-slate-50 dark:hover:bg-[#243348]
                   hover:shadow-xl dark:hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
          >
            <div
              class="relative p-6 border-b transition-colors duration-300
                     bg-[#1e3a5f] dark:bg-[#0f172a]
                     border-slate-200/10 dark:border-slate-700
                     group-hover:bg-[#1e4575] dark:group-hover:bg-[#162032]"
            >
              <div class="absolute top-0 left-0 right-0 h-[3px] bg-amber-500"></div>

              <div class="flex flex-wrap gap-2 mb-3 mt-1">
                <span
                  class="px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase
                         bg-amber-500 text-white"
                >
                  {{ item.subCategoryTitle?.toUpperCase() || 'UMUM' }}
                </span>
              </div>

              <h3 class="text-lg font-bold leading-snug text-white line-clamp-2">
                {{ item.title }}
              </h3>

              <p
                v-if="item.position"
                class="text-[10px] font-semibold tracking-widest uppercase mt-2 text-slate-400"
              >
                {{ item.position }}
              </p>
            </div>

            <div class="flex flex-col flex-1 p-5 gap-4">
              <p
                class="text-sm leading-relaxed flex-1
                       text-slate-500 dark:text-slate-400"
              >
                Silakan klik tombol di bawah untuk memulai sesi tryout ini. Pastikan koneksi internet Anda stabil.
              </p>

              <div
                class="h-px bg-slate-100 dark:bg-slate-700
                       group-hover:bg-amber-100 dark:group-hover:bg-amber-500/10
                       transition-colors"
              ></div>

              <NuxtLink
                :to="`/tryout/${item.questionBankId || item.id}/info`"
                class="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-300
                       border-[1.5px]
                       border-blue-500/30 dark:border-blue-500/25
                       bg-blue-500/6 dark:bg-blue-400/8
                       text-blue-600 dark:text-blue-400
                       group-hover:bg-blue-500 dark:group-hover:bg-blue-500
                       group-hover:border-blue-500 dark:group-hover:border-blue-500
                       group-hover:text-white dark:group-hover:text-white"
              >
                Mulai Ujian Sekarang

                <svg
                  class="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2.5"
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ease-spring {
  transition-timing-function: cubic-bezier(0.34, 1.4, 0.64, 1);
}

.tryout-card {
  transition-duration: 280ms;
}
</style>