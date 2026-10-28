<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNuxtApp, useAsyncData } from '#imports'

definePageMeta({
  layout: 'default'
})

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const { $api } = useNuxtApp()

const userAnswerId = route.params.userAnswerId

// State
const currentIndex = ref(0)
const showNavigationPanel = ref(false)

// 1. Fetch Pembahasan (Explain)
const { data: response, pending, error } = await useAsyncData(
  `explain-detail-${userAnswerId}`,
  () => $api(`/api/v1/user-answers/explain/${userAnswerId}`, { method: 'GET' }),
  { server: false }
)

const { sortQuestions } = useQuestionSort()

const getTopicPriority = (topic) => {
  if (!topic) return 99

  const t = topic.toLowerCase()

  // ✅ SKD CPNS
  if (t.includes('twk')) return 1
  if (t.includes('tiu')) return 2
  if (t.includes('tkp')) return 3

  // ✅ PPPK
  if (t.includes('teknis')) return 1
  if (t.includes('manajerial')) return 2
  if (t.includes('sosial') || t.includes('soskul')) return 3

  if (t.includes('wawancara')) return 4

  return 99
}

const explanations = computed(() => sortQuestions(response.value?.data || []))

const questionBankId = computed(() => explanations.value[0]?.questionBankId || '')

// ==========================================
// LOGIKA UX ESTAFET
// ==========================================
const { data: bankResponse } = await useAsyncData(
  `bank-detail-relay-${userAnswerId}`,
  () => {
    if (!questionBankId.value) return Promise.resolve(null)
    return $api(`/api/v1/question-banks/${questionBankId.value}`, { method: 'GET' })
  },
  { server: false, lazy: true, watch: [questionBankId] }
)

const bankData = computed(() => bankResponse.value?.data || null)
const nextBankId = computed(() => bankData.value?.nextQuestionBankId || null)
const isSubSession = computed(() => bankData.value?.isSubSession || false)

const { data: historyMain } = await useAsyncData(
  `history-main-detail-${questionBankId.value}`,
  () => {
    if (!questionBankId.value || isSubSession.value) return Promise.resolve(null)
    return $api(`/api/v1/user-answers/questions-bank/${questionBankId.value}`, { method: 'GET' })
  },
  { server: false, lazy: true, watch: [questionBankId] }
)

const { data: historyNext } = await useAsyncData(
  `history-next-detail-${nextBankId.value}`,
  () => {
    if (!nextBankId.value) return Promise.resolve(null)
    return $api(`/api/v1/user-answers/questions-bank/${nextBankId.value}`, { method: 'GET' })
  },
  { server: false, lazy: true, watch: [nextBankId] }
)

const nextUserAnswerId = computed(() => {
  if (!historyMain.value?.data || !historyNext.value?.data) return null

  const idx = historyMain.value.data.indexOf(userAnswerId)

  if (idx !== -1 && historyNext.value.data[idx]) {
    return historyNext.value.data[idx]
  }

  return null
})

const goToNextSession = () => {
  if (nextUserAnswerId.value) {
    router.push(`/pembahasan/${nextUserAnswerId.value}/detail`)
  }
}

// ================= HELPER FUNCTIONS =================
const optionLetters = ['A', 'B', 'C', 'D', 'E']
const getImageUrl = (filename) => {
  if (!filename || filename.trim() === '' || filename === '-') return null

  const base = String(config.public.apiBaseUrl || '').replace(/\/+$/, '')

  let path = filename.startsWith('http')
    ? new URL(filename).pathname
    : filename

  if (!path.startsWith('/')) path = `/${path}`
  if (!path.startsWith('/uploads/')) path = `/uploads${path}`

  const encoded = path
    .split('/')
    .map(seg => {
      try { return encodeURIComponent(decodeURIComponent(seg)) }
      catch { return encodeURIComponent(seg) }
    })
    .join('/')

  return `${base}${encoded}`
}

const hasText = (value) => {
  if (value === null || value === undefined) return false
  if (typeof value !== 'string') return false

  const cleaned = value.trim().toLowerCase()

  return cleaned !== '' &&
    cleaned !== 'null' &&
    cleaned !== 'undefined' &&
    cleaned !== '-'
}

const normalizeOptionKey = (value) => {
  if (!hasText(value)) return ''
  return value.trim().toUpperCase()
}

