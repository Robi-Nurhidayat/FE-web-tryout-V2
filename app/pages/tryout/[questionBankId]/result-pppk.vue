<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const examResult = useExamResult()

const userAnswerId = computed(() => examResult.value?.userAnswerItems?.[0]?.userAnswerId || '')
const summaryPoint = computed(() => examResult.value?.summaryPoint || 0)
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4 font-sans bg-tryout-bg">

    <div class="w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl bg-tryout-surface border border-tryout-border">

      <div class="p-8 text-center bg-indigo-600">
        <div class="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 shadow-inner bg-white/20 backdrop-blur-sm">
          <span class="text-4xl">🏅</span>
        </div>
        <h2 class="text-2xl font-black text-white tracking-tight mb-1">SELESAI!</h2>
        <p class="text-sm font-medium text-indigo-100">
          Rangkaian Seleksi Kompetensi PPPK telah berakhir.
        </p>
      </div>

      <div class="p-8 pb-4 text-center">
        <p class="text-sm font-bold mb-4 text-tryout-muted">
          Total Akumulasi Poin Anda:
        </p>
        <div class="inline-block rounded-3xl px-10 py-6 mb-4 border-2 border-tryout-border bg-tryout-hover">
          <span class="text-7xl font-black tracking-tighter text-indigo-600">
            {{ summaryPoint }}
          </span>
        </div>
        <div class="p-4 rounded-xl bg-blue-50 border border-blue-100 dark:bg-blue-900/10 dark:border-blue-800/30">
          <p class="text-xs font-medium text-blue-800 dark:text-blue-300 leading-relaxed">
            Ini adalah skor akhir Anda untuk sesi terakhir. Silakan cek menu Riwayat untuk melihat rincian evaluasi lengkap.
          </p>
        </div>
      </div>

      <div class="px-6 pb-8 sm:px-8 pt-4">
        <NuxtLink
          v-if="userAnswerId"
          :to="`/pembahasan/${userAnswerId}`"
          class="flex items-center justify-center gap-2 w-full font-bold py-4 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/20 bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-1"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          Lihat Pembahasan Ujian
        </NuxtLink>
      </div>

    </div>
  </div>
</template>