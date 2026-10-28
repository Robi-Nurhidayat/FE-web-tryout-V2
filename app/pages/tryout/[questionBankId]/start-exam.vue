<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const { $api } = useNuxtApp()

const questionBankId = route.params.questionBankId

const parentUserAnswerId = computed(() => {
  const value = route.query.parentUserAnswerId
  if (Array.isArray(value)) return value[0] || null
  return value || null
})

// ================= STATE =================
const questionBank = ref(null)
const currentIndex = ref(0)
const tempAnswer = ref('')
const savedAnswers = ref([])
const remainingTime = ref(0)
const initialTime = ref(0) // Merekam total detik alokasi awal

const showNavigationPanel = ref(false)
const isExamSubmitted = ref(false)

const examResult = useExamResult()

const alertConfig = ref({
  show: false,
  title: '',
  message: '',
  type: 'warning',
  confirmText: 'OK',
  cancelText: 'Batal',
  showCancel: false,
  onConfirm: () => { },
  onCancel: () => { }
})

// ================= FETCH =================
const { data: questionBankRes } = await useAsyncData(
  `bank-${questionBankId}`,
  () => $api(`/api/v1/question-banks/${questionBankId}`, { method: 'GET' })
)

const { data: response, pending, error } = await useAsyncData(
  `questions-${questionBankId}`,
  () => $api(`/api/v1/questions-banks/${questionBankId}/question-items`, { method: 'GET' })
)

console.log("isi responses", response.value)

// ================= SORTING =================
const { sortQuestions } = useQuestionSort()

const questions = computed(() => sortQuestions(response.value?.data || []))
// ================= MOUNTED =================
onMounted(() => {
  questionBank.value = questionBankRes.value?.data || null

  if (questionBank.value && questionBank.value.duration) {
    initialTime.value = questionBank.value.duration * 60
  } else {
    initialTime.value = 3600
  }
  remainingTime.value = initialTime.value

  loadAnswerForCurrentQuestion()
  startTimer()

  window.addEventListener('beforeunload', handleBeforeUnload)
  window.history.pushState(null, '', window.location.href)
  window.addEventListener('popstate', handleBackButton)
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
  window.removeEventListener('beforeunload', handleBeforeUnload)
  window.removeEventListener('popstate', handleBackButton)
})

// ================= CUSTOM ALERT HELPERS =================
const showAlert = (config) => {
  alertConfig.value = {
    show: true,
    title: config.title || 'Peringatan',
    message: config.message || '',
    type: config.type || 'warning',
    confirmText: config.confirmText || 'OK',
    cancelText: config.cancelText || 'Batal',
    showCancel: config.showCancel || false,
    onConfirm: config.onConfirm || (() => { }),
    onCancel: config.onCancel || (() => { })
  }
}

const closeAlert = () => { alertConfig.value.show = false }
const handleAlertConfirm = () => { alertConfig.value.onConfirm(); closeAlert() }
const handleAlertCancel = () => { alertConfig.value.onCancel(); closeAlert() }

// ================= PREVENT EXIT =================
const handleBeforeUnload = (e) => {
  if (isExamSubmitted.value) return
  e.preventDefault()
  e.returnValue = ''
  return 'Progres ujian akan hilang!'
}

const handleBackButton = (e) => {
  if (isExamSubmitted.value) return
  e.preventDefault()

  showAlert({
    title: '⚠️ Keluar dari Ujian?',
    message: `Semua progres akan hilang!\n\nTerjawab: ${savedAnswers.value.length}/${questions.value.length} soal\nWaktu tersisa: ${formatTime.value}`,
    type: 'warning',
    confirmText: 'Ya, Keluar',
    cancelText: 'Batal',
    showCancel: true,
    onConfirm: () => {
      isExamSubmitted.value = true
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handleBackButton)
      router.push(`/tryout/${questionBankId}/info`)
    },
    onCancel: () => {
      window.history.pushState(null, '', window.location.href)
    }
  })
}