const isValidImageUrl = (url) => {
  if (!hasText(url)) return false

  const cleanUrl = url.split('?')[0].split('#')[0]

  return /\.(jpg|jpeg|png|webp|gif|bmp|svg|tiff|ico)$/i.test(cleanUrl)
}

const isQuestionImage = (item) => isValidImageUrl(item?.questionImage)

const isOptionImage = (item, letter) => {
  return isValidImageUrl(item?.[`imageOption${letter}`])
}

const hasOption = (item, letter) => {
  if (!item) return false

  const textValue = item?.[`option${letter}`]
  const imageValue = item?.[`imageOption${letter}`]

  return hasText(textValue) || isValidImageUrl(imageValue)
}

const getOptionValue = (item, letter) => {
  if (!hasOption(item, letter)) return ''

  const imageKey = `imageOption${letter}`
  const textKey = `option${letter}`

  if (isValidImageUrl(item?.[imageKey])) {
    return item?.[imageKey]
  }

  return item?.[textKey] || ''
}

const getCorrectAnswer = (item) => {
  if (isValidImageUrl(item?.correctAnswerImage)) {
    return item.correctAnswerImage
  }

  return item?.correctAnswerText || '-'
}

const isCorrectOption = (item, optionValue) => {
  return getCorrectAnswer(item) === optionValue
}

const isUserOption = (item, letter) => {
  return normalizeOptionKey(item?.selectedOptionKey) === letter
}

const getOptionScore = (item, letter) => {
  if (!hasOption(item, letter)) return 0
  return item?.[`scoreOption${letter}`] || 0
}

const hasScoreForOption = (item, letter) => {
  return hasOption(item, letter) && getOptionScore(item, letter) > 0
}

const getScoreOptions = (item) => {
  if (!item) return []

  return optionLetters
    .filter(letter => hasScoreForOption(item, letter))
    .map(letter => ({
      letter,
      score: getOptionScore(item, letter)
    }))
}

const getMaxScore = (item) => {
  const scores = getScoreOptions(item).map(option => option.score)

  if (scores.length === 0) return 0

  return Math.max(...scores)
}

const isScaledQuestion = (item) => {
  return getMaxScore(item) > 0
}

const isMaxScoreOption = (item, letter) => {
  if (!isScaledQuestion(item)) return false

  const score = getOptionScore(item, letter)

  return score > 0 && score === getMaxScore(item)
}

const hasUserAnswered = (item) => {
  return hasText(item?.selectedOptionKey)
}

// Styling Opsi
const getOptionClass = (item, letter) => {
  const optionValue = getOptionValue(item, letter)
  const isCorrect = isCorrectOption(item, optionValue)
  const isUser = isUserOption(item, letter)
  const isMax = isMaxScoreOption(item, letter)

  // Soal skala: opsi dengan skor tertinggi selalu hijau
  if (isScaledQuestion(item) && isMax) {
    return 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500 z-10'
  }

  // Soal skala: pilihan user yang bukan skor tertinggi merah
  if (isScaledQuestion(item) && isUser && !isMax) {
    return 'bg-red-500/10 border-red-500 ring-2 ring-red-500 z-10'
  }

  // Soal benar/salah biasa: kunci jawaban hijau
  if (!isScaledQuestion(item) && isCorrect) {
    return 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500 z-10'
  }

  // Soal benar/salah biasa: jawaban user salah merah
  if (!isScaledQuestion(item) && isUser && !isCorrect) {
    return 'bg-red-500/10 border-red-500 ring-2 ring-red-500 z-10'
  }

  return 'bg-tryout-surface border-tryout-border'
}

const getOptionBadgeClass = (item, letter) => {
  const optionValue = getOptionValue(item, letter)
  const isCorrect = isCorrectOption(item, optionValue)
  const isUser = isUserOption(item, letter)
  const isMax = isMaxScoreOption(item, letter)

  // Soal skala: opsi skor tertinggi hijau
  if (isScaledQuestion(item) && isMax) {
    return 'bg-emerald-500 border-emerald-500 text-white'
  }

  // Soal skala: jawaban user bukan skor tertinggi merah
  if (isScaledQuestion(item) && isUser && !isMax) {
    return 'bg-red-500 border-red-500 text-white'
  }

  // Soal benar/salah biasa: kunci jawaban hijau
  if (!isScaledQuestion(item) && isCorrect) {
    return 'bg-emerald-500 border-emerald-500 text-white'
  }

  // Soal benar/salah biasa: jawaban user salah merah
  if (!isScaledQuestion(item) && isUser && !isCorrect) {
    return 'bg-red-500 border-red-500 text-white'
  }

  return 'bg-tryout-surface border-tryout-border text-tryout-text'
}

