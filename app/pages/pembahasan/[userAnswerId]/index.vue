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

const userAnswerId = route.params.userAnswerId

const nextUserAnswerId = computed(() => {
  const value = route.query.nextId
  if (Array.isArray(value)) return value[0] || null
  return value || null
})

// ===============================
// 1. FETCH HASIL UJIAN UTAMA
// ===============================
const { data: mainResultResponse, pending: loadingMainResult } = await useAsyncData(
  `result-summary-main-${userAnswerId}`,
  () => $api(`/api/v1/user-answers/explain/${userAnswerId}`, { method: 'GET' }),
  { server: false }
)

const mainExplanations = computed(() => mainResultResponse.value?.data || [])
const mainQuestionBankId = computed(() => mainExplanations.value[0]?.questionBankId || null)

// ===============================
// 2. FETCH HASIL UJIAN LANJUTAN
// ===============================
const { data: nextResultResponse, pending: loadingNextResult } = await useAsyncData(
  `result-summary-next-${userAnswerId}`,
  () => {
    if (!nextUserAnswerId.value) return Promise.resolve(null)

    return $api(`/api/v1/user-answers/explain/${nextUserAnswerId.value}`, {
      method: 'GET'
    })
  },
  {
    server: false,
    lazy: true,
    watch: [nextUserAnswerId]
  }
)

const nextExplanations = computed(() => nextResultResponse.value?.data || [])
const nextQuestionBankIdFromAnswer = computed(() => nextExplanations.value[0]?.questionBankId || null)

const loadingResult = computed(() => loadingMainResult.value || loadingNextResult.value)

// ===============================
// 3. FETCH QUESTION BANK UTAMA
// ===============================
const { data: mainBankResponse } = await useAsyncData(
  `bank-detail-main-${userAnswerId}`,
  () => {
    if (!mainQuestionBankId.value) return Promise.resolve(null)

    return $api(`/api/v1/question-banks/${mainQuestionBankId.value}`, {
      method: 'GET'
    })
  },
  {
    server: false,
    lazy: true,
    watch: [mainQuestionBankId]
  }
)

const mainBankData = computed(() => mainBankResponse.value?.data || null)
const nextBankId = computed(() => mainBankData.value?.nextQuestionBankId || null)

// ===============================
// 4. FETCH QUESTION BANK LANJUTAN
// ===============================
const { data: nextBankResponse } = await useAsyncData(
  `bank-detail-next-${userAnswerId}`,
  () => {
    if (!nextQuestionBankIdFromAnswer.value) return Promise.resolve(null)

    return $api(`/api/v1/question-banks/${nextQuestionBankIdFromAnswer.value}`, {
      method: 'GET'
    })
  },
  {
    server: false,
    lazy: true,
    watch: [nextQuestionBankIdFromAnswer]
  }
)

const nextBankData = computed(() => nextBankResponse.value?.data || null)

// ===============================
// 5. HELPER RINGKASAN PER BLOK
// ===============================
const getTopicScore = (items, keyword) => {
  return items
    .filter(q => q.mainTopic?.toUpperCase().includes(keyword))
    .reduce((sum, q) => sum + (q.point || 0), 0)
}

