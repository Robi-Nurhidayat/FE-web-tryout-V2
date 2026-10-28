<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const examResult = useExamResult()

const userAnswerId = computed(() => examResult.value?.userAnswerItems?.[0]?.userAnswerId || '')
const summaryPoint = computed(() => examResult.value?.summaryPoint || 0)

const goBackToPacket = () => {
  // Arahkan kembali ke riwayat atau daftar paket (Sesuaikan path-nya dengan rute web Anda)
  router.push('/my-packets') 
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4 font-sans bg-tryout-bg">

    <div class="w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl bg-tryout-surface border border-tryout-border">

      <div class="p-8 text-center bg-tryout-primary">
        <div class="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 shadow-inner bg-white/20 backdrop-blur-sm">
          <span class="text-4xl">🏆</span>
        </div>
        <h2 class="text-2xl font-black text-white tracking-tight mb-1">SESI SELESAI!</h2>
        <p class="text-sm font-medium text-white/80">
          Anda telah menyelesaikan rangkaian soal pada sesi ini.
        </p>
      </div>

      <div class="p-8 pb-4 text-center">
        <p class="text-sm font-bold mb-4 text-tryout-muted">
          Skor Ujian untuk Sesi Ini:
        </p>
        
        <div class="inline-block rounded-3xl px-12 py-6 mb-5 border-2 border-tryout-border bg-tryout-hover">
          <span class="text-7xl font-black tracking-tighter text-tryout-primary">
            {{ summaryPoint }}
          </span>
        </div>

        <div class="p-4 rounded-xl bg-blue-50 border border-blue-100 dark:bg-blue-900/10 dark:border-blue-800/30">
          <p class="text-xs font-medium text-blue-800 dark:text-blue-300 leading-relaxed">
            <span class="font-bold">Catatan:</span> Jika ujian ini adalah bagian dari ujian bertingkat (seperti PPPK Sesi Utama + Wawancara), skor di atas hanyalah nilai untuk <strong>sesi yang baru saja Anda kerjakan</strong>.
          </p>
        </div>
      </div>

      <div class="px-6 pb-8 sm:px-8 pt-4 space-y-3">
        
        <NuxtLink
          v-if="userAnswerId"
          :to="`/pembahasan/${userAnswerId}`"
          class="flex items-center justify-center gap-2 w-full font-bold py-3.5 rounded-xl transition-all shadow-lg bg-tryout-text text-tryout-surface hover:opacity-90 active:scale-[0.98]"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          Lihat Pembahasan Sesi Ini
        </NuxtLink>

        <button
          @click="goBackToPacket"
          class="flex items-center justify-center gap-2 w-full font-bold py-3.5 rounded-xl transition-all border border-tryout-border bg-tryout-surface text-tryout-text hover:bg-tryout-hover active:scale-[0.98]"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Kembali ke Dashboard Paket
        </button>

      </div>

    </div>
  </div>
</template>