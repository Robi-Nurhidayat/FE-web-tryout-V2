<script setup>
import { ref, computed } from 'vue'

definePageMeta({
  layout: 'default'
})

const route = useRoute()
const router = useRouter()
const { authToken } = useAuthUser()
const config = useRuntimeConfig()

const userAnswerId = route.params.userAnswerId

// State
const currentIndex = ref(0)

// Fetch pembahasan
const { data: response, pending, error } = await useFetch(
  `/api/v1/user-answers/explain/${userAnswerId}`,
  {
    baseURL: config.public.apiBaseUrl,
    headers: { 'Authorization': `${authToken.value}` }
  }
)


const explanations = ref(response.value?.data || [])

const questionBankId = ref(response.value.data[0].questionBankId)

console.log('Explanations:', explanations.value)

// Helper functions
const isValidImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false
  if (url === 'null' || url === 'undefined') return false
  if (url.trim() === '') return false
  
  const cleanUrl = url.split('?')[0].split('#')[0]
  const imageRegex = /\.(jpg|jpeg|png|webp|gif|bmp|svg|tiff|ico)$/i
  
  return imageRegex.test(cleanUrl)
}

const isQuestionImage = (item) => {
  return isValidImageUrl(item?.questionImage)
}

const isOptionImage = (item, letter) => {
  const imageKey = `imageOption${letter}`
  return isValidImageUrl(item?.[imageKey])
}

const getOptionValue = (item, letter) => {
  const imageKey = `imageOption${letter}`
  const textKey = `option${letter}`
  
  // Priority: image > text
  if (isValidImageUrl(item?.[imageKey])) {
    return item[imageKey]
  }
  
  return item?.[textKey] || ''
}

const getCorrectAnswer = (item) => {
  if (isValidImageUrl(item?.correctAnswerImage)) {
    return item.correctAnswerImage
  }
  return item?.correctAnswerText || '-'
}

const getStatusClass = (item) => {
  if (!item?.userAnswerTitle) {
    return 'bg-gray-100 text-gray-700 border-gray-300'
  }
  return item.status === 1
    ? 'bg-green-100 text-green-700 border-green-300'
    : 'bg-red-100 text-red-700 border-red-300'
}

const getStatusText = (item) => {
  if (!item?.userAnswerTitle) {
    return '⊘ Tidak Dijawab'
  }
  return item.status === 1 ? '✓ Benar' : '✗ Salah'
}

const isCorrectOption = (item, optionValue) => {
  const correctAnswer = getCorrectAnswer(item)
  return correctAnswer === optionValue
}

const isUserOption = (item, optionValue) => {
  return item?.userAnswerTitle === optionValue
}

const getOptionClass = (item, optionValue) => {
  const isCorrect = isCorrectOption(item, optionValue)
  const isUser = isUserOption(item, optionValue)
  
  if (isCorrect && isUser) {
    return 'bg-green-100 border-green-500 ring-2 ring-green-200'
  } else if (isCorrect) {
    return 'bg-green-50 border-green-400'
  } else if (isUser) {
    return 'bg-red-100 border-red-500 ring-2 ring-red-200'
  }
  return 'bg-white border-gray-200'
}

// Computed
const currentQuestion = computed(() => explanations.value[currentIndex.value])
const totalQuestions = computed(() => explanations.value.length)
const answeredCount = computed(() => explanations.value.filter(item => item?.userAnswerTitle).length)
const correctCount = computed(() => explanations.value.filter(item => item?.status === 1).length)
const wrongCount = computed(() => explanations.value.filter(item => item?.userAnswerTitle && item?.status === 0).length)
const skippedCount = computed(() => explanations.value.filter(item => !item?.userAnswerTitle).length)
const totalPoint = computed(() => explanations.value.reduce((sum, item) => sum + (item?.point || 0), 0))