const buildSummary = (label, answerId, items, bankData, fallbackTitle) => {
  const totalQuestions = items.length
  const correctCount = items.filter(item => item?.status === 1).length
  const wrongCount = items.filter(item => item?.userAnswerTitle && item?.status === 0).length
  const skippedCount = items.filter(item => !item?.userAnswerTitle).length
  const totalPoint = items.reduce((sum, item) => sum + (item?.point || 0), 0)

  const accuracy = totalQuestions === 0
    ? 0
    : Math.round((correctCount / totalQuestions) * 100)

  const twkScore = getTopicScore(items, 'TWK')
  const tiuScore = getTopicScore(items, 'TIU')
  const tkpScore = getTopicScore(items, 'TKP')

  const targetTwk = bankData?.passingGradeTwk || 0
  const targetTiu = bankData?.passingGradeTiu || 0
  const targetTkp = bankData?.passingGradeTkp || 0
  const targetTotal = bankData?.passingGradeTotal || 0

  const isSkd = targetTwk > 0 || targetTiu > 0 || targetTkp > 0 || targetTotal > 0

  let isPassed = null

  if (isSkd) {
    const passTwk = targetTwk === 0 || twkScore >= targetTwk
    const passTiu = targetTiu === 0 || tiuScore >= targetTiu
    const passTkp = targetTkp === 0 || tkpScore >= targetTkp
    const passTotal = targetTotal === 0 || totalPoint >= targetTotal

    isPassed = passTwk && passTiu && passTkp && passTotal
  }

  return {
    label,
    userAnswerId: answerId,
    title: bankData?.title || fallbackTitle,
    isSubSession: bankData?.isSubSession || false,

    totalQuestions,
    correctCount,
    wrongCount,
    skippedCount,
    totalPoint,
    accuracy,

    twkScore,
    tiuScore,
    tkpScore,

    targetTwk,
    targetTiu,
    targetTkp,
    targetTotal,

    isSkd,
    isPassed
  }
}

const mainSummary = computed(() => {
  return buildSummary(
    'Ujian 1',
    userAnswerId,
    mainExplanations.value,
    mainBankData.value,
    'Ujian Utama'
  )
})

const nextSummary = computed(() => {
  return buildSummary(
    'Ujian 2',
    nextUserAnswerId.value,
    nextExplanations.value,
    nextBankData.value,
    'Ujian Lanjutan / Wawancara'
  )
})

const resultBlocks = computed(() => {
  const blocks = []

  if (mainExplanations.value.length > 0) {
    blocks.push(mainSummary.value)
  }

  if (nextUserAnswerId.value && nextExplanations.value.length > 0) {
    blocks.push(nextSummary.value)
  }

  return blocks
})

const combinedSummary = computed(() => {
  return {
    totalPoint: resultBlocks.value.reduce((sum, item) => sum + item.totalPoint, 0),
    totalQuestions: resultBlocks.value.reduce((sum, item) => sum + item.totalQuestions, 0),
    correctCount: resultBlocks.value.reduce((sum, item) => sum + item.correctCount, 0),
    wrongCount: resultBlocks.value.reduce((sum, item) => sum + item.wrongCount, 0),
    skippedCount: resultBlocks.value.reduce((sum, item) => sum + item.skippedCount, 0)
  }
})

const getProgress = (score, target) => {
  if (!target || target === 0) return 100
  return Math.min(100, Math.max(0, (score / target) * 100))
}

// ===============================
// 6. LEADERBOARD TETAP PAKAI USER ANSWER UTAMA
// ===============================
const { data: leaderboardResponse, pending: loadingLeaderboard } = await useAsyncData(
  `leaderboard-${userAnswerId}`,
  () => $api(`/api/v1/user-answers/${userAnswerId}/leaderboard`, { method: 'GET' }),
  { server: false }
)

const leaderboard = computed(() => leaderboardResponse.value?.data || {})
const rankings = computed(() => leaderboard.value?.top100 || [])
const userRank = computed(() => leaderboard.value?.userRank || null)
const totalParticipants = computed(() => leaderboard.value?.totalParticipants || 0)

const isUserInTop100 = computed(() => rankings.value.some(r => r.isCurrentUser))
const hasLeaderboardData = computed(() => rankings.value.length > 0 || userRank.value !== null)

const getRankColor = (index) => {
  if (index === 0) return 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white'
  if (index === 1) return 'bg-gradient-to-br from-gray-300 to-gray-500 text-white'
  if (index === 2) return 'bg-gradient-to-br from-orange-400 to-orange-600 text-white'
  return 'bg-tryout-hover text-tryout-primary border border-tryout-border'
}

