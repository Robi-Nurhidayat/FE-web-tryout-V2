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

const currentBankId = route.params.questionBankId

const { data: qbResponse, pending } = await useAsyncData(
  `transition-qb-${currentBankId}`,
  () => $api(`/api/v1/question-banks/${currentBankId}`, { method: 'GET' }),
  { server: false }
)

const currentTryout = computed(() => qbResponse.value?.data || null)
const nextBankId = computed(() => currentTryout.value?.nextQuestionBankId || null)

const mainUserAnswerId = computed(() => {
  if (!process.client) return null
  return sessionStorage.getItem('active_main_user_answer_id')
})

const hasNextSession = computed(() => !!nextBankId.value && !!mainUserAnswerId.value)

const buttonLabel = computed(() => {
  if (pending.value) return 'Memuat sesi berikutnya...'
  if (!nextBankId.value) return 'Kembali ke Paket Saya'
  if (!mainUserAnswerId.value) return 'Mulai dari halaman paket'
  return 'Mulai Sesi Berikutnya'
})

const startNextSession = () => {
  if (nextBankId.value && mainUserAnswerId.value) {
    window.location.href = `/tryout/${nextBankId.value}/start-exam?parentUserAnswerId=${encodeURIComponent(mainUserAnswerId.value)}`
    return
  }

  router.push('/my-packets')
}
</script>

<template>
  <main class="min-h-screen flex items-center justify-center px-4 py-10 bg-tryout-bg font-sans">
    <section class="w-full max-w-xl">
      <div class="rounded-3xl overflow-hidden bg-tryout-surface border border-tryout-border shadow-xl">

        <div class="relative p-8 md:p-10 bg-tryout-navbar text-white overflow-hidden">
          <div class="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
          <div class="absolute -bottom-24 -left-24 w-52 h-52 rounded-full bg-tryout-accent/20 blur-3xl pointer-events-none"></div>

          <div class="relative z-10">
            <div class="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-white/10 border border-white/15 shadow-inner">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>

            <p class="text-xs font-bold uppercase tracking-[0.25em] text-white/60 mb-3">
              Sesi Berikutnya
            </p>

            <h1 class="text-3xl md:text-4xl font-black tracking-tight mb-4">
              Lanjutkan Ujian
            </h1>

            <p class="text-sm md:text-base leading-relaxed text-white/75 max-w-md">
              Sesi sebelumnya sudah selesai. Lanjutkan ke sesi berikutnya saat Anda sudah siap.
            </p>
          </div>
        </div>

        <div class="p-7 md:p-8 space-y-6">

          <div class="rounded-2xl p-5 bg-tryout-hover border border-tryout-border">
            <div class="flex items-start gap-4">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-tryout-primary/10 text-tryout-primary">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>

              <div>
                <h2 class="font-extrabold text-tryout-text mb-1">
                  Waktu belum berjalan
                </h2>
                <p class="text-sm leading-relaxed text-tryout-muted">
                  Timer sesi berikutnya baru dimulai setelah Anda menekan tombol mulai.
                </p>
              </div>
            </div>
          </div>

          <div class="rounded-2xl p-5 border border-tryout-border bg-tryout-surface">
            <div class="flex items-start gap-4">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-emerald-500/10 text-emerald-500">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>

              <div>
                <h2 class="font-extrabold text-tryout-text mb-1">
                  Jawaban sesi sebelumnya sudah dikirim
                </h2>
                <p class="text-sm leading-relaxed text-tryout-muted">
                  Anda dapat melanjutkan tanpa mengulang sesi yang sudah selesai.
                </p>
              </div>
            </div>
          </div>

          <div
            v-if="!pending && nextBankId && !mainUserAnswerId"
            class="rounded-2xl p-5 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30"
          >
            <div class="flex items-start gap-4">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-red-100 dark:bg-red-800/30 text-red-600 dark:text-red-400">
                ⚠️
              </div>

              <div>
                <h2 class="font-extrabold text-red-800 dark:text-red-300 mb-1">
                  Sesi utama tidak ditemukan
                </h2>
                <p class="text-sm leading-relaxed text-red-700 dark:text-red-400">
                  Kemungkinan tab sebelumnya sudah ditutup. Silakan mulai ulang dari halaman paket.
                </p>
              </div>
            </div>
          </div>

          <div
            v-if="!pending && !nextBankId"
            class="rounded-2xl p-5 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30"
          >
            <div class="flex items-start gap-4">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-amber-100 dark:bg-amber-800/30 text-amber-600 dark:text-amber-400">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M12 9v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>

              <div>
                <h2 class="font-extrabold text-amber-800 dark:text-amber-300 mb-1">
                  Tidak ada sesi lanjutan
                </h2>
                <p class="text-sm leading-relaxed text-amber-700 dark:text-amber-400">
                  Data sesi berikutnya tidak ditemukan. Anda bisa kembali ke halaman paket.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            @click="startNextSession"
            :disabled="pending"
            class="w-full min-h-[56px] flex items-center justify-center gap-3 rounded-2xl px-6 py-4
                   bg-tryout-primary hover:opacity-90 text-white font-black transition-all
                   shadow-lg shadow-tryout-primary/20 active:scale-[0.98]
                   disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            <svg
              v-if="pending"
              class="animate-spin h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>

            <span>{{ buttonLabel }}</span>

            <svg
              v-if="!pending"
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="3"
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </button>

          <p class="text-xs text-center leading-relaxed text-tryout-subtle">
            Pastikan koneksi internet stabil sebelum memulai sesi berikutnya.
          </p>
        </div>
      </div>
    </section>
  </main>
</template>