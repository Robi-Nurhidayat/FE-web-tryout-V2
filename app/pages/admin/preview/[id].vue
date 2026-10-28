<script setup>
import { ref, computed } from 'vue'

definePageMeta({
  layout: 'admin' // Menggunakan layout admin
})

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const { $api } = useNuxtApp()
const { getImageUrl } = useImageUrl()

// Mengambil ID Question Bank dari URL
const questionBankId = route.params.id

// State
const currentIndex = ref(0)
const showNavigationPanel = ref(false)

// ✅ Fetch daftar soal langsung dari API Question Items
const { data: response, pending, error } = await useAsyncData(
  `admin-preview-${questionBankId}`,
  () => $api(`/api/v1/questions-banks/${questionBankId}/question-items`, { method: 'GET' }),
  { server: false }
)

// ✅ HELPER SORTING: Menentukan prioritas urutan topik (TWK -> TIU -> TKP)
// const getTopicPriority = (topic) => {
//   if (!topic) return 4 // Jika kosong, taruh di paling belakang
//   const t = topic.toUpperCase()
//   if (t.includes('TWK')) return 1
//   if (t.includes('TIU')) return 2
//   if (t.includes('TKP')) return 3
//   return 4
// }

// // ✅ Mengurutkan Soal Secara Otomatis
// const questions = computed(() => {
//   const rawData = response.value?.data || []

//   // Salin array dan urutkan berdasarkan prioritas mainTopic
//   return [...rawData].sort((a, b) => {
//     return getTopicPriority(a.mainTopic) - getTopicPriority(b.mainTopic)
//   })
// })

const { sortQuestions } = useQuestionSort()

const questions = computed(() => sortQuestions(response.value?.data || []))

// ================= HELPER FUNCTIONS =================
const isValidImageUrl = (url) => {
  if (!url || typeof url !== 'string' || url === 'null' || url === 'undefined' || url.trim() === '') return false
  const cleanUrl = url.split('?')[0].split('#')[0]
  return /\.(jpg|jpeg|png|webp|gif|bmp|svg|tiff|ico)$/i.test(cleanUrl)
}

const isQuestionImage = (item) => isValidImageUrl(item?.questionImage)
const isOptionImage = (item, letter) => isValidImageUrl(item?.[`imageOption${letter}`])

const hasImageOptions = computed(() =>
  ['A', 'B', 'C', 'D', 'E'].some(letter => isOptionImage(currentQuestion.value, letter))
)

const getOptionValue = (item, letter) => {
  const imageKey = `imageOption${letter}`
  const textKey = `option${letter}`
  if (isValidImageUrl(item?.[imageKey])) return item[imageKey]
  return item?.[textKey] || ''
}

const getCorrectAnswer = (item) => {
  if (isValidImageUrl(item?.correctAnswerImage)) return item.correctAnswerImage
  return item?.correctAnswerText || '-'
}

// Cek status opsi (Hanya mengecek kunci jawaban)
const isCorrectOption = (item, optionValue) => getCorrectAnswer(item) === optionValue

// Styling Opsi (Highlight Kunci Jawaban)
const getOptionClass = (item, letter) => {
  const optionValue = getOptionValue(item, letter)
  const isCorrect = isCorrectOption(item, optionValue)

  if (isCorrect) return 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-500 ring-2 ring-emerald-500 z-10 shadow-sm'
  return 'bg-tryout-surface border-tryout-border opacity-70 hover:opacity-100 transition-opacity' // Opsi salah sedikit diredupkan
}

const getOptionBadgeClass = (item, letter) => {
  const optionValue = getOptionValue(item, letter)
  const isCorrect = isCorrectOption(item, optionValue)

  if (isCorrect) return 'bg-emerald-500 border-emerald-500 text-white'
  return 'bg-tryout-hover border-tryout-border text-tryout-muted'
}

// Styling Peta Soal (Polos, hanya menandai soal yang sedang dibuka)
const getGridButtonClass = (index) => {
  const isActive = currentIndex.value === index
  if (isActive) return 'bg-tryout-primary text-white ring-2 ring-tryout-primary ring-offset-2 ring-offset-tryout-bg scale-110 z-10 shadow-md border-transparent'
  return 'bg-tryout-surface text-tryout-text border-tryout-border hover:bg-tryout-hover'
}