const getRankBadge = (index) => {
  if (index === 0) return '🥇'
  if (index === 1) return '🥈'
  if (index === 2) return '🥉'
  return ''
}

const goToPembahasanDetail = (answerId) => {
  router.push(`/pembahasan/${answerId}/detail`)
}

const backQuestionBankId = computed(() => mainQuestionBankId.value || nextQuestionBankIdFromAnswer.value)

const backInfoUrl = computed(() => {
  if (!backQuestionBankId.value) return '/my-packets'
  return `/tryout/${backQuestionBankId.value}/info`
})

const bankTitle = computed(() => {
  if (resultBlocks.value.length > 1) return 'Hasil Gabungan Ujian'
  return mainBankData.value?.title || 'Pembahasan Ujian'
})

const isSubSession = computed(() => {
  return mainBankData.value?.isSubSession || false
})
</script>

<template>
  <main class="min-h-screen py-8 bg-tryout-bg">

    <div v-if="loadingResult" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="animate-spin rounded-full h-16 w-16 border-4 mx-auto
                    border-tryout-border border-t-tryout-primary"></div>
        <p class="mt-6 font-bold text-tryout-muted">Menghitung hasil ujian...</p>
      </div>
    </div>

    <div v-else class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

      <div class="mb-8">
       <NuxtLink
          :to="backInfoUrl"
          class="mb-6 flex items-center gap-2 text-sm font-bold transition-colors group
                text-tryout-muted hover:text-tryout-text"
        >
          <span class="p-1.5 rounded-lg transition-all bg-tryout-surface border border-tryout-border group-hover:bg-tryout-hover">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </span>
          Kembali
        </NuxtLink>

        <h1 class="text-3xl md:text-4xl font-extrabold mb-2" 
            :class="isSubSession ? 'text-tryout-primary' : 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'">
          {{ isSubSession ? '🗣️ Hasil Sesi Lanjutan' : '🎉 Tryout Selesai!' }}
        </h1>
        <p class="font-bold text-lg text-tryout-text mb-1">{{ bankTitle }}</p>
        <p class="font-medium text-tryout-muted">Lihat hasil ringkasan dan ranking Anda di bawah ini</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <div class="lg:col-span-2 space-y-6">

  <!-- Ringkasan Gabungan -->
  <div
    v-if="resultBlocks.length > 1"
    class="rounded-3xl shadow-xl p-6 bg-tryout-primary/10 border border-tryout-primary/20"
  >
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-extrabold text-tryout-primary">
          ⭐ Total Gabungan Ujian
        </h2>
        <p class="text-sm font-medium text-tryout-muted mt-1">
          Nilai ini adalah gabungan dari Ujian 1 dan Ujian 2 pada percobaan yang sama.
        </p>
      </div>

      <div class="text-right">
        <p class="text-xs font-bold uppercase tracking-wider text-tryout-muted">
          Total Poin
        </p>
        <p class="text-4xl font-extrabold text-tryout-primary">
          {{ combinedSummary.totalPoint }}
        </p>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
      <div class="p-4 rounded-2xl bg-tryout-surface border border-tryout-border text-center">
        <p class="text-2xl font-extrabold text-tryout-text">{{ combinedSummary.totalQuestions }}</p>
        <p class="text-xs font-bold text-tryout-muted uppercase">Total Soal</p>
      </div>

      <div class="p-4 rounded-2xl bg-tryout-surface border border-tryout-border text-center">
        <p class="text-2xl font-extrabold text-emerald-500">{{ combinedSummary.correctCount }}</p>
        <p class="text-xs font-bold text-tryout-muted uppercase">Benar</p>
      </div>

      <div class="p-4 rounded-2xl bg-tryout-surface border border-tryout-border text-center">
        <p class="text-2xl font-extrabold text-red-500">{{ combinedSummary.wrongCount }}</p>
        <p class="text-xs font-bold text-tryout-muted uppercase">Salah</p>
      </div>

      <div class="p-4 rounded-2xl bg-tryout-surface border border-tryout-border text-center">
        <p class="text-2xl font-extrabold text-orange-500">{{ combinedSummary.skippedCount }}</p>
        <p class="text-xs font-bold text-tryout-muted uppercase">Tidak Terjawab</p>
      </div>
    </div>
  </div>

  <!-- Blok Per Ujian -->
  <div
    v-for="block in resultBlocks"
    :key="block.userAnswerId"
    class="rounded-3xl shadow-xl p-8 bg-tryout-surface border border-tryout-border relative overflow-hidden"
  >
    <div class="absolute -top-10 -right-10 w-40 h-40 bg-tryout-primary/5 rounded-full blur-3xl pointer-events-none"></div>

    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
      <div>
        <h2 class="text-2xl font-bold text-tryout-text flex items-center gap-2">
          📊 Ringkasan Nilai {{ block.label }}

          <span
            v-if="block.isSubSession"
            class="text-[10px] uppercase px-2 py-0.5 rounded-md bg-tryout-hover border border-tryout-border text-tryout-muted ml-2 tracking-widest"
          >
            Wawancara
          </span>
        </h2>

        <p class="text-sm font-bold text-tryout-muted mt-1">
          {{ block.title }}
        </p>
      </div>

      <div class="flex items-center gap-2 px-5 py-2.5 rounded-full border shadow-sm bg-tryout-primary/10 border-tryout-primary/20">
        <svg class="w-5 h-5 text-tryout-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
        <span class="font-extrabold text-tryout-primary">{{ block.totalPoint }} Poin</span>
      </div>
    </div>

    <!-- Passing Grade hanya untuk SKD -->
    <template v-if="block.isSkd">
      <div
        class="mb-6 p-4 rounded-2xl flex items-center gap-4 relative z-10"
        :class="block.isPassed
          ? 'bg-emerald-500/10 border border-emerald-500/20'
          : 'bg-red-500/10 border border-red-500/20'"
      >
        <div
          class="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl shadow-sm shrink-0"
          :class="block.isPassed ? 'bg-emerald-500' : 'bg-red-500'"
        >
          {{ block.isPassed ? '🎉' : '❌' }}
        </div>

        <div>
          <h3 class="font-extrabold text-lg" :class="block.isPassed ? 'text-emerald-500' : 'text-red-500'">
            {{ block.isPassed ? 'LULUS PASSING GRADE' : 'BELUM LULUS' }}
          </h3>
          <p class="text-sm font-medium" :class="block.isPassed ? 'text-emerald-500' : 'text-red-500'">
            {{ block.isPassed ? 'Nilai sesi ini memenuhi ambang batas minimal.' : 'Nilai sesi ini belum memenuhi passing grade.' }}
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 relative z-10">
        <div
          v-for="item in [
            { label: 'TWK', score: block.twkScore, target: block.targetTwk },
            { label: 'TIU', score: block.tiuScore, target: block.targetTiu },
            { label: 'TKP', score: block.tkpScore, target: block.targetTkp }
          ]"
          :key="`${block.userAnswerId}-${item.label}`"
          class="relative overflow-hidden p-4 rounded-2xl bg-tryout-hover border border-tryout-border"
        >
          <div
            class="absolute top-0 left-0 right-0 h-1"
            :class="item.score >= item.target ? 'bg-emerald-500' : 'bg-red-500'"
          ></div>

          <div class="flex justify-between items-end mb-2">
            <span class="font-black text-sm text-tryout-text">{{ item.label }}</span>

            <div class="flex items-baseline gap-1">
              <span
                class="text-xl font-black"
                :class="item.score >= item.target ? 'text-emerald-500' : 'text-red-500'"
              >
                {{ item.score }}
              </span>
              <span class="text-xs font-bold text-tryout-subtle">/ {{ item.target }}</span>
            </div>
          </div>

          <div class="w-full h-1.5 rounded-full overflow-hidden bg-tryout-skeleton">
            <div
              class="h-full rounded-full transition-all duration-1000 ease-out"
              :class="item.score >= item.target ? 'bg-emerald-500' : 'bg-red-500'"
              :style="{ width: getProgress(item.score, item.target) + '%' }"
            ></div>
          </div>
        </div>
      </div>
    </template>

    <!-- Non SKD / PPPK -->
    <template v-else>
      <div class="mb-8 p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-900/30 flex items-start gap-4 relative z-10">
        <div class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-800/30 flex items-center justify-center text-blue-500 shrink-0 mt-0.5">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <p class="text-sm font-medium text-blue-800 dark:text-blue-300 leading-relaxed">
          Sesi ini menggunakan sistem <strong>Skor Kumulatif</strong>. Nilai dihitung dari total poin pada sesi ini.
        </p>
      </div>
    </template>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 relative z-10">
      <div class="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 rounded-2xl p-5 text-center border border-blue-200 dark:border-blue-700/40 shadow-sm">
        <div class="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{{ block.totalQuestions }}</div>
        <div class="text-xs mt-1 font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">Total Soal</div>
      </div>

      <div class="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-900/30 rounded-2xl p-5 text-center border border-emerald-200 dark:border-emerald-700/40 shadow-sm">
        <div class="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{{ block.correctCount }}</div>
        <div class="text-xs mt-1 font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">Benar</div>
      </div>

      <div class="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/30 rounded-2xl p-5 text-center border border-red-200 dark:border-red-700/40 shadow-sm">
        <div class="text-3xl font-extrabold text-red-600 dark:text-red-400">{{ block.wrongCount }}</div>
        <div class="text-xs mt-1 font-bold uppercase tracking-wider text-red-800 dark:text-red-300">Salah</div>
      </div>

      <div class="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/30 rounded-2xl p-5 text-center border border-orange-200 dark:border-orange-700/40 shadow-sm">
        <div class="text-3xl font-extrabold text-orange-600 dark:text-orange-400">{{ block.accuracy }}%</div>
        <div class="text-xs mt-1 font-bold uppercase tracking-wider text-orange-800 dark:text-orange-300">Akurasi</div>
      </div>
    </div>

    <button
      @click="goToPembahasanDetail(block.userAnswerId)"
      class="w-full font-extrabold py-4 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center gap-3 shadow-md active:scale-[0.98] relative z-10
             bg-tryout-surface hover:bg-tryout-hover border-2 border-tryout-border text-tryout-text"
    >
      <svg class="w-6 h-6 text-tryout-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>

      <span class="text-lg">
        Pembahasan Detail {{ block.label }}
      </span>
    </button>
  </div>

  <!-- Kalau ujian ada sesi 2 tapi user belum menyelesaikan sesi 2 -->
  <div
    v-if="nextBankId && !nextUserAnswerId"
    class="p-5 rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 flex items-center gap-4"
  >
    <div class="w-10 h-10 rounded-full flex items-center justify-center bg-red-100 dark:bg-red-800/30 text-red-500 shrink-0">
      ⚠️
    </div>

    <div>
      <p class="font-bold text-sm text-red-800 dark:text-red-400">
        Sesi Wawancara Terputus
      </p>
      <p class="text-xs text-red-600/80 dark:text-red-400/80 mt-0.5">
        Anda tidak menyelesaikan atau tidak mengikuti sesi lanjutan pada percobaan ujian ini.
      </p>
    </div>
  </div>

