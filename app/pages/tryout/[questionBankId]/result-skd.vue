<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const examResult = useExamResult()

const userAnswerId = computed(() => examResult.value?.userAnswerItems?.[0]?.userAnswerId || '')
const summaryPoint = computed(() => examResult.value?.summaryPoint || 0)
const isPassed     = computed(() => examResult.value?.isPassed)

const twk = computed(() => examResult.value?.scoreTwk || 0)
const tiu = computed(() => examResult.value?.scoreTiu || 0)
const tkp = computed(() => examResult.value?.scoreTkp || 0)

const targetTwk   = computed(() => examResult.value?.targetTwk   || 0)
const targetTiu   = computed(() => examResult.value?.targetTiu   || 0)
const targetTkp   = computed(() => examResult.value?.targetTkp   || 0)
const targetTotal = computed(() => examResult.value?.targetTotal || 0)
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4 font-sans bg-tryout-bg">

    <div class="w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl bg-tryout-surface border border-tryout-border">

      <div
        class="p-8 text-center"
        :class="isPassed === true ? 'bg-emerald-500' : 'bg-red-500'"
      >
        <div class="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 shadow-inner bg-white/20 backdrop-blur-sm">
          <span v-if="isPassed === true" class="text-4xl">🎉</span>
          <span v-else class="text-4xl">❌</span>
        </div>
        <h2 class="text-2xl font-black text-white tracking-tight mb-1">
          <template v-if="isPassed === true">LULUS PASSING GRADE!</template>
          <template v-else>BELUM LULUS</template>
        </h2>
        <p class="text-sm font-medium text-white/90">
          <template v-if="isPassed === true">Selamat! Nilai SKD-mu memenuhi ambang batas minimal.</template>
          <template v-else>Jangan menyerah! Cek pembahasan dan coba lagi.</template>
        </p>
      </div>

      <div class="p-6 sm:p-8">

        <div class="text-center mb-8">
          <p class="text-xs font-bold uppercase tracking-[0.2em] mb-1 text-tryout-muted">
            Total Skor Akhir
          </p>
          <div class="text-6xl font-black tracking-tighter flex items-end justify-center gap-2 text-tryout-text">
            {{ summaryPoint }}
            <span v-if="targetTotal > 0" class="text-xl font-bold mb-2 text-tryout-muted">
              / {{ targetTotal }}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-3">
          <div
            v-for="({ label, score, target }) in [
              { label: 'TWK', score: twk, target: targetTwk },
              { label: 'TIU', score: tiu, target: targetTiu },
              { label: 'TKP', score: tkp, target: targetTkp },
            ]"
            :key="label"
            class="relative overflow-hidden flex flex-col items-center justify-center p-4 rounded-2xl bg-tryout-hover border border-tryout-border"
          >
            <div
              class="absolute top-0 left-0 right-0 h-1"
              :class="score >= target ? 'bg-emerald-500' : 'bg-red-500'"
            ></div>

            <p class="text-[10px] font-black uppercase mb-1 text-tryout-muted">{{ label }}</p>
            <span
              class="text-2xl font-black"
              :class="score >= target ? 'text-emerald-500' : 'text-red-500'"
            >
              {{ score }}
            </span>
            <p class="text-[11px] font-bold mt-1 pt-1 w-full text-center border-t text-tryout-muted border-tryout-divider">
              Target: {{ target }}
            </p>
          </div>
        </div>
      </div>

      <div class="px-6 pb-8 sm:px-8 pt-2">
        <NuxtLink
          v-if="userAnswerId"
          :to="`/pembahasan/${userAnswerId}`"
          class="flex items-center justify-center gap-2 w-full font-bold py-4 rounded-xl transition-all active:scale-[0.98] shadow-lg bg-tryout-text text-tryout-surface hover:opacity-90"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          Lihat Pembahasan Soal
        </NuxtLink>
      </div>

    </div>
  </div>
</template>