// Navigation
const goToQuestion = (index) => {
  currentIndex.value = index
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


</script>

<template>
  <main class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8">
    
    <!-- Loading -->
    <div v-if="pending" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
        <p class="mt-6 text-gray-700 font-medium">Memuat pembahasan...</p>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="flex items-center justify-center min-h-screen p-4">
      <div class="text-center bg-white p-10 rounded-2xl shadow-2xl max-w-md">
        <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg class="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 class="text-2xl font-bold text-gray-900 mb-3">Gagal Memuat Pembahasan</h3>
        <p class="text-gray-600 mb-6">{{ error.message || 'Terjadi kesalahan' }}</p>
        <button 
          @click="router.back()" 
          class="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all transform hover:scale-105 shadow-lg"
        >
          Kembali
        </button>
      </div>
    </div>

    <!-- Content -->
    <div v-else class="max-w-7xl mx-auto px-4">
      
      <!-- Header Statistics -->
      <div class="bg-white/90 backdrop-blur rounded-2xl shadow-2xl p-8 mb-8 border border-gray-100">
        <div class="flex justify-between items-center mb-6">
          <h1 class="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            📊 Hasil & Pembahasan
          </h1>
          <NuxtLink
            :to="`/tryout/${questionBankId}/info`"
            class="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold rounded-xl transition-all shadow-lg"
          >
            ← Selesai
          </NuxtLink>
        </div>
        
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 text-center border border-blue-200">
            <div class="text-4xl font-bold text-blue-600">{{ totalQuestions }}</div>
            <div class="text-sm text-gray-700 mt-2 font-medium">Total Soal</div>
          </div>
          
          <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 text-center border border-green-200">
            <div class="text-4xl font-bold text-green-600">{{ correctCount }}</div>
            <div class="text-sm text-gray-700 mt-2 font-medium">Benar</div>
          </div>
          
          <div class="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 text-center border border-red-200">
            <div class="text-4xl font-bold text-red-600">{{ wrongCount }}</div>
            <div class="text-sm text-gray-700 mt-2 font-medium">Salah</div>
          </div>
          
          <div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 text-center border border-gray-200">
            <div class="text-4xl font-bold text-gray-600">{{ skippedCount }}</div>
            <div class="text-sm text-gray-700 mt-2 font-medium">Tidak Dijawab</div>
          </div>
          
          <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 text-center border border-purple-200">
            <div class="text-4xl font-bold text-purple-600">{{ totalPoint }}</div>
            <div class="text-sm text-gray-700 mt-2 font-medium">Total Poin</div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="flex gap-8">
        
        <!-- Question Detail -->
        <div class="flex-1">
          <div v-if="currentQuestion" class="bg-white/90 backdrop-blur rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            
            <!-- Header -->
            <div class="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white">
              <div class="flex justify-between items-center">
                <div class="flex items-center gap-3">
                  <div class="bg-white/20 backdrop-blur px-5 py-2 rounded-full">
                    <span class="font-bold text-lg">Soal {{ currentIndex + 1 }}</span>
                  </div>
                  <span v-if="currentQuestion.mainTopic" class="px-4 py-2 bg-white/20 backdrop-blur rounded-full text-sm font-semibold">
                    {{ currentQuestion.mainTopic }}
                  </span>
                  <span v-if="currentQuestion.subTopic" class="px-4 py-2 bg-white/10 backdrop-blur rounded-full text-sm">
                    {{ currentQuestion.subTopic }}
                  </span>
                </div>
                <div class="px-5 py-2 rounded-xl font-bold border-2" :class="getStatusClass(currentQuestion)">
                  {{ getStatusText(currentQuestion) }}
                </div>
              </div>
            </div>

            <!-- Question Content -->
            <div class="p-8">
              
              <!-- Question -->
              <div class="mb-8">
                <h3 class="font-semibold text-gray-700 mb-4 text-lg">Pertanyaan:</h3>
                <div v-if="isQuestionImage(currentQuestion)" class="flex justify-center mb-4">
                  <img 
                    :src="currentQuestion.questionImage" 
                    alt="Question"
                    class="max-w-full max-h-[400px] w-auto h-auto rounded-xl border-2 border-gray-200 shadow-lg object-contain"
                    @error="(e) => e.target.style.display = 'none'"
                  />
                </div>
                <p v-else-if="currentQuestion.questionText" class="text-gray-800 text-lg leading-relaxed">
                  {{ currentQuestion.questionText }}
                </p>
              </div>

              <!-- Options -->
              <div class="space-y-3 mb-8">
                <div 
                  v-for="letter in ['A', 'B', 'C', 'D', 'E']"
                  :key="letter"
                  v-show="getOptionValue(currentQuestion, letter)"
                  class="border-2 rounded-xl p-4 transition-all"
                  :class="getOptionClass(currentQuestion, getOptionValue(currentQuestion, letter))"
                >
                  <div class="flex items-start gap-3">
                    <span class="font-bold text-lg text-gray-900 flex-shrink-0">{{ letter }}.</span>
                    <div class="flex-1">
                      <!-- Image Option -->
                      <div v-if="isOptionImage(currentQuestion, letter)" class="flex justify-center">
                        <img 
                          :src="currentQuestion[`imageOption${letter}`]" 
                          :alt="`Option ${letter}`"
                          class="max-w-full max-h-[300px] w-auto h-auto rounded-lg border border-gray-300 shadow-md object-contain"
                          @error="(e) => e.target.style.display = 'none'"
                        />
                      </div>
                      <!-- Text Option -->
                      <span v-else class="text-gray-700 text-lg">
                        {{ currentQuestion[`option${letter}`] }}
                      </span>
                      
                      <!-- Indicators -->
                      <div class="flex gap-2 mt-3 justify-center">
                        <span 
                          v-if="isCorrectOption(currentQuestion, getOptionValue(currentQuestion, letter))"
                          class="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full"
                        >
                          ✓ Jawaban Benar
                        </span>
                        <span 
                          v-if="isUserOption(currentQuestion, getOptionValue(currentQuestion, letter))"
                          class="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full"
                        >
                          👤 Jawaban Anda
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ✅ Pembahasan Section - TEXT & IMAGE SEBELAHAN -->
              <div v-if="currentQuestion.explanation || isValidImageUrl(currentQuestion.explanationImage)" class="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6">
                <div class="flex items-center gap-3 mb-4">
                  <div class="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h4 class="font-bold text-blue-800 text-xl">💡 Pembahasan</h4>
                </div>
                
                <!-- ✅ Content: Text & Image SEBELAHAN -->
                <div class="flex items-start gap-6">
                 
                  
                  <!-- Image Explanation -->
                  <div v-if="isValidImageUrl(currentQuestion.explanationImage)" class="flex-shrink-0">
                    <img 
                      :src="currentQuestion.explanationImage" 
                      alt="Pembahasan" 
                      class="max-w-sm max-h-[300px] w-auto h-auto rounded-xl border-2 border-blue-300 shadow-lg object-contain"
                      @error="(e) => e.target.style.display = 'none'"
                    />
                  </div>
                   <!-- Text Explanation -->
                  <p v-if="currentQuestion.explanation" class="flex-1 text-gray-700 leading-relaxed text-lg">
                    {{ currentQuestion.explanation }}
                  </p>
                </div>
              </div>

              <!-- Point Info -->
              <div class="mt-6 flex justify-between items-center">
                <div class="text-sm text-gray-600">
                  <span class="font-semibold">Poin yang didapat: </span>
                  <span :class="currentQuestion.point > 0 ? 'text-green-600 font-bold text-lg' : 'text-gray-500'">
                    {{ currentQuestion.point || 0 }}
                  </span>
                </div>
              </div>

            </div>

            <!-- Navigation -->
            <div class="bg-gray-50 p-6 flex justify-between border-t">
              <button
                @click="prevQuestion"
                :disabled="currentIndex === 0"
                class="px-6 py-3 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-gray-300 text-gray-700 font-semibold rounded-xl transition-all shadow-md"
              >
                ← Soal Sebelumnya
              </button>

              <button
                @click="nextQuestion"
                :disabled="currentIndex === totalQuestions - 1"
                class="px-6 py-3 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-gray-300 text-gray-700 font-semibold rounded-xl transition-all shadow-md"
              >
                Soal Selanjutnya →
              </button>
            </div>

          </div>
        </div>

        <!-- Sidebar Navigation -->
        <div class="w-80">
          <div class="bg-white/90 backdrop-blur rounded-2xl shadow-2xl border border-gray-100 p-6 sticky top-8">
            <h3 class="text-lg font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div class="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              Navigasi Soal
            </h3>

            <!-- Legend -->
            <div class="mb-6 p-4 bg-gray-50 rounded-xl space-y-3 text-sm">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-green-400 rounded-lg"></div>
                <span class="text-gray-700 font-medium">Benar</span>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-red-400 rounded-lg"></div>
                <span class="text-gray-700 font-medium">Salah</span>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-gray-300 rounded-lg"></div>
                <span class="text-gray-700 font-medium">Tidak Dijawab</span>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-indigo-500 rounded-lg ring-4 ring-indigo-200"></div>
                <span class="text-gray-700 font-medium">Soal Aktif</span>
              </div>
            </div>

            <!-- Grid -->
            <div class="grid grid-cols-5 gap-2 max-h-[500px] overflow-y-auto">
              <button 
                v-for="(item, index) in explanations" 
                :key="index"
                @click="goToQuestion(index)" 
                class="aspect-square rounded-xl font-bold text-sm transition-all transform hover:scale-110 shadow-md"
                :class="[
                  currentIndex === index 
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white ring-4 ring-indigo-300 scale-110' 
                    : !item?.userAnswerTitle
                    ? 'bg-gray-300 text-gray-700'
                    : item.status === 1
                    ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white'
                    : 'bg-gradient-to-br from-red-400 to-red-500 text-white'
                ]"
              >
                {{ index + 1 }}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>

  </main>
</template>