</div>

        <div class="lg:col-span-1">
          <div class="rounded-3xl shadow-2xl p-6 sticky top-8 bg-tryout-surface border border-tryout-border overflow-hidden">
            
            <div class="absolute -top-10 -right-10 w-32 h-32 bg-amber-400/10 rounded-full blur-3xl pointer-events-none"></div>

            <div class="flex flex-col gap-1 mb-6 relative z-10">
              <div class="flex items-center justify-between">
                <h2 class="text-xl font-extrabold text-tryout-text flex items-center gap-2">🏆 Leaderboard</h2>
                <span v-if="totalParticipants > 0" class="text-xs font-bold px-3 py-1 rounded-full bg-tryout-hover text-tryout-muted border border-tryout-border">
                  {{ totalParticipants }} Peserta
                </span>
              </div>
              <p v-if="nextBankId" class="text-[10px] font-bold uppercase tracking-wider text-tryout-primary mt-1">
                ⭐ Skor Total (Utama + Wawancara)
              </p>

              <div class="mt-2 p-3 rounded-xl bg-tryout-primary/5 border border-tryout-primary/20 flex gap-2.5 items-start">
                <svg class="w-4 h-4 text-tryout-primary shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                
                <p class="text-[11px] leading-relaxed text-tryout-muted font-medium">
                  <strong class="text-tryout-text">Aturan Peringkat:</strong> Sistem pemeringkatan dan penentuan posisi jika terjadi skor seri murni mengikuti <strong>algoritma dan aturan internal web ini</strong>.</p>
              </div>
              </div>

            <div v-if="loadingLeaderboard" class="text-center py-10">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-tryout-primary mx-auto"></div>
              <p class="mt-4 font-bold text-sm text-tryout-primary">Memuat ranking...</p>
            </div>

            <div v-else-if="rankings.length > 0" class="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar relative z-10">
              <div
                v-for="(item, index) in rankings"
                :key="item.userId"
                :class="[
                  'flex items-center gap-3 p-3.5 rounded-2xl transition-all',
                  item.isCurrentUser
                    ? 'bg-tryout-primary/10 ring-2 ring-tryout-primary/40 shadow-md scale-[1.02]'
                    : 'bg-tryout-hover border border-tryout-border hover:bg-tryout-skeleton'
                ]"
              >
                <div class="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm flex-shrink-0 shadow-sm" :class="getRankColor(index)">
                  {{ item.rank }}
                </div>

                <div v-if="index < 3" class="text-2xl flex-shrink-0">
                  {{ getRankBadge(index) }}
                </div>

                <div class="flex-1 min-w-0">
                  <p class="font-bold truncate text-sm" :class="item.isCurrentUser ? 'text-tryout-primary' : 'text-tryout-text'">
                    {{ item.userName }}
                    <span v-if="item.isCurrentUser" class="text-[10px] uppercase tracking-wider ml-1 px-1.5 py-0.5 rounded bg-tryout-primary/15 text-tryout-primary">(Anda)</span>
                  </p>
                  <p class="text-xs font-semibold" :class="item.isCurrentUser ? 'text-tryout-primary' : 'text-tryout-muted'">
                    {{ item.totalPoint }} poin
                  </p>
                </div>
              </div>
            </div>

            <div v-else-if="!hasLeaderboardData && !loadingLeaderboard" class="text-center py-12 rounded-2xl border-2 border-dashed bg-tryout-hover border-tryout-border relative z-10">
              <p class="text-sm font-bold text-tryout-text">Belum ada data ranking</p>
            </div>

            <div v-if="!isUserInTop100 && userRank" class="mt-4 p-5 rounded-2xl border-2 bg-tryout-primary/5 border-tryout-primary/20 relative z-10">
              <p class="text-center text-sm">
                <span class="font-extrabold uppercase tracking-wider text-xs text-tryout-text">Posisi Anda:</span><br>
                <span class="text-3xl font-extrabold my-1 block text-tryout-primary">#{{ userRank.rank }}</span>
                <span class="font-semibold px-3 py-1 rounded-full text-xs bg-tryout-primary/10 text-tryout-primary border border-tryout-primary/20">
                  {{ userRank.totalPoint }} Poin
                </span>
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  </main>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar       { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: var(--color-tryout-hover); }
.custom-scrollbar::-webkit-scrollbar-thumb { background: var(--color-tryout-border); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--color-tryout-muted); }
</style>