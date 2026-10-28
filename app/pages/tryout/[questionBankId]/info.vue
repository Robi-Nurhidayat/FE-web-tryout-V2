<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNuxtApp, useAsyncData } from '#imports'

definePageMeta({
  layout: 'default'
})

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()
const questionBankId = route.params.questionBankId

// 1. Fetch Detail Tryout Utama
const { data: tryoutResponse, pending: loadingTryout } = await useAsyncData(
  `tryout-detail-${questionBankId}`,
  () => $api(`/api/v1/question-banks/${questionBankId}`, { method: 'GET' })
)

const tryoutDetail = computed(() => tryoutResponse.value?.data || null)
const nextBankId = computed(() => tryoutDetail.value?.nextQuestionBankId || null)

// 2. Fetch Riwayat Sesi Utama
const { data: historyResponse, pending: loadingHistory, refresh: refreshHistory } = await useAsyncData(
  `history-${questionBankId}`,
  () => $api(`/api/v1/user-answers/questions-bank/${questionBankId}`, { method: 'GET' }),
  { server: false, lazy: true }
)

// 3. Fetch Riwayat Sesi Lanjutan (Jika Ada)
const { data: historyNextResponse, pending: loadingNextHistory, refresh: refreshNextHistory } = await useAsyncData(
  `history-next-${questionBankId}`,
  () => {
    if (!nextBankId.value) return Promise.resolve(null)
    return $api(`/api/v1/user-answers/questions-bank/${nextBankId.value}`, { method: 'GET' })
  },
  { server: false, lazy: true, watch: [nextBankId] }
)

// 4. Fetch Jumlah Soal Utama
const { data: questionsResponse, pending: loadingQuestions } = await useAsyncData(
  `questions-count-${questionBankId}`,
  () => $api(`/api/v1/questions-banks/${questionBankId}/question-items`, { method: 'GET' }),
  { server: false, lazy: true }
)

const totalQuestions = computed(() => questionsResponse.value?.data?.length || 0)

// ✅ LOGIKA BARU: MENJAHIT (PAIRING) RIWAYAT BERDASARKAN PERCOBAAN
const pairedHistories = computed(() => {
  const mainList = historyResponse.value?.data || []
  const nextList = historyNextResponse.value?.data || []

  const mainMap = {}
  mainList.forEach(item => {
    if (item?.attemptNumber && item?.userAnswerId) {
      mainMap[item.attemptNumber] = item.userAnswerId
    }
  })

  const nextMap = {}
  nextList.forEach(item => {
    if (item?.attemptNumber && item?.userAnswerId) {
      nextMap[item.attemptNumber] = item.userAnswerId
    }
  })

  const allAttempts = [
    ...new Set([
      ...Object.keys(mainMap).map(Number),
      ...Object.keys(nextMap).map(Number)
    ])
  ]
    .filter(attempt => !Number.isNaN(attempt))
    .sort((a, b) => b - a)

  return allAttempts.map(attempt => ({
    attemptNumber: attempt,
    mainId: mainMap[attempt] || null,
    nextId: nextMap[attempt] || null
  }))
})

const isAnyHistoryLoading = computed(() => loadingHistory.value || loadingNextHistory.value)

const refreshAllHistory = () => {
  refreshHistory()
  if (nextBankId.value) refreshNextHistory()
}

const goBack = () => router.back()

// ── Data Statis ──
const tips = [
  'Pastikan koneksi internet Anda stabil selama pengerjaan tryout untuk menghindari data tidak tersimpan.',
  'Sangat disarankan menggunakan browser Chrome, Firefox, atau Edge versi terbaru.',
  'Kerjakan dengan fokus. Jangan menutup tab atau memuat ulang halaman saat ujian berlangsung.',
  'Waktu pengerjaan akan langsung berjalan mundur saat Anda menekan tombol "Mulai Ujian Sekarang".',
]