// Styling Peta Soal
const getGridButtonClass = (item, index) => {
  const isActive = currentIndex.value === index

  const baseClass = isActive
    ? 'ring-2 ring-tryout-primary ring-offset-2 scale-110 z-10 shadow-md border-transparent '
    : 'border-tryout-border hover:bg-tryout-hover '

  let colorClass = 'bg-tryout-surface text-tryout-text'

  if (item?.status === 1) {
    colorClass = 'bg-emerald-500 text-white border-emerald-600'
  } else if (hasUserAnswered(item)) {
    colorClass = 'bg-red-500 text-white border-red-600'
  }

  return baseClass + colorClass
}

// Computed Data
const currentQuestion = computed(() => explanations.value[currentIndex.value])
const totalQuestions = computed(() => explanations.value.length)

const answeredCount = computed(() => explanations.value.filter(item => hasUserAnswered(item)).length)
const correctCount = computed(() => explanations.value.filter(item => item?.status === 1).length)
const wrongCount = computed(() => explanations.value.filter(item => hasUserAnswered(item) && item?.status === 0).length)
const skippedCount = computed(() => explanations.value.filter(item => !hasUserAnswered(item)).length)
const totalPoint = computed(() => explanations.value.reduce((sum, item) => sum + (item?.point || 0), 0))

// Navigation
const goToQuestion = (index) => {
  currentIndex.value = index
  showNavigationPanel.value = false
}

const nextQuestion = () => {
  if (currentIndex.value < totalQuestions.value - 1) {
    currentIndex.value++
  }
}

const prevQuestion = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

const finishReview = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push(`/pembahasan/${userAnswerId}`)
  }
}
</script>