// Pengecekan Soal TKP
const isTkpQuestion = (item) => {
  return item?.mainTopic?.toUpperCase().includes('TKP') || false
}

// Computed Data
const currentQuestion = computed(() => questions.value[currentIndex.value])
const totalQuestions = computed(() => questions.value.length)

// Navigation
const goToQuestion = (index) => {
  currentIndex.value = index
  showNavigationPanel.value = false
}

const nextQuestion = () => { if (currentIndex.value < totalQuestions.value - 1) currentIndex.value++ }
const prevQuestion = () => { if (currentIndex.value > 0) currentIndex.value-- }
const goBack = () => { router.back() }
</script>

<template>
  <div v-if="pending" class="min-h-[80vh] flex items-center justify-center bg-tryout-bg transition-colors duration-300">
    <div class="text-center">
      <div
        class="animate-spin rounded-full h-16 w-16 border-4 border-tryout-border border-t-tryout-primary mx-auto mb-4">
      </div>
      <p class="text-lg font-medium text-tryout-muted">Memuat Soal Preview...</p>
    </div>
  </div>

  <div v-else-if="error || questions.length === 0"
    class="min-h-[80vh] flex items-center justify-center bg-tryout-bg transition-colors duration-300">
    <div
      class="text-center bg-tryout-surface p-8 rounded-2xl shadow-sm border border-tryout-border mx-4 max-w-md w-full">
      <svg class="w-16 h-16 text-tryout-subtle mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h2 class="text-xl font-bold text-tryout-text mb-2">Data Tidak Ditemukan</h2>
      <p class="text-tryout-muted mb-6">Belum ada soal pada Question Bank ini atau terjadi kesalahan server.</p>
      <button @click="goBack"
        class="w-full px-6 py-2.5 bg-tryout-text text-tryout-surface rounded-xl font-bold hover:opacity-90 transition">Kembali</button>
    </div>
  </div>

  <div v-else
    class="min-h-screen bg-tryout-bg flex flex-col font-sans selection:bg-tryout-primary/20 pb-20 lg:pb-0 transition-colors duration-300">

    <header
      class="bg-tryout-surface border-b border-tryout-border sticky top-0 z-30 shadow-sm transition-colors duration-300">
      <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <div class="flex flex-col">
          <span class="text-xs font-bold text-tryout-primary uppercase tracking-wider hidden sm:block">Admin Preview
            Mode</span>
          <span class="text-sm sm:text-base font-bold text-tryout-text line-clamp-1">
            Soal <span class="text-tryout-primary">{{ currentIndex + 1 }}</span> dari {{ totalQuestions }}
          </span>
        </div>

        <div class="flex items-center">
          <button @click="goBack"
            class="px-5 py-2 bg-tryout-hover hover:opacity-80 text-tryout-text border border-tryout-border rounded-lg font-bold text-sm transition flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Tutup Preview
          </button>
        </div>
      </div>
    </header>

    <!-- <div class="max-w-7xl mx-auto w-full flex-1 flex gap-6 p-4 sm:p-6 lg:p-8 relative"> -->
    <div class="flex gap-1">

      <div
        class="flex-1 bg-tryout-surface  shadow-sm border border-tryout-border p-5 sm:p-8 flex flex-col h-fit transition-colors duration-300">

        <div class="flex items-center justify-between mb-6 pb-4 border-b border-tryout-divider">
          <div class="flex items-center gap-3">
            <span class="bg-tryout-text text-tryout-surface px-3 py-1 rounded-lg font-bold text-sm shadow-sm">#{{
              currentIndex + 1 }}</span>
            <span v-if="currentQuestion?.mainTopic"
              class="text-xs font-bold text-tryout-primary tracking-wider uppercase bg-tryout-primary/10 border border-tryout-primary/20 px-3 py-1.5 rounded-md">{{
                currentQuestion.mainTopic }}</span>
            <span v-if="currentQuestion?.subTopic" class="text-xs font-semibold text-tryout-muted hidden sm:inline">{{
              currentQuestion.subTopic }}</span>
          </div>

          <div class="flex items-center gap-3">
            <NuxtLink v-if="currentQuestion?.id" :to="`/admin/preview/${currentQuestion.id}/edit`"
              class="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500 dark:hover:bg-amber-600 hover:text-white border border-amber-300 dark:border-amber-700 hover:border-amber-500 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer px-3 py-1.5 rounded-lg text-xs font-bold">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M11 5H6a2 2 0 00-2-2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Soal Ini
            </NuxtLink>

            <div
              class="hidden sm:flex bg-tryout-primary/10 text-tryout-primary px-3 py-1.5 rounded-lg text-xs font-bold border border-tryout-primary/20 items-center gap-1 shadow-sm">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview Soal
            </div>
          </div>
        </div>

        <div class="mb-8 overflow-hidden text-tryout-text text-base sm:text-lg leading-relaxed">
          <img v-if="isQuestionImage(currentQuestion)" :src="getImageUrl(currentQuestion.questionImage)" alt="Soal"
            class="max-w-full h-[600px] object-contain rounded-xl border border-tryout-divider mx-auto"
            @error="(e) => e.target.style.display = 'none'" />
          <div v-else-if="currentQuestion?.questionText" v-html="currentQuestion.questionText"></div>
        </div>

        <div :class="hasImageOptions
          ? 'grid grid-cols-2 sm:grid-cols-3 2xl:grid-cols-5 gap-3 mb-8'
          : 'space-y-3 mb-8'">
          <div v-for="letter in ['A', 'B', 'C', 'D', 'E']" :key="letter"
            v-show="getOptionValue(currentQuestion, letter)"
            class="group flex gap-3 p-4 rounded-xl border-2 transition-all duration-200 min-w-0" :class="[
              hasImageOptions ? 'flex-col items-stretch' : 'flex-col sm:flex-row sm:items-center sm:gap-4',
              getOptionClass(currentQuestion, letter)
            ]">

            <div class="flex gap-3 flex-1 min-w-0 overflow-hidden"
              :class="hasImageOptions ? 'flex-col items-center' : 'items-start w-full'">
              <div
                class="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs sm:text-sm transition-colors"
                :class="[hasImageOptions ? '' : 'mt-0.5', getOptionBadgeClass(currentQuestion, letter)]">
                {{ letter }}
              </div>

              <div class="text-tryout-text font-medium min-w-0"
                :class="hasImageOptions ? 'w-full' : 'flex-1 mt-1 sm:mt-0.5'">
                <img v-if="isOptionImage(currentQuestion, letter)"
                  :src="getImageUrl(currentQuestion?.[`imageOption${letter}`])" alt="Opsi"
                  class="object-contain rounded-lg border border-tryout-divider bg-white"
                  :class="hasImageOptions ? 'w-full h-[170px]' : 'max-w-full max-h-40'"
                  @error="(e) => e.target.style.display = 'none'" />
                <span v-else class="block break-words">{{ currentQuestion?.[`option${letter}`] }}</span>
              </div>
            </div>

            <!-- Badge kunci jawaban & poin -->
            <div class="flex flex-row flex-wrap gap-2 flex-shrink-0"
              :class="hasImageOptions ? 'justify-center' : 'items-start sm:flex-col sm:items-end ml-9 sm:ml-0'">
              <span
                v-if="!isTkpQuestion(currentQuestion) && isCorrectOption(currentQuestion, getOptionValue(currentQuestion, letter))"
                class="text-[10px] sm:text-xs font-black text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1.5 rounded-md shadow-sm border border-emerald-300 dark:border-emerald-700 uppercase tracking-widest flex items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd" />
                </svg>
                Kunci
              </span>

              <span
                v-if="currentQuestion?.[`scoreOption${letter}`] !== undefined && currentQuestion?.[`scoreOption${letter}`] !== null"
                class="text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-md border"
                :class="currentQuestion?.[`scoreOption${letter}`] > 0 ? 'bg-tryout-primary/10 text-tryout-primary border-tryout-primary/20' : 'bg-tryout-surface text-tryout-muted border-tryout-border'">
                Poin: {{ currentQuestion[`scoreOption${letter}`] }}
              </span>
            </div>
          </div>
        </div>
        <div v-if="currentQuestion?.explanation || isValidImageUrl(currentQuestion?.explanationImage)"
          class="bg-tryout-primary/5 border border-tryout-primary/20 rounded-xl p-5 sm:p-6 mt-4 shadow-sm">
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
              class="max-w-full md:max-w-xs max-h-[300px] object-contain rounded-lg border border-tryout-primary/30 bg-tryout-surface shadow-sm"
              @error="(e) => e.target.style.display = 'none'" />
            <div v-if="currentQuestion?.explanation"
              class="flex-1 text-tryout-text leading-relaxed text-[15px] sm:text-base whitespace-pre-line font-medium">
              {{ currentQuestion.explanation }}
            </div>
          </div>
        </div>

      </div>

      <div
        class="hidden lg:flex flex-col w-80 bg-tryout-surface  shadow-sm border border-tryout-border h-[calc(100vh-8rem)] sticky top-24 transition-colors duration-300">
        <div class="p-6 border-b border-tryout-divider bg-tryout-hover/50">
          <h3 class="font-bold text-tryout-text flex items-center gap-2">
            <svg class="w-5 h-5 text-tryout-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Daftar Soal
          </h3>
        </div>

        <div class="p-5 overflow-y-auto flex-1 custom-scrollbar">
          <div class="grid grid-cols-5 gap-2.5">
            <button v-for="(q, index) in questions" :key="index" @click="goToQuestion(index)"
              :class="['aspect-square rounded-lg text-sm font-bold transition-all flex items-center justify-center border hover:scale-105 active:scale-95', getGridButtonClass(index)]">
              {{ index + 1 }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      class="lg:hidden fixed bottom-0 left-0 right-0 bg-tryout-surface border-t border-tryout-border p-3 pb-safe z-30 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)] transition-colors duration-300">
      <div class="flex items-center justify-between gap-2">
        <button @click="prevQuestion" :disabled="currentIndex === 0"
          class="flex-[1] h-12 flex items-center justify-center bg-tryout-surface border border-tryout-border text-tryout-text rounded-xl font-bold disabled:opacity-40 active:bg-tryout-hover">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button @click="showNavigationPanel = true"
          class="flex-[3] h-12 flex items-center justify-center gap-2 bg-tryout-primary/10 border border-tryout-primary/20 text-tryout-primary rounded-xl font-bold active:bg-tryout-primary/20 shadow-sm">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          Lihat Daftar Soal
        </button>

        <button @click="nextQuestion" :disabled="currentIndex === totalQuestions - 1"
          class="flex-[1] h-12 flex items-center justify-center bg-tryout-surface border border-tryout-border text-tryout-text rounded-xl font-bold disabled:opacity-40 active:bg-tryout-hover">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>

    <div
      class="hidden lg:block fixed bottom-0 left-0 right-0 bg-tryout-surface border-t border-tryout-border z-30 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)] transition-colors duration-300">
      <div class="max-w-7xl mx-auto px-8 py-4 flex items-center w-[calc(100%-22rem)] gap-4">
        <button @click="prevQuestion" :disabled="currentIndex === 0"
          class="flex-1 py-3 flex items-center justify-center gap-2 bg-tryout-surface border border-tryout-border text-tryout-text hover:bg-tryout-hover rounded-xl font-bold transition-all disabled:opacity-40 shadow-sm active:scale-[0.98]">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15 19l-7-7 7-7" />
          </svg> Sebelumnya
        </button>
        <button @click="nextQuestion" :disabled="currentIndex === totalQuestions - 1"
          class="flex-1 py-3 flex items-center justify-center gap-2 bg-tryout-primary border border-tryout-primary text-white hover:opacity-90 rounded-xl font-bold transition-all disabled:opacity-40 shadow-md active:scale-[0.98]">
          Selanjutnya <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        class="lg:hidden fixed bottom-0 left-0 right-0 bg-tryout-surface rounded-t-3xl z-50 flex flex-col h-[70vh] shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
        <div class="p-5 border-b border-tryout-divider flex justify-between items-center bg-tryout-hover rounded-t-3xl">
          <h3 class="font-bold text-tryout-text text-lg flex items-center gap-2">
            <svg class="w-5 h-5 text-tryout-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Daftar Soal
          </h3>
          <button @click="showNavigationPanel = false"
            class="p-2 bg-tryout-surface rounded-full text-tryout-muted shadow-sm border border-tryout-border self-start active:scale-95 transition-transform hover:bg-tryout-hover">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="p-5 overflow-y-auto flex-1 custom-scrollbar pb-safe">
          <div class="grid grid-cols-5 sm:grid-cols-6 gap-3">
            <button v-for="(q, index) in questions" :key="index" @click="goToQuestion(index)"
              :class="['aspect-square rounded-xl text-sm font-bold flex items-center justify-center border transition-all hover:scale-105 active:scale-90', getGridButtonClass(index)]">
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
  background: var(--color-tryout-hover);
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