const techReqs = [
  { icon: 'M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0', label: 'Koneksi Internet', value: 'Minimal 1 Mbps' },
  { icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9', label: 'Browser', value: 'Chrome / Firefox' },
  { icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', label: 'Perangkat', value: 'PC / Laptop / Tablet' },
  { icon: 'M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4', label: 'Resolusi Layar', value: 'Min. 1024x768' },
]

// // Tambah sementara untuk debug
// watch([historyResponse, historyNextResponse], () => {
//   console.log('mainArr:', [...(historyResponse.value?.data || [])].reverse())
//   console.log('nextArr:', [...(historyNextResponse.value?.data || [])].reverse())
//   console.log('pairedHistories:', pairedHistories.value)
// })

// watch([tryoutDetail, historyNextResponse], () => {
//   console.log('tryoutDetail:', tryoutDetail.value)
//   console.log('nextBankId:', nextBankId.value)
//   console.log('historyNextResponse raw:', historyNextResponse.value)
// })
</script>

<template>
  <div class="w-full pb-12">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

      <div class="pt-8 mb-6">
        <NuxtLink :to="`/my-packets`"
          class="group flex items-center gap-2 text-sm font-bold transition-colors text-tryout-muted hover:text-tryout-text">
          <span
            class="p-1.5 rounded-lg transition-all bg-tryout-surface border border-tryout-border group-hover:bg-tryout-hover">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </span>
          Kembali ke Daftar Paket
        </NuxtLink>
      </div>

      <div v-if="loadingTryout"
        class="text-center py-20 rounded-2xl shadow-sm bg-tryout-surface border border-tryout-border">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-tryout-accent mx-auto"></div>
        <p class="mt-4 font-medium text-tryout-muted">Memuat persiapan tryout...</p>
      </div>

      <div v-else>

        <div class="rounded-2xl overflow-hidden mb-8 relative bg-tryout-navbar">
          <div class="absolute top-0 left-0 right-0 h-[3px] bg-tryout-accent"></div>
          <div
            class="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none">
          </div>
          <div class="p-8 md:p-10 text-white relative z-10">
            <h1 class="text-3xl md:text-4xl font-extrabold mb-3 tracking-tight">
              {{ tryoutDetail?.title || 'Persiapan Tryout' }}
            </h1>
            <p class="text-lg font-medium max-w-2xl text-white/70">
              {{ tryoutDetail?.description || 'Pastikan Anda dalam keadaan siap dan fokus sebelum memulai pengerjaan.'
              }}
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

          <div class="lg:col-span-2 space-y-6">

            <div class="rounded-2xl p-6 md:p-8 shadow-sm bg-tryout-surface border border-tryout-border">
              <h2 class="text-xl font-bold mb-6 flex items-center gap-3 text-tryout-text">
                <span class="p-2 rounded-lg bg-tryout-primary/10">
                  <svg class="w-6 h-6 text-tryout-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                Petunjuk Pengerjaan
              </h2>
              <div class="space-y-2">
                <div v-for="(tip, i) in tips" :key="i"
                  class="flex items-start gap-4 p-3 rounded-xl transition-colors hover:bg-tryout-hover">
                  <div
                    class="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold bg-tryout-primary/10 text-tryout-primary">
                    {{ i + 1 }}
                  </div>
                  <p class="pt-0.5 leading-relaxed text-tryout-muted">{{ tip }}</p>
                </div>
              </div>
            </div>

            <div class="rounded-2xl p-6 md:p-8 shadow-sm bg-tryout-surface border border-tryout-border">
              <h2 class="text-xl font-bold mb-6 flex items-center gap-3 text-tryout-text">
                <span class="p-2 rounded-lg bg-emerald-500/10">
                  <svg class="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </span>
                Persyaratan Teknis Optimal
              </h2>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div v-for="req in techReqs" :key="req.label"
                  class="flex items-center gap-4 p-4 rounded-xl bg-tryout-hover border border-tryout-border">
                  <svg class="w-8 h-8 flex-shrink-0 text-emerald-500" fill="none" stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="req.icon" />
                  </svg>
                  <div>
                    <p class="text-[10px] font-bold uppercase tracking-widest text-tryout-subtle">{{ req.label }}</p>
                    <p class="font-extrabold text-tryout-text">{{ req.value }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="lg:col-span-1">
            <div class="rounded-2xl p-6 sticky top-24 shadow-sm bg-tryout-surface border border-tryout-border">
              <div class="text-center mb-6">
                <div class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 bg-tryout-primary/10">
                  <svg class="w-8 h-8 text-tryout-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 class="text-xl font-bold text-tryout-text">Informasi Ujian</h3>
              </div>

              <div class="space-y-3 mb-7 p-4 rounded-xl bg-tryout-hover border border-tryout-border">
                <div class="flex items-center justify-between pb-3 border-b border-tryout-divider">
                  <span class="text-sm font-medium text-tryout-muted">Jumlah Soal</span>
                  <span
                    class="font-bold text-sm px-3 py-1 rounded-md bg-tryout-surface border border-tryout-border text-tryout-text">
                    <span v-if="loadingQuestions"
                      class="text-tryout-primary text-xs italic font-normal">Menghitung...</span>
                    <span v-else>{{ totalQuestions }} Soal</span>
                  </span>
                </div>
                <div class="flex items-center justify-between pb-3 border-b border-tryout-divider">
                  <span class="text-sm font-medium text-tryout-muted">Durasi Waktu</span>
                  <span
                    class="font-extrabold text-sm px-3 py-1 rounded-md bg-tryout-primary/10 border border-tryout-primary/20 text-tryout-primary">
                    {{ tryoutDetail?.duration || '-' }} Menit
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-tryout-muted">Batas Percobaan</span>
                  <span
                    class="font-bold text-sm px-3 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                    Tak Terbatas
                  </span>
                </div>
              </div>

              <NuxtLink :to="`/tryout/${questionBankId}/start-exam`" class="w-full font-extrabold py-4 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2
                       bg-tryout-accent hover:opacity-90 text-white shadow-lg hover:-translate-y-0.5">
                Mulai Ujian Sekarang
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </NuxtLink>

              <p class="text-xs text-center mt-4 flex items-center justify-center gap-1 font-medium text-tryout-subtle">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Waktu berjalan saat tombol ditekan
              </p>
            </div>
          </div>
        </div>

        <div class="rounded-2xl p-6 md:p-8 shadow-sm bg-tryout-surface border border-tryout-border">

          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <h2 class="text-xl font-bold flex items-center gap-3 text-tryout-text">
              <span class="p-2 rounded-lg bg-tryout-accent/10">
                <svg class="w-6 h-6 text-tryout-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </span>
              Riwayat Pengerjaan Anda
            </h2>

            <button @click="refreshAllHistory" :disabled="isAnyHistoryLoading" class="text-sm px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50
                     bg-tryout-hover border border-tryout-border text-tryout-muted
                     hover:bg-tryout-primary/10 hover:text-tryout-primary hover:border-tryout-primary/30">
              <svg :class="['w-4 h-4', isAnyHistoryLoading ? 'animate-spin' : '']" fill="none" stroke="currentColor"
                viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {{ isAnyHistoryLoading ? 'Menyegarkan...' : 'Refresh Riwayat' }}
            </button>
          </div>

          <div v-if="pairedHistories.length === 0"
            class="text-center py-12 rounded-xl border-2 border-dashed border-tryout-border bg-tryout-hover">
            <div class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 bg-tryout-skeleton">
              <svg class="h-8 w-8 text-tryout-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 class="text-lg font-extrabold text-tryout-text">Belum ada riwayat pengerjaan</h3>
            <p class="text-sm font-medium mt-1 text-tryout-muted">Mulai tryout sekarang untuk melihat hasil ujian Anda
              di sini.</p>
          </div>

          <div v-else class="space-y-5">
            <div v-for="history in pairedHistories" :key="history.attemptNumber"
              class="p-5 md:p-6 rounded-2xl bg-tryout-surface border border-tryout-border shadow-sm hover:shadow-md transition-shadow">

              <div class="flex items-center gap-4 mb-4 pb-4 border-b border-tryout-divider">
                <div
                  class="w-12 h-12 rounded-full flex items-center justify-center font-extrabold text-lg bg-tryout-primary/10 text-tryout-primary border border-tryout-primary/20">
                  {{ history.attemptNumber }}
                </div>
                <div>
                  <h3 class="font-extrabold text-lg text-tryout-text">Percobaan ke-{{ history.attemptNumber }}</h3>
                  <p class="text-xs font-bold text-tryout-subtle">Rincian evaluasi sesi pengerjaan</p>
                </div>
              </div>

              <div class="space-y-3">
                <div
                  class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition-all"
                  :class="(nextBankId && !history.nextId) ? 'bg-red-500/5 border-red-500/20' : 'bg-tryout-hover border-tryout-border'">

                  <div>
                    <p class="font-bold text-sm"
                      :class="(nextBankId && !history.nextId) ? 'text-red-600 dark:text-red-400' : 'text-tryout-text'">
                      {{ nextBankId ? '📚 Ujian Lengkap (Utama + Lanjutan)' : '📚 Ujian Tryout' }}
                    </p>
                    <p class="text-xs font-medium mt-1"
                      :class="(nextBankId && !history.nextId) ? 'text-red-500' : 'text-tryout-muted'">
                      {{ (nextBankId && !history.nextId) ? '⚠️ Terputus di Sesi Wawancara' : '✅ Selesai Dikerjakan' }}
                    </p>
                  </div>

                  <NuxtLink v-if="history.mainId" :to="{
                    path: `/pembahasan/${history.mainId}`,
                    query: history.nextId ? { nextId: history.nextId } : {}
                  }" class="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all bg-tryout-surface border border-tryout-border text-tryout-text hover:bg-tryout-primary hover:border-tryout-primary hover:text-white shadow-sm">
                    {{ (nextBankId && !history.nextId) ? 'Lihat Hasil Sesi Utama' : 'Lihat Hasil & Pembahasan' }}
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </NuxtLink>

                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  </div>
</template>