<template>
  <div v-if="pending" class="min-h-screen flex items-center justify-center bg-tryout-bg">
    <div class="text-center">
      <div
        class="animate-spin rounded-full h-16 w-16 border-4 border-tryout-border border-t-tryout-primary mx-auto mb-4">
      </div>
      <p class="text-lg font-medium text-tryout-muted">Memuat pembahasan...</p>
    </div>
  </div>

  <div v-else-if="error" class="min-h-screen flex items-center justify-center bg-tryout-bg">
    <div class="text-center bg-tryout-surface p-8 rounded-2xl shadow-lg mx-4 border border-tryout-border">
      <svg class="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>

      <h2 class="text-xl font-bold text-tryout-text mb-2">Gagal Memuat Pembahasan</h2>

      <p class="text-tryout-muted mb-6">
        {{ error?.data?.message || error.message || 'Periksa koneksi internet Anda.' }}
      </p>

      <button @click="router.back()"
        class="px-6 py-2.5 bg-tryout-primary text-white rounded-xl font-medium hover:opacity-90 transition">
        Kembali
      </button>
    </div>
  </div>

  <div v-else class="min-h-screen bg-tryout-bg flex flex-col font-sans">
    <header class="bg-tryout-navbar border-b border-tryout-border sticky top-0 z-30 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <div class="flex flex-col">
          <span class="text-xs font-bold text-tryout-subtle uppercase tracking-wider hidden sm:block">
            {{ isSubSession ? 'Pembahasan Wawancara' : 'Pembahasan Tryout' }}
          </span>

          <span class="text-sm sm:text-base font-bold text-tryout-navbar-text line-clamp-1">
            Soal <span class="text-tryout-accent">{{ currentIndex + 1 }}</span> dari {{ totalQuestions }}
          </span>
        </div>

        <div class="flex items-center gap-3">
          <div
            class="flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full font-bold text-xs sm:text-sm bg-tryout-surface border border-tryout-border text-tryout-primary shadow-inner">
            <svg class="w-4 h-4 sm:w-5 sm:h-5 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            Skor Akhir: {{ totalPoint }}
          </div>
        </div>

        <div class="flex items-center">
          <button @click="finishReview" type="button"
            class="px-4 py-2 bg-tryout-surface border border-tryout-border hover:bg-tryout-hover text-tryout-text rounded-lg font-bold text-sm transition shadow-sm whitespace-nowrap">
            Selesai Review
          </button>
        </div>
      </div>
    </header>

    <div class="max-w-7xl mx-auto w-full flex-1 flex gap-6 p-4 sm:p-6 lg:p-8 pb-40 lg:pb-8 relative">
      <div
        class="flex-1 bg-tryout-surface rounded-2xl shadow-sm border border-tryout-border p-5 sm:p-8 flex flex-col h-fit">
        <div class="flex items-center justify-between mb-6 pb-4 border-b border-tryout-border">
          <div class="flex items-center gap-3">
            <span class="bg-tryout-primary text-white px-3 py-1 rounded-lg font-bold text-sm shadow-sm">
              #{{ currentIndex + 1 }}
            </span>

            <span v-if="currentQuestion?.mainTopic"
              class="text-xs font-bold text-tryout-primary tracking-wider uppercase bg-tryout-bg border border-tryout-border px-3 py-1.5 rounded-md">
              {{ currentQuestion.mainTopic }}
            </span>

            <span v-if="currentQuestion?.subTopic" class="text-xs font-semibold text-tryout-muted hidden sm:inline">
              {{ currentQuestion.subTopic }}
            </span>
          </div>

          <div v-if="!hasUserAnswered(currentQuestion)"
            class="bg-tryout-bg text-tryout-muted px-3 py-1 rounded-full text-xs font-bold border border-tryout-border flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            Kosong (+0)
          </div>

          <div v-else-if="currentQuestion?.status === 1"
            class="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/20 flex items-center gap-1">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd" />
            </svg>
            {{ isScaledQuestion(currentQuestion) ? 'Poin Max' : 'Benar' }} (+{{ currentQuestion.point || 0 }})
          </div>

          <div v-else
            class="bg-red-500/10 text-red-600 dark:text-red-400 px-3 py-1 rounded-full text-xs font-bold border border-red-500/20 flex items-center gap-1">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd" />
            </svg>
            {{ isScaledQuestion(currentQuestion) ? 'Poin Rendah' : 'Salah' }} (+{{ currentQuestion.point || 0 }})
          </div>
        </div>

        <div class="mb-8 overflow-hidden text-tryout-text text-base sm:text-lg leading-relaxed">
          <img v-if="isQuestionImage(currentQuestion)" :src="getImageUrl(currentQuestion.questionImage)" alt="Soal"
            class="max-w-full max-h-[50vh] object-contain rounded-xl border border-tryout-border mx-auto"
            @error="(e) => e.target.style.display = 'none'" />

          <div v-else-if="currentQuestion?.questionText" v-html="currentQuestion.questionText"></div>
        </div>

        <div class="space-y-3 mb-8">
          <div v-for="letter in optionLetters" :key="letter" v-show="hasOption(currentQuestion, letter)"
            class="group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-xl border-2 transition-all duration-200"
            :class="getOptionClass(currentQuestion, letter)">
            <div class="flex items-start gap-3 flex-1 w-full overflow-hidden">
              <div
                class="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 mt-0.5 rounded-full border-2 flex items-center justify-center font-bold text-xs sm:text-sm transition-colors"
                :class="getOptionBadgeClass(currentQuestion, letter)">
                {{ letter }}
              </div>

              <div class="flex-1 text-tryout-text font-medium mt-1 sm:mt-0.5">
                <img v-if="isOptionImage(currentQuestion, letter)"
                  :src="getImageUrl(currentQuestion?.[`imageOption${letter}`])" alt="Opsi"
                  class="max-w-full max-h-40 object-contain rounded-lg border border-tryout-border"
                  @error="(e) => e.target.style.display = 'none'" />

                <span v-else class="block break-words">
                  {{ currentQuestion?.[`option${letter}`] }}
                </span>
              </div>
            </div>

            <div class="flex flex-row sm:flex-col flex-wrap items-start sm:items-end gap-2 ml-9 sm:ml-0 flex-shrink-0">
              <span
                v-if="!isScaledQuestion(currentQuestion) && isCorrectOption(currentQuestion, getOptionValue(currentQuestion, letter))"
                class="text-[10px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded shadow-sm border border-emerald-500/20 whitespace-nowrap">
                Kunci Jawaban
              </span>

              <span v-if="isScaledQuestion(currentQuestion) && isMaxScoreOption(currentQuestion, letter)"
                class="text-[10px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded shadow-sm border border-emerald-500/20 whitespace-nowrap">
                Poin Tertinggi
              </span>

              <span v-if="isUserOption(currentQuestion, letter)"
                class="text-[10px] sm:text-xs font-bold whitespace-nowrap px-2 py-1 rounded shadow-sm border" :class="(!isScaledQuestion(currentQuestion) && isCorrectOption(currentQuestion, getOptionValue(currentQuestion, letter))) || (isScaledQuestion(currentQuestion) && isMaxScoreOption(currentQuestion, letter))
                  ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/20 border-emerald-500/30'
                  : 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20'">
                Jawaban Anda: {{ currentQuestion.selectedOptionKey }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="currentQuestion?.explanation || isValidImageUrl(currentQuestion?.explanationImage)"
          class="bg-tryout-bg border border-tryout-border rounded-xl p-5 sm:p-6 mt-4 shadow-sm">
          <h4 class="font-bold text-tryout-primary flex items-center gap-2 mb-4">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Penjelasan Detail
          </h4>

          <div class="flex flex-col md:flex-row items-start gap-6">
            <img v-if="isValidImageUrl(currentQuestion?.explanationImage)"
              :src="getImageUrl(currentQuestion.explanationImage)" alt="Penjelasan"
              class="max-w-full md:max-w-xs max-h-[300px] object-contain rounded-lg border border-tryout-border bg-tryout-surface shadow-sm"
              @error="(e) => e.target.style.display = 'none'" />

            <div v-if="currentQuestion?.explanation"
              class="flex-1 text-tryout-text leading-relaxed text-[15px] sm:text-base whitespace-pre-line font-medium">
              {{ currentQuestion.explanation }}
            </div>
          </div>

          <div v-if="isScaledQuestion(currentQuestion)" class="mt-6 pt-5 border-t border-tryout-border">
            <h5 class="text-xs font-bold text-tryout-primary uppercase tracking-widest mb-3 flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Bobot Poin Tiap Opsi
            </h5>

            <div class="flex flex-wrap gap-3">
              <div v-for="option in getScoreOptions(currentQuestion)" :key="`score-${option.letter}`"
                class="flex items-center bg-tryout-surface rounded-lg border border-tryout-border shadow-sm overflow-hidden min-w-[70px]">
                <div class="px-3 py-1.5 font-black text-sm text-tryout-text border-r border-tryout-border" :class="option.score === getMaxScore(currentQuestion)
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-tryout-bg'">
                  {{ option.letter }}
                </div>

                <div class="px-3 py-1.5 text-sm font-bold flex-1 text-center" :class="option.score === getMaxScore(currentQuestion)
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                  : 'text-tryout-primary'">
                  {{ option.score }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        class="hidden lg:flex flex-col w-80 bg-tryout-sidebar rounded-2xl shadow-sm border border-tryout-border h-[calc(100vh-8rem)] sticky top-24">
        <div class="p-6 border-b border-tryout-border bg-tryout-bg/50 rounded-t-2xl">
          <h3 class="font-bold text-tryout-text flex items-center gap-2">
            <svg class="w-5 h-5 text-tryout-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Peta Pembahasan
          </h3>
        </div>

        <div class="p-5 overflow-y-auto flex-1 custom-scrollbar">
          <div class="grid grid-cols-5 gap-2.5">
            <button v-for="(q, index) in explanations" :key="index" @click="goToQuestion(index)" :class="[
              'aspect-square rounded-lg text-sm font-bold transition-all flex items-center justify-center border hover:scale-105 active:scale-95',
              getGridButtonClass(q, index)
            ]">
              {{ index + 1 }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      class="lg:hidden fixed bottom-0 left-0 right-0 bg-tryout-surface border-t border-tryout-border p-3 pb-safe z-30 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)]">
      <div class="flex items-center justify-between gap-2">
        <button @click="prevQuestion" :disabled="currentIndex === 0"
          class="flex-[1] h-12 flex items-center justify-center bg-tryout-bg border border-tryout-border text-tryout-text rounded-xl font-bold disabled:opacity-40 active:bg-tryout-hover">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button @click="showNavigationPanel = true"
          class="flex-[3] h-12 flex items-center justify-center gap-2 bg-tryout-primary/10 border border-tryout-primary/20 text-tryout-primary rounded-xl font-bold active:opacity-80 shadow-sm">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          Lihat Peta
        </button>

        <button v-if="currentIndex < totalQuestions - 1" @click="nextQuestion"
          class="flex-[1] h-12 flex items-center justify-center bg-tryout-bg border border-tryout-border text-tryout-text rounded-xl font-bold active:bg-tryout-hover">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <button v-else-if="nextUserAnswerId" @click="goToNextSession"
          class="flex-[1] h-12 flex items-center justify-center bg-tryout-primary border border-tryout-primary text-white rounded-xl font-bold active:opacity-80 shadow-md">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>

        <button v-else disabled
          class="flex-[1] h-12 flex items-center justify-center bg-tryout-bg border border-tryout-border text-tryout-text rounded-xl font-bold opacity-40">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>

    <div
      class="hidden lg:block fixed bottom-0 left-0 right-0 bg-tryout-surface border-t border-tryout-border z-30 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
      <div class="max-w-7xl mx-auto px-8 py-4 flex items-center w-[calc(100%-22rem)] gap-4">
        <button @click="prevQuestion" :disabled="currentIndex === 0"
          class="flex-1 py-3 flex items-center justify-center gap-2 bg-tryout-surface border border-tryout-border text-tryout-text hover:bg-tryout-hover rounded-xl font-bold transition-all disabled:opacity-40 shadow-sm active:scale-[0.98]">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15 19l-7-7 7-7" />
          </svg>
          Sebelumnya
        </button>

        <button v-if="currentIndex < totalQuestions - 1" @click="nextQuestion"
          class="flex-1 py-3 flex items-center justify-center gap-2 bg-tryout-primary border border-tryout-primary text-white hover:opacity-90 rounded-xl font-bold transition-all shadow-md active:scale-[0.98]">
          Selanjutnya
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <button v-else-if="nextUserAnswerId" @click="goToNextSession"
          class="flex-1 py-3 flex items-center justify-center gap-2 bg-gradient-to-r from-tryout-primary to-tryout-accent text-white hover:opacity-90 rounded-xl font-bold transition-all shadow-lg active:scale-[0.98]">
          Lanjut ke Soal Wawancara
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>

        <button v-else disabled
          class="flex-1 py-3 flex items-center justify-center gap-2 bg-tryout-primary border border-tryout-primary text-white opacity-40 rounded-xl font-bold shadow-sm">
          Selanjutnya
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>

    <transition name="fade">
      <div v-if="showNavigationPanel" class="lg:hidden fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
        @click="showNavigationPanel = false"></div>
    </transition>

    <transition name="slide-up">
      <div v-if="showNavigationPanel"
        class="lg:hidden fixed bottom-0 left-0 right-0 bg-tryout-surface rounded-t-3xl z-50 flex flex-col h-[70vh] shadow-[0_-10px_40px_rgba(0,0,0,0.2)] border-t border-tryout-border">
        <div class="p-5 border-b border-tryout-border flex justify-between items-center bg-tryout-bg rounded-t-3xl">
          <h3 class="font-bold text-tryout-text text-lg flex items-center gap-2">
            <svg class="w-5 h-5 text-tryout-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Peta Soal
          </h3>

          <button @click="showNavigationPanel = false"
            class="p-2 bg-tryout-surface rounded-full text-tryout-muted shadow-sm border border-tryout-border active:scale-95 transition-transform">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="p-5 overflow-y-auto flex-1 custom-scrollbar pb-safe">
          <div class="grid grid-cols-5 sm:grid-cols-6 gap-3">
            <button v-for="(q, index) in explanations" :key="index" @click="goToQuestion(index)" :class="[
              'aspect-square rounded-xl text-sm font-bold flex items-center justify-center border transition-all active:scale-90',
              getGridButtonClass(q, index)
            ]">
              {{ index + 1 }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--color-tryout-border);
  border-radius: 10px;
}

.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 1rem);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
</style>