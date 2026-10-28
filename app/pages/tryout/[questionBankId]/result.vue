<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

definePageMeta({
  layout: 'default'
})

const route = useRoute()
const router = useRouter()

const mainBankId = computed(() => {
  if (!process.client) return route.params.questionBankId

  return sessionStorage.getItem('active_main_bank_id') || route.params.questionBankId
})

const keHalamanInfo = () => {
  const targetBankId = mainBankId.value

  if (process.client) {
    sessionStorage.removeItem('active_main_bank_id')
    sessionStorage.removeItem('active_main_user_answer_id')
  }

  router.push(`/tryout/${targetBankId}/info`)
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-4 font-sans bg-tryout-bg">
    <div class="w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl bg-tryout-surface border border-tryout-border">

      <div class="p-8 text-center bg-tryout-primary">
        <div class="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 shadow-inner bg-white/20 backdrop-blur-sm">
          <span class="text-4xl">🎉</span>
        </div>

        <h2 class="text-2xl font-black text-white tracking-tight mb-1">
          Ujian Selesai
        </h2>

        <p class="text-sm font-medium text-white/80">
          Jawaban Anda berhasil disimpan.
        </p>
      </div>

      <div class="p-8 text-center">
        <p class="text-tryout-muted font-medium leading-relaxed">
          Anda dapat melihat hasil, pembahasan, dan riwayat pengerjaan pada halaman informasi tryout.
        </p>
      </div>

      <div class="px-6 pb-8 sm:px-8 pt-2 space-y-3">
        <button
          @click="keHalamanInfo"
          class="flex items-center justify-center gap-2 w-full font-black py-4 rounded-xl transition-all shadow-lg bg-tryout-accent text-white hover:opacity-90 hover:-translate-y-1 active:scale-[0.98]"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>

          Lihat Hasil & Pembahasan
        </button>
      </div>
    </div>
  </div>
</template>