onBeforeRouteLeave((to, from, next) => {
  if (isExamSubmitted.value) {
    next()
    return
  }

  showAlert({
    title: '⚠️ Tinggalkan Ujian?',
    message: `Anda sedang mengerjakan soal. Jika keluar sekarang, progres dan jawaban Anda TIDAK AKAN DISIMPAN.\n\nYakin ingin meninggalkan halaman ini?`,
    type: 'warning',
    confirmText: 'Ya, Tinggalkan',
    cancelText: 'Lanjutkan Ujian',
    showCancel: true,
    onConfirm: () => {
      isExamSubmitted.value = true
      next()
    },
    onCancel: () => {
      next(false)
    }
  })
})

// ================= TIMER =================
let timer = null
const startTimer = () => {
  timer = setInterval(() => {
    if (remainingTime.value > 0) {
      remainingTime.value--
    } else {
      handleAutoSubmit()
    }
  }, 1000)
}

const currentQuestion = computed(() => questions.value[currentIndex.value])

const formatTime = computed(() => {
  const h = Math.floor(remainingTime.value / 3600)
  const m = Math.floor((remainingTime.value % 3600) / 60)
  const s = remainingTime.value % 60
  if (h > 0) return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`
  return `${m}:${s < 10 ? '0' : ''}${s}`
})

const timeWarning = computed(() => remainingTime.value > 0 && remainingTime.value < 600)

// ================= HELPER FUNCTIONS =================
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

const getQuestionTitle = (question) => {
  if (question?.questionText && question.questionText.trim() !== '') return question.questionText
  return question?.questionImage || ''
}

const isValidImageUrl = (url) => {
  if (!url || typeof url !== 'string' || url === 'null' || url.trim() === '') return false
  let cleanUrl = url.startsWith('http') ? url.split('?')[0].split('#')[0] : url
  return /\.(jpg|jpeg|png|webp|gif|bmp|svg|tiff|ico)$/i.test(cleanUrl)
}

const isQuestionImage = (question) => isValidImageUrl(question?.questionImage)

const getOptionValue = (question, optionLetter) => {
  const imageKey = `imageOption${optionLetter}`
  const textKey = `option${optionLetter}`
  if (isValidImageUrl(question?.[imageKey])) return getImageUrl(question?.[imageKey])
  return question?.[textKey] || ''
}

const isOptionImage = (question, optionLetter) => isValidImageUrl(question?.[`imageOption${optionLetter}`])
const hasImageOptions = computed(() =>
  ['A', 'B', 'C', 'D', 'E'].some(letter => isOptionImage(currentQuestion.value, letter))
)

// ================= LOAD & SAVE ANSWER =================
const loadAnswerForCurrentQuestion = () => {
  if (!currentQuestion.value) return

  const questionItemId = currentQuestion.value.id
  const saved = savedAnswers.value.find(item => item.questionItemId === questionItemId)

  tempAnswer.value = saved ? saved.selectedOptionKey : ''
}
const isQuestionSaved = (question) => {
  if (!question?.id) return false
  return savedAnswers.value.some(item => item.questionItemId === question.id)
}

const getGridButtonClass = (question, index) => {
  const isActive = currentIndex.value === index
  const isSaved = isQuestionSaved(question)

  if (isActive && isSaved) {
    return 'bg-emerald-500 text-white ring-2 ring-tryout-primary ring-offset-2 ring-offset-tryout-surface scale-110 z-10 border-transparent shadow-md'
  } else if (isActive && !isSaved) {
    return 'bg-tryout-surface text-tryout-primary ring-2 ring-tryout-primary ring-offset-2 ring-offset-tryout-surface scale-110 z-10 border-transparent shadow-md'
  } else if (!isActive && isSaved) {
    return 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
  } else {
    return 'bg-tryout-surface text-tryout-muted border-tryout-border hover:bg-tryout-hover'
  }
}


const buttonSaveJawabanSementara = () => {
  if (!tempAnswer.value || tempAnswer.value.trim() === '') return
  if (!currentQuestion.value?.id) return

  const question = currentQuestion.value
  const questionItemId = question.id
  const selectedOptionKey = tempAnswer.value

  const questionTitle = getQuestionTitle(question)
  const userAnswerTitle = getOptionValue(question, selectedOptionKey)

  const payload = {
    questionItemId,
    selectedOptionKey,
    questionTitle,
    userAnswerTitle
  }

  const existingIndex = savedAnswers.value.findIndex(item => item.questionItemId === questionItemId)

  if (existingIndex !== -1) {
    savedAnswers.value[existingIndex] = payload
  } else {
    savedAnswers.value.push(payload)
  }

  if (currentIndex.value < questions.value.length - 1) {
    nextQuestion()
  }
}


const nextQuestion = () => {
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value++
    loadAnswerForCurrentQuestion()
  }
}

const prevQuestion = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
    loadAnswerForCurrentQuestion()
  }
}

const goToQuestion = (index) => {
  currentIndex.value = index
  loadAnswerForCurrentQuestion()
  showNavigationPanel.value = false
}

// ================= SUBMIT =================
const handleAutoSubmit = () => {
  showAlert({
    title: '⏰ Waktu Habis!',
    message: `Waktu ujian berakhir.\nTerjawab ${savedAnswers.value.length} dari ${questions.value.length} soal.\nJawaban dikirim otomatis.`,
    type: 'warning',
    confirmText: 'Mengerti',
    onConfirm: () => submitToBackend()
  })
}

const handleSubmitClick = () => {
  const unanswered = questions.value.length - savedAnswers.value.length
  showAlert({
    title: unanswered > 0 ? '⚠️ Konfirmasi Selesai' : '✅ Konfirmasi Selesai',
    message: `Terjawab: ${savedAnswers.value.length}/${questions.value.length}\nWaktu tersisa: ${formatTime.value}\n\nYakin ingin mengakhiri ujian?`,
    type: unanswered > 0 ? 'warning' : 'success',
    confirmText: 'Ya, Akhiri Ujian',
    cancelText: 'Periksa Lagi',
    showCancel: true,
    onConfirm: () => submitToBackend()
  })
}

const submitToBackend = async () => {
  try {
    const cleanTitle = (title) => {
      if (!title) return ''
      return title.startsWith('http') ? title.split('/').pop().split('?')[0] : title
    }

    const answerMap = {}

    savedAnswers.value.forEach(item => {
      answerMap[item.questionItemId] = item
    })

    const allAnswers = questions.value.map(question => {
      const saved = answerMap[question.id]
      const qTitle = getQuestionTitle(question)

      return {
        questionItemId: question.id,
        selectedOptionKey: saved?.selectedOptionKey || null,
        questionTitle: cleanTitle(qTitle),
        userAnswerTitle: cleanTitle(saved?.userAnswerTitle || '')
      }
    })

    const totalDetikTerpakai = initialTime.value - remainingTime.value
    const isSubSession = Boolean(questionBank.value?.isSubSession)

    const response = await $api('/api/v1/user-answers', {
      method: 'POST',
      body: {
        questionBankId: questionBankId,
        userAnswerItems: allAnswers,
        durationTaken: totalDetikTerpakai,
        parentUserAnswerId: isSubSession ? parentUserAnswerId.value : null
      }
    })

    isExamSubmitted.value = true
    examResult.value = response.data

    if (timer) clearInterval(timer)

    window.removeEventListener('beforeunload', handleBeforeUnload)
    window.removeEventListener('popstate', handleBackButton)

    const nextBankId = questionBank.value?.nextQuestionBankId
    const submittedUserAnswerId = response.data?.id

    if (!isSubSession && nextBankId && submittedUserAnswerId) {
      sessionStorage.setItem('active_main_bank_id', questionBankId)
      sessionStorage.setItem('active_main_user_answer_id', submittedUserAnswerId)

      showAlert({
        title: 'Sesi pertama selesai',
        message: 'Jawaban berhasil dikirim. Lanjutkan ke sesi berikutnya.',
        type: 'success',
        confirmText: 'Lanjut',
        onConfirm: async () => {
          await router.push(`/tryout/${questionBankId}/transition`)
        }
      })

      return
    }

    if (!isSubSession && nextBankId && !submittedUserAnswerId) {
      showAlert({
        title: 'Data hasil tidak lengkap',
        message: 'Sesi pertama berhasil dikirim, tetapi ID hasil tidak diterima dari server. Periksa UserAnswerResponseDto di backend.',
        type: 'error',
        confirmText: 'OK'
      })

      return
    }

    await router.push(`/tryout/${questionBankId}/result`)

  } catch (err) {
    console.error('Submit error:', err)

    showAlert({
      title: 'Submit gagal',
      message: `Gagal mengirim jawaban. Coba lagi.\n${err.data?.message || err.message}`,
      type: 'error',
      confirmText: 'OK'
    })
  }
}

const answeredCount = computed(() => savedAnswers.value.length)
const progressPercentage = computed(() => Math.round((answeredCount.value / questions.value.length) * 100))
</script>

<template>
  <CustomAlert :show="alertConfig.show" :title="alertConfig.title" :message="alertConfig.message"
    :type="alertConfig.type" :confirmText="alertConfig.confirmText" :cancelText="alertConfig.cancelText"
    :showCancel="alertConfig.showCancel" @confirm="handleAlertConfirm" @cancel="handleAlertCancel"
    @close="closeAlert" />

  <div v-if="pending" class="min-h-screen flex items-center justify-center bg-tryout-bg">
    <div class="text-center">
      <div class="animate-spin rounded-full h-16 w-16 border-4 mx-auto mb-4
                  border-tryout-border border-t-tryout-primary"></div>
      <p class="text-lg font-medium text-tryout-muted">Menyiapkan soal ujian...</p>
    </div>
  </div>

  <div v-else-if="error" class="min-h-screen flex items-center justify-center bg-tryout-bg">
    <div class="text-center p-8 rounded-2xl shadow-lg mx-4
                bg-tryout-surface border border-tryout-border">
      <svg class="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h2 class="text-xl font-bold mb-2 text-tryout-text">Gagal Memuat Ujian</h2>
      <p class="mb-6 text-tryout-muted">Periksa koneksi internet Anda atau muat ulang halaman.</p>
      <button @click="router.back()" class="px-6 py-2.5 rounded-xl font-medium transition
               bg-tryout-primary hover:opacity-90 text-white">
        Kembali
      </button>
    </div>
  </div>

  <div v-else class="min-h-screen flex flex-col font-sans bg-tryout-bg
           selection:bg-blue-100">

    <header class="sticky top-0 z-30 border-b shadow-sm transition-colors
                   bg-tryout-navbar border-tryout-border">
      <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

        <div class="flex flex-col">
          <span class="text-xs font-bold uppercase tracking-wider hidden sm:block text-tryout-subtle">
            Sedang Berlangsung
          </span>
          <span class="text-sm sm:text-base font-bold text-white line-clamp-1">
            Soal <span class="text-tryout-accent">{{ currentIndex + 1 }}</span> dari {{ questions.length }}
          </span>
        </div>

        <div class="flex items-center gap-2 px-4 py-1.5 rounded-full font-bold text-sm sm:text-lg shadow-inner border"
          :class="timeWarning
            ? 'bg-red-500/20 border-red-400/40 text-red-300 animate-pulse'
            : 'bg-white/10 border-white/20 text-white'">
          <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {{ formatTime }}
        </div>

        <div class="hidden lg:flex flex-col items-end w-48">
          <span class="text-xs font-semibold mb-1 text-white/70">
            {{ answeredCount }}/{{ questions.length }} Terjawab
          </span>
          <div class="w-full h-2 rounded-full overflow-hidden bg-white/20">
            <div class="bg-tryout-accent h-full transition-all duration-500"
              :style="{ width: `${progressPercentage}%` }"></div>
          </div>
        </div>
      </div>
    </header>

    <!-- <div class="max-w-7xl mx-auto w-full flex-1 flex gap-6 p-4 sm:p-6 lg:p-8 pb-40 lg:pb-8 relative"> -->

    <div class="flex">

      <div class="flex-1 shadow-sm border p-5 sm:p-8 flex flex-col h-fit
                  bg-tryout-surface border-tryout-border">

        <div class="flex items-center justify-between mb-6 pb-4 border-b border-tryout-divider">
          <div class="flex items-center gap-3">
            <span class="px-3 py-1 rounded-lg font-bold text-sm shadow-sm
                         bg-tryout-primary text-white">
              #{{ currentIndex + 1 }}
            </span>
            <div class="flex flex-col">
              <span class="text-xs font-semibold uppercase tracking-wider text-tryout-subtle">
                Pertanyaan
              </span>
              <span v-if="currentQuestion?.mainTopic" class="text-xs font-bold text-tryout-primary uppercase mt-0.5">
                {{ currentQuestion.mainTopic }}
              </span>
            </div>
          </div>

          <span v-if="isQuestionSaved(currentQuestion)" class="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1
                   bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd" />
            </svg>
            Tersimpan
          </span>
        </div>

        <div class="mb-8 overflow-hidden text-base sm:text-lg leading-relaxed text-tryout-text">
          <img v-if="isQuestionImage(currentQuestion)" :src="getImageUrl(currentQuestion?.questionImage)" alt="Soal"
            class="max-w-full h-[600px] object-contain rounded-xl mx-auto border border-tryout-border"
            @error="(e) => e.target.style.display = 'none'" />
          <div v-else-if="currentQuestion?.questionText" v-html="currentQuestion.questionText"></div>
        </div>

        <!-- <div class="space-y-3 mb-8">
          <template v-for="letter in ['A', 'B', 'C', 'D', 'E']" :key="letter">
            <label v-if="getOptionValue(currentQuestion, letter)"
              class="group flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 select-none active:scale-[0.99]"
              :class="tempAnswer === letter
                ? 'bg-tryout-primary/10 border-tryout-primary shadow-sm'
                : 'bg-tryout-surface border-tryout-border hover:border-tryout-primary hover:bg-tryout-hover'">
              <input type="radio" :name="`question-${currentQuestion?.id}`" :value="letter" v-model="tempAnswer"
                class="sr-only" />

              <div
                class="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center transition-colors"
                :class="tempAnswer === letter
                  ? 'border-tryout-primary bg-tryout-primary'
                  : 'border-tryout-border bg-tryout-input group-hover:border-tryout-primary'">
                <div v-show="tempAnswer === letter" class="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-white rounded-full"></div>
              </div>

              <div class="flex items-start gap-3 flex-1 overflow-hidden">
                <span class="font-bold mt-0.5 text-tryout-muted">{{ letter }}.</span>

                <div class="flex-1 font-medium text-tryout-text">
                  <img v-if="isOptionImage(currentQuestion, letter)"
                    :src="getImageUrl(currentQuestion?.[`imageOption${letter}`])" alt="Opsi"
                    class="max-w-full h-[170px] object-contain rounded-lg border border-tryout-border"
                    @error="(e) => e.target.style.display = 'none'" />

                  <span v-else class="block break-words">
                    {{ currentQuestion?.[`option${letter}`] }}
                  </span>
                </div>
              </div>
            </label>
          </template>
</div> -->

        <div :class="hasImageOptions
          ? 'grid grid-cols-2 sm:grid-cols-3 2xl:grid-cols-5 gap-3 mb-8'
          : 'space-y-3 mb-8'">
          <template v-for="letter in ['A', 'B', 'C', 'D', 'E']" :key="letter">
            <label v-if="getOptionValue(currentQuestion, letter)"
              class="group flex gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 select-none active:scale-[0.99] min-w-0"
              :class="[
                hasImageOptions ? 'flex-col items-center' : 'items-center gap-4',
                tempAnswer === letter
                  ? 'bg-tryout-primary/10 border-tryout-primary shadow-sm'
                  : 'bg-tryout-surface border-tryout-border hover:border-tryout-primary hover:bg-tryout-hover'
              ]">
              <input type="radio" :name="`question-${currentQuestion?.id}`" :value="letter" v-model="tempAnswer"
                class="sr-only" />

              <!-- Radio bulat -->
              <div
                class="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center transition-colors"
                :class="tempAnswer === letter
                  ? 'border-tryout-primary bg-tryout-primary'
                  : 'border-tryout-border bg-tryout-input group-hover:border-tryout-primary'">
                <div v-show="tempAnswer === letter" class="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-white rounded-full"></div>
              </div>

              <!-- Isi opsi -->
              <div class="flex flex-1 min-w-0 overflow-hidden"
                :class="hasImageOptions ? 'flex-col items-center gap-2 w-full' : 'items-start gap-3'">
                <span class="font-bold text-tryout-muted" :class="hasImageOptions ? '' : 'mt-0.5'">
                  {{ letter }}.
                </span>

                <div class="font-medium text-tryout-text" :class="hasImageOptions ? 'w-full' : 'flex-1'">
                  <img v-if="isOptionImage(currentQuestion, letter)"
                    :src="getImageUrl(currentQuestion?.[`imageOption${letter}`])" alt="Opsi"
                    class="object-contain rounded-lg border border-tryout-border bg-white"
                    :class="hasImageOptions ? 'w-full h-[170px]' : 'max-w-full h-[170px]'"
                    @error="(e) => e.target.style.display = 'none'" />

                  <span v-else class="block break-words">
                    {{ currentQuestion?.[`option${letter}`] }}
                  </span>
                </div>
              </div>
            </label>
          </template>
        </div>
      </div>

      <div class="hidden lg:flex flex-col w-80 shadow-sm border h-[calc(100vh-8rem)] sticky top-24
                  bg-tryout-surface border-tryout-border">

        <div class="p-6 border-b  bg-tryout-hover border-tryout-border">
          <h3 class="font-bold flex items-center gap-2 text-tryout-text">
            <svg class="w-5 h-5 text-tryout-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Daftar Soal
          </h3>
          <div
            class="flex flex-wrap items-center gap-3 mt-4 text-[10px] font-bold uppercase tracking-wider text-tryout-muted">
            <div class="flex items-center gap-1.5">
              <div class="w-3 h-3 rounded border border-tryout-border bg-tryout-surface"></div>
              Belum Terjawab
            </div>
            <div class="flex items-center gap-1.5">
              <div class="w-3 h-3 rounded bg-emerald-500"></div>
              Terjawab
            </div>
            <div class="flex items-center gap-1.5">
              <div class="w-3 h-3 rounded border-2 border-tryout-primary"></div>
              Aktif
            </div>
          </div>
        </div>

        <div class="p-5 overflow-y-auto flex-1 custom-scrollbar">
          <div class="grid grid-cols-5 gap-2.5">
            <button v-for="(q, index) in questions" :key="q.id" @click="goToQuestion(index)"
              :class="['aspect-square rounded-lg text-sm font-bold transition-all flex items-center justify-center border', getGridButtonClass(q, index)]">
              {{ index + 1 }}
            </button>
          </div>
        </div>

        <div class="p-5 border-t rounded-b-2xl bg-tryout-hover border-tryout-border">
          <div class="flex justify-between text-xs font-semibold mb-3 px-1 text-tryout-muted">
            <span>Terjawab: <span class="text-emerald-500 font-bold">{{ answeredCount }}</span></span>
            <span>Belum: <span class="text-red-500 font-bold">{{ questions.length - answeredCount }}</span></span>
          </div>
          <button @click="handleSubmitClick" class="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95
                   bg-tryout-text text-tryout-surface hover:opacity-90">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Selesai Ujian
          </button>
        </div>
      </div>
    </div>

    <div class="lg:hidden fixed bottom-0 left-0 right-0 border-t p-3 pb-safe z-30
                bg-tryout-navbar border-tryout-border
                shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.15)]">
      <button @click="buttonSaveJawabanSementara" class="w-full h-12 mb-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-md transition-transform active:scale-95
               bg-tryout-primary hover:opacity-90 text-white">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
        </svg>
        Simpan & Lanjut
      </button>

      <div class="flex items-center justify-between gap-2">
        <button @click="prevQuestion" :disabled="currentIndex === 0" class="flex-[1] h-12 flex items-center justify-center rounded-xl font-bold disabled:opacity-40
                 bg-tryout-surface border border-tryout-border text-tryout-text">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button @click="showNavigationPanel = true" class="flex-[3] h-12 flex items-center justify-center gap-2 rounded-xl font-bold active:scale-95
                 bg-tryout-primary/15 border border-tryout-primary/30 text-white">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          Daftar Soal ({{ currentIndex + 1 }}/{{ questions.length }})
        </button>

        <button @click="nextQuestion" :disabled="currentIndex === questions.length - 1" class="flex-[1] h-12 flex items-center justify-center rounded-xl font-bold disabled:opacity-40
                 bg-tryout-surface border border-tryout-border text-tryout-text">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>

    <div class="hidden lg:block fixed bottom-0 left-0 right-0 border-t z-30
                bg-tryout-navbar border-tryout-border">
      <div class="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between w-[calc(100%-22rem)]">
        <button @click="prevQuestion" :disabled="currentIndex === 0" class="px-6 py-3 flex items-center gap-2 rounded-xl font-bold transition-all disabled:opacity-40
                 bg-tryout-surface border border-tryout-border text-tryout-text hover:bg-tryout-hover">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15 19l-7-7 7-7" />
          </svg>
          Kembali
        </button>

        <button @click="buttonSaveJawabanSementara" class="px-10 py-3 rounded-xl font-bold flex items-center gap-2 shadow-md transition-transform active:scale-95
                 bg-tryout-primary hover:opacity-90 text-white">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          Simpan & Lanjut
        </button>

        <button @click="nextQuestion" :disabled="currentIndex === questions.length - 1" class="px-6 py-3 flex items-center gap-2 rounded-xl font-bold transition-all disabled:opacity-40
                 bg-tryout-surface border border-tryout-border text-tryout-text hover:bg-tryout-hover">
          Lanjut
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
      <div v-if="showNavigationPanel" class="lg:hidden fixed bottom-0 left-0 right-0 rounded-t-3xl z-50 flex flex-col h-[80vh]
               bg-tryout-surface shadow-[0_-10px_40px_rgba(0,0,0,0.25)]">
        <div class="p-5 border-b flex justify-between items-center rounded-t-3xl
                    bg-tryout-hover border-tryout-border">
          <div>
            <h3 class="font-bold text-lg flex items-center gap-2 text-tryout-text">
              <svg class="w-5 h-5 text-tryout-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Daftar Soal
            </h3>
            <div
              class="flex flex-wrap items-center gap-2 mt-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-tryout-muted">
              <div class="flex items-center gap-1.5">
                <div class="w-3 h-3 rounded border border-tryout-border bg-tryout-surface"></div>
                Kosong
              </div>
              <div class="flex items-center gap-1.5">
                <div class="w-3 h-3 rounded bg-emerald-500"></div>
                Terjawab
              </div>
              <div class="flex items-center gap-1.5">
                <div class="w-3 h-3 rounded border-2 border-tryout-primary"></div>
                Aktif
              </div>
            </div>
          </div>
          <button @click="showNavigationPanel = false" class="p-2 rounded-full self-start shadow-sm transition-colors
                   bg-tryout-surface border border-tryout-border text-tryout-muted hover:bg-tryout-hover">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="p-5 overflow-y-auto flex-1 custom-scrollbar">
          <div class="grid grid-cols-5 sm:grid-cols-6 gap-3">
            <button v-for="(q, index) in questions" :key="q.id" @click="goToQuestion(index)"
              :class="['aspect-square rounded-xl text-sm font-bold flex items-center justify-center border transition-all active:scale-90', getGridButtonClass(q, index)]">
              {{ index + 1 }}
            </button>
          </div>
        </div>

        <div class="p-5 border-t pb-safe bg-tryout-surface border-tryout-border">
          <div class="flex justify-between text-xs font-semibold mb-3 px-1 text-tryout-muted">
            <span>Terjawab: <span class="text-emerald-500 font-bold">{{ answeredCount }}</span></span>
            <span>Belum: <span class="text-red-500 font-bold">{{ questions.length - answeredCount }}</span></span>
          </div>
          <button @click="handleSubmitClick" class="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform
                   bg-tryout-text text-tryout-surface hover:opacity-90">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Selesai Ujian & Kumpulkan
          </button>
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
  background: var(--color-tryout-hover);
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--color-tryout-border);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--color-tryout-muted);
}

input[type="radio"]:focus-visible+div {
  outline: 2px solid var(--color-tryout-primary);
  outline-offset: 2px;
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