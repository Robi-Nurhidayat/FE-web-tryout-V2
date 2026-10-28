<script setup>
definePageMeta({
  layout: 'admin'
})

const router = useRouter()
const route = useRoute()
const questionItemId = route.params.id
const { authToken } = useAuthUser()
const config = useRuntimeConfig()

// ✅ DEBUGGING: Cek format token
console.log("🔍 Raw token:", authToken.value)
console.log("🔍 Token length:", authToken.value?.length)
console.log("🔍 Token type:", typeof authToken.value)

// ✅ Buat computed property untuk clean token (TANPA Bearer)
const cleanToken = computed(() => {
  if (!authToken.value) return null

  // Hanya trim whitespace, newline, dll
  return authToken.value.toString().trim().replace(/[\r\n\t]/g, '')
})

// Fetch existing data
// const { data: existingData, pending } = await useFetch(`http://localhost:9000/api/v1/question-items/${questionItemId}`, {
//   method: 'GET',
//   headers: {
//     'Authorization': `${authToken.value}`
//   }
// }) 

const { data: existingData, pending } = await useFetch(
  `/api/v1/question-items/${questionItemId}`,
  {
    baseURL: config.public.apiBaseUrl,
    method: 'GET',
    headers: {
      Authorization: authToken.value
    }
  }
)

// Form state
const formData = ref({
  questionBankId: '',
  questionText: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  optionE: '',
  correctAnswerText: '',
  explanation: '',
  mainTopic: '',
  subTopic: '',
  scoreOptionA: 0,
  scoreOptionB: 0,
  scoreOptionC: 0,
  scoreOptionD: 0,
  scoreOptionE: 0
})

// File uploads state
const files = ref({
  questionImage: null,
  imageOptionA: null,
  imageOptionB: null,
  imageOptionC: null,
  imageOptionD: null,
  imageOptionE: null,
  correctAnswerImage: null,
  explanationImage: null  // ✅ TAMBAHAN
})

const previews = ref({
  questionImage: null,
  imageOptionA: null,
  imageOptionB: null,
  imageOptionC: null,
  imageOptionD: null,
  imageOptionE: null,
  correctAnswerImage: null,
  explanationImage: null  // ✅ TAMBAHAN
})

// Existing images from server
const existingImages = ref({
  questionImage: null,
  imageOptionA: null,
  imageOptionB: null,
  imageOptionC: null,
  imageOptionD: null,
  imageOptionE: null,
  correctAnswerImage: null,
  explanationImage: null  // ✅ TAMBAHAN
})

const isLoading = ref(false)
const errorMsg = ref('')

// ✅ Populate form dengan data existing
watchEffect(() => {
  if (existingData.value?.data) {
    const data = existingData.value.data

    formData.value = {
      questionBankId: data.questionBankId || '',
      questionText: data.questionText || '',
      optionA: data.optionA || '',
      optionB: data.optionB || '',
      optionC: data.optionC || '',
      optionD: data.optionD || '',
      optionE: data.optionE || '',
      correctAnswerText: data.correctAnswerText || '',
      explanation: data.explanation || '',
      mainTopic: data.mainTopic || '',
      subTopic: data.subTopic || '',
      scoreOptionA: data.scoreOptionA || 0,
      scoreOptionB: data.scoreOptionB || 0,
      scoreOptionC: data.scoreOptionC || 0,
      scoreOptionD: data.scoreOptionD || 0,
      scoreOptionE: data.scoreOptionE || 0
    }

    // Set existing images
    existingImages.value = {
      questionImage: data.questionImage || null,
      imageOptionA: data.imageOptionA || null,
      imageOptionB: data.imageOptionB || null,
      imageOptionC: data.imageOptionC || null,
      imageOptionD: data.imageOptionD || null,
      imageOptionE: data.imageOptionE || null,
      correctAnswerImage: data.correctAnswerImage || null,
      explanationImage: data.explanationImage || null  // ✅ TAMBAHAN
    }
  }
})

// ✅ Function untuk validasi image
const hasValidImage = (imageUrl) => {
  if (!imageUrl || imageUrl.trim() === '' || imageUrl === '-') {
    return false
  }

  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico']
  return imageExtensions.some(ext => imageUrl.toLowerCase().includes(ext))
}

const handleFileChange = (fieldName, event) => {
  const file = event.target.files[0]

  if (!file) return

  const maxSize = 2 * 1024 * 1024
  if (file.size > maxSize) {
    errorMsg.value = `${fieldName}: Ukuran file maksimal 2MB`
    return
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    errorMsg.value = `${fieldName}: Format file harus JPG, PNG, atau WEBP`
    return
  }

  errorMsg.value = ''
  files.value[fieldName] = file
  previews.value[fieldName] = URL.createObjectURL(file)

  // Clear existing image ketika upload baru
  existingImages.value[fieldName] = null
}

const removeFile = (fieldName) => {
  if (previews.value[fieldName]) {
    URL.revokeObjectURL(previews.value[fieldName])
  }

  files.value[fieldName] = null
  previews.value[fieldName] = null
}

const removeExistingImage = (fieldName) => {
  existingImages.value[fieldName] = null
  // Tandai untuk dihapus di backend (opsional, tergantung implementasi backend)
}

const submitForm = async () => {
  try {
    isLoading.value = true
    errorMsg.value = ''

    // ✅ Validasi token ada
    if (!cleanToken.value) {
      errorMsg.value = 'Token autentikasi tidak ditemukan. Silakan login kembali.'
      return
    }

    // Validasi minimal
    if (!formData.value.questionText && !files.value.questionImage && !existingImages.value.questionImage) {
      errorMsg.value = 'Pertanyaan harus diisi (teks atau gambar)'
      return
    }

    // Buat FormData
    const formDataToSend = new FormData()

    // Append text fields
    Object.keys(formData.value).forEach(key => {
      formDataToSend.append(key, formData.value[key])
    })

    // Append files (hanya yang baru di-upload)
    Object.keys(files.value).forEach(key => {
      if (files.value[key]) {
        formDataToSend.append(key, files.value[key])
      }
    })

    // ✅ Append existing images yang masih dipertahankan
    Object.keys(existingImages.value).forEach(key => {
      if (existingImages.value[key] && !files.value[key]) {
        formDataToSend.append(`existing_${key}`, existingImages.value[key])
      }
    })

    // ✅ Debug: Log token yang akan dikirim
    console.log('🚀 Sending token:', cleanToken.value)
    console.log('🚀 Token preview:', cleanToken.value.substring(0, 20) + '...')
    console.log('🚀 Has whitespace:', /\s/.test(cleanToken.value))

    // Kirim ke backend dengan PUT
    const response = await $fetch(`/api/v1/question-items/${questionItemId}`, {
      baseURL: config.public.apiBaseUrl,
      method: 'PUT',
      headers: {
        Authorization: cleanToken.value
      },
      body: formDataToSend
    })

    console.log('✅ Success:', response)

    // Redirect ke detail question bank
    router.push(`/admin/question-bank/${formData.value.questionBankId}/detail`)

  } catch (error) {
    console.error('❌ Error detail:', error)
    console.error('❌ Error status:', error.status)
    console.error('❌ Error data:', error.data)

    if (error.status === 403) {
      errorMsg.value = 'Akses ditolak. Token tidak valid atau Anda tidak memiliki role ADMIN.'
    } else if (error.status === 401) {
      errorMsg.value = 'Sesi Anda telah berakhir. Silakan login kembali.'
    } else {
      errorMsg.value = error.data?.message || 'Terjadi kesalahan saat menyimpan data'
    }
  } finally {
    isLoading.value = false
  }
}

onUnmounted(() => {
  Object.values(previews.value).forEach(url => {
    if (url) URL.revokeObjectURL(url)
  })
})
</script>

<template>
  <main class="min-h-screen bg-gray-50 p-8">
    <div class="max-w-5xl mx-auto bg-white rounded-2xl shadow p-8">
      <h1 class="text-2xl font-bold text-gray-800 mb-6">Edit Question Item #{{ questionItemId }}</h1>

      <!-- Loading State -->
      <div v-if="pending" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p class="mt-4 text-gray-600">Loading data...</p>
      </div>

      <form v-else @submit.prevent="submitForm" class="space-y-8">

        <!-- ==================== GRUP 1: KONTEN TEKS ==================== -->
        <div class="border-2 border-blue-200 rounded-xl p-6 bg-blue-50">
          <h2 class="text-xl font-bold text-blue-800 mb-6 flex items-center">
            <span class="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3">1</span>
            Question Type Text
          </h2>

          <!-- Question Text -->
          <div class="mb-6">
            <label class="block text-gray-700 font-semibold mb-2">Teks Pertanyaan</label>
            <textarea v-model="formData.questionText" placeholder="Masukkan pertanyaan dalam bentuk teks" rows="4"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"></textarea>
          </div>

          <!-- Options Text -->
          <div class="grid grid-cols-1 gap-4 mb-6">
            <div>
              <label class="block text-gray-700 font-semibold mb-2">Opsi A (Teks)</label>
              <input v-model="formData.optionA" type="text" placeholder="Masukkan teks untuk opsi A"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>

            <div>
              <label class="block text-gray-700 font-semibold mb-2">Opsi B (Teks)</label>
              <input v-model="formData.optionB" type="text" placeholder="Masukkan teks untuk opsi B"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>

            <div>
              <label class="block text-gray-700 font-semibold mb-2">Opsi C (Teks)</label>
              <input v-model="formData.optionC" type="text" placeholder="Masukkan teks untuk opsi C"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>

            <div>
              <label class="block text-gray-700 font-semibold mb-2">Opsi D (Teks)</label>
              <input v-model="formData.optionD" type="text" placeholder="Masukkan teks untuk opsi D"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>

            <div>
              <label class="block text-gray-700 font-semibold mb-2">Opsi E (Teks)</label>
              <input v-model="formData.optionE" type="text" placeholder="Masukkan teks untuk opsi E"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
          </div>

          <!-- Correct Answer Text -->
          <div class="mb-6">
            <label class="block text-gray-700 font-semibold mb-2">Jawaban Benar (Teks)</label>
            <input v-model="formData.correctAnswerText" type="text"
              placeholder="Contoh: A, B, C, D, E atau teks jawaban lengkap"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>

          <!-- Explanation -->
          <div>
            <label class="block text-gray-700 font-semibold mb-2">Penjelasan (Teks)</label>
            <textarea v-model="formData.explanation" placeholder="Masukkan penjelasan mengapa jawaban ini benar"
              rows="4"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"></textarea>
          </div>
        </div>

        <!-- ==================== GRUP 2: KONTEN GAMBAR ==================== -->
        <div class="border-2 border-purple-200 rounded-xl p-6 bg-purple-50">
          <h2 class="text-xl font-bold text-purple-800 mb-6 flex items-center">
            <span class="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3">2</span>
            Question Type Image
          </h2>

          <!-- Question Image -->
          <div class="mb-6">
            <label class="block text-gray-700 font-semibold mb-2">Gambar Pertanyaan</label>

            <!-- Existing Image -->
            <div v-if="existingImages.questionImage && hasValidImage(existingImages.questionImage)" class="mb-3">
              <p class="text-sm text-gray-600 mb-2">Gambar saat ini:</p>
              <div class="relative inline-block">
                <img :src="existingImages.questionImage"
                  class="w-40 h-40 object-cover rounded-lg border-2 border-purple-300" />
                <button type="button" @click="removeExistingImage('questionImage')"
                  class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 shadow-lg">
                  ×
                </button>
              </div>
            </div>

            <input type="file" accept="image/*" @change="handleFileChange('questionImage', $event)"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" />
            <p class="text-sm text-gray-500 mt-1">Upload gambar baru untuk mengganti gambar lama</p>

            <!-- New Image Preview -->
            <div v-if="previews.questionImage" class="mt-3 relative inline-block">
              <p class="text-sm text-green-600 mb-2">Preview gambar baru:</p>
              <img :src="previews.questionImage" class="w-40 h-40 object-cover rounded-lg border-2 border-green-400" />
              <button type="button" @click="removeFile('questionImage')"
                class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 shadow-lg">
                ×
              </button>
            </div>
          </div>

          <!-- Options Images -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <!-- Image Option A -->
            <div>
              <label class="block text-gray-700 font-semibold mb-2">Gambar Opsi A</label>

              <!-- Existing Image -->
              <div v-if="existingImages.imageOptionA && hasValidImage(existingImages.imageOptionA)" class="mb-3">
                <p class="text-sm text-gray-600 mb-2">Gambar saat ini:</p>
                <div class="relative inline-block">
                  <img :src="existingImages.imageOptionA"
                    class="w-32 h-32 object-cover rounded-lg border-2 border-purple-300" />
                  <button type="button" @click="removeExistingImage('imageOptionA')"
                    class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 shadow-lg">
                    ×
                  </button>
                </div>
              </div>

              <input type="file" accept="image/*" @change="handleFileChange('imageOptionA', $event)"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" />
              <div v-if="previews.imageOptionA" class="mt-3 relative inline-block">
                <p class="text-sm text-green-600 mb-2">Preview baru:</p>
                <img :src="previews.imageOptionA" class="w-32 h-32 object-cover rounded-lg border-2 border-green-400" />
                <button type="button" @click="removeFile('imageOptionA')"
                  class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 shadow-lg">
                  ×
                </button>
              </div>
            </div>

            <!-- Image Option B -->
            <div>
              <label class="block text-gray-700 font-semibold mb-2">Gambar Opsi B</label>

              <div v-if="existingImages.imageOptionB && hasValidImage(existingImages.imageOptionB)" class="mb-3">
                <p class="text-sm text-gray-600 mb-2">Gambar saat ini:</p>
                <div class="relative inline-block">
                  <img :src="existingImages.imageOptionB"
                    class="w-32 h-32 object-cover rounded-lg border-2 border-purple-300" />
                  <button type="button" @click="removeExistingImage('imageOptionB')"
                    class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 shadow-lg">
                    ×
                  </button>
                </div>
              </div>

              <input type="file" accept="image/*" @change="handleFileChange('imageOptionB', $event)"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" />
              <div v-if="previews.imageOptionB" class="mt-3 relative inline-block">
                <p class="text-sm text-green-600 mb-2">Preview baru:</p>
                <img :src="previews.imageOptionB" class="w-32 h-32 object-cover rounded-lg border-2 border-green-400" />
                <button type="button" @click="removeFile('imageOptionB')"
                  class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 shadow-lg">
                  ×
                </button>
              </div>
            </div>

            <!-- Image Option C -->
            <div>
              <label class="block text-gray-700 font-semibold mb-2">Gambar Opsi C</label>

              <div v-if="existingImages.imageOptionC && hasValidImage(existingImages.imageOptionC)" class="mb-3">
                <p class="text-sm text-gray-600 mb-2">Gambar saat ini:</p>
                <div class="relative inline-block">
                  <img :src="existingImages.imageOptionC"
                    class="w-32 h-32 object-cover rounded-lg border-2 border-purple-300" />
                  <button type="button" @click="removeExistingImage('imageOptionC')"
                    class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 shadow-lg">
                    ×
                  </button>
                </div>
              </div>

              <input type="file" accept="image/*" @change="handleFileChange('imageOptionC', $event)"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" />
              <div v-if="previews.imageOptionC" class="mt-3 relative inline-block">
                <p class="text-sm text-green-600 mb-2">Preview baru:</p>
                <img :src="previews.imageOptionC" class="w-32 h-32 object-cover rounded-lg border-2 border-green-400" />
                <button type="button" @click="removeFile('imageOptionC')"
                  class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 shadow-lg">
                  ×
                </button>
              </div>
            </div>

            <!-- Image Option D -->
            <div>
              <label class="block text-gray-700 font-semibold mb-2">Gambar Opsi D</label>

              <div v-if="existingImages.imageOptionD && hasValidImage(existingImages.imageOptionD)" class="mb-3">
                <p class="text-sm text-gray-600 mb-2">Gambar saat ini:</p>
                <div class="relative inline-block">
                  <img :src="existingImages.imageOptionD"
                    class="w-32 h-32 object-cover rounded-lg border-2 border-purple-300" />
                  <button type="button" @click="removeExistingImage('imageOptionD')"
                    class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 shadow-lg">
                    ×
                  </button>
                </div>
              </div>

              <input type="file" accept="image/*" @change="handleFileChange('imageOptionD', $event)"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" />
              <div v-if="previews.imageOptionD" class="mt-3 relative inline-block">
                <p class="text-sm text-green-600 mb-2">Preview baru:</p>
                <img :src="previews.imageOptionD" class="w-32 h-32 object-cover rounded-lg border-2 border-green-400" />
                <button type="button" @click="removeFile('imageOptionD')"
                  class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 shadow-lg">
                  ×
                </button>
              </div>
            </div>

            <!-- Image Option E -->
            <div>
              <label class="block text-gray-700 font-semibold mb-2">Gambar Opsi E</label>

              <div v-if="existingImages.imageOptionE && hasValidImage(existingImages.imageOptionE)" class="mb-3">
                <p class="text-sm text-gray-600 mb-2">Gambar saat ini:</p>
                <div class="relative inline-block">
                  <img :src="existingImages.imageOptionE"
                    class="w-32 h-32 object-cover rounded-lg border-2 border-purple-300" />
                  <button type="button" @click="removeExistingImage('imageOptionE')"
                    class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 shadow-lg">
                    ×
                  </button>
                </div>
              </div>

              <input type="file" accept="image/*" @change="handleFileChange('imageOptionE', $event)"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" />
              <div v-if="previews.imageOptionE" class="mt-3 relative inline-block">
                <p class="text-sm text-green-600 mb-2">Preview baru:</p>
                <img :src="previews.imageOptionE" class="w-32 h-32 object-cover rounded-lg border-2 border-green-400" />
                <button type="button" @click="removeFile('imageOptionE')"
                  class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 shadow-lg">
                  ×
                </button>
              </div>
            </div>
          </div>

          <!-- Correct Answer Image -->
          <div class="mb-6">
            <label class="block text-gray-700 font-semibold mb-2">Gambar Jawaban Benar</label>

            <div v-if="existingImages.correctAnswerImage && hasValidImage(existingImages.correctAnswerImage)"
              class="mb-3">
              <p class="text-sm text-gray-600 mb-2">Gambar saat ini:</p>
              <div class="relative inline-block">
                <img :src="existingImages.correctAnswerImage"
                  class="w-40 h-40 object-cover rounded-lg border-2 border-purple-300" />
                <button type="button" @click="removeExistingImage('correctAnswerImage')"
                  class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 shadow-lg">
                  ×
                </button>
              </div>
            </div>

            <input type="file" accept="image/*" @change="handleFileChange('correctAnswerImage', $event)"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" />
            <p class="text-sm text-gray-500 mt-1">Upload gambar baru untuk mengganti gambar lama</p>
            <div v-if="previews.correctAnswerImage" class="mt-3 relative inline-block">
              <p class="text-sm text-green-600 mb-2">Preview gambar baru:</p>
              <img :src="previews.correctAnswerImage"
                class="w-40 h-40 object-cover rounded-lg border-2 border-green-400" />
              <button type="button" @click="removeFile('correctAnswerImage')"
                class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 shadow-lg">
                ×
              </button>
            </div>
          </div>

          <!-- ✅ TAMBAHAN: Explanation Image -->
          <div>
            <label class="block text-gray-700 font-semibold mb-2">Gambar Pembahasan</label>

            <div v-if="existingImages.explanationImage && hasValidImage(existingImages.explanationImage)" class="mb-3">
              <p class="text-sm text-gray-600 mb-2">Gambar saat ini:</p>
              <div class="relative inline-block">
                <img :src="existingImages.explanationImage"
                  class="w-40 h-40 object-cover rounded-lg border-2 border-purple-300" />
                <button type="button" @click="removeExistingImage('explanationImage')"
                  class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 shadow-lg">
                  ×
                </button>
              </div>
            </div>

            <input type="file" accept="image/*" @change="handleFileChange('explanationImage', $event)"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" />
            <p class="text-sm text-gray-500 mt-1">Upload gambar untuk melengkapi penjelasan (opsional)</p>
            <div v-if="previews.explanationImage" class="mt-3 relative inline-block">
              <p class="text-sm text-green-600 mb-2">Preview gambar baru:</p>
              <img :src="previews.explanationImage"
                class="w-40 h-40 object-cover rounded-lg border-2 border-green-400" />
              <button type="button" @click="removeFile('explanationImage')"
                class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 shadow-lg">
                ×
              </button>
            </div>
          </div>
        </div>

        <!-- ==================== GRUP 3: SCORE UNTUK SETIAP OPSI ==================== -->
        <div class="border-2 border-green-200 rounded-xl p-6 bg-green-50">
          <h2 class="text-xl font-bold text-green-800 mb-6 flex items-center">
            <span class="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3">3</span>
            Bobot Nilai (Score)
          </h2>

          <p class="text-sm text-gray-600 mb-4">Masukkan bobot nilai untuk setiap opsi (digunakan untuk soal TKP atau
            soal dengan sistem penilaian bertingkat)</p>

          <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label class="block text-gray-700 font-semibold mb-2">Score Opsi A</label>
              <input v-model.number="formData.scoreOptionA" type="number" placeholder="0"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none" />
            </div>

            <div>
              <label class="block text-gray-700 font-semibold mb-2">Score Opsi B</label>
              <input v-model.number="formData.scoreOptionB" type="number" placeholder="0"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none" />
            </div>

            <div>
              <label class="block text-gray-700 font-semibold mb-2">Score Opsi C</label>
              <input v-model.number="formData.scoreOptionC" type="number" placeholder="0"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none" />
            </div>

            <div>
              <label class="block text-gray-700 font-semibold mb-2">Score Opsi D</label>
              <input v-model.number="formData.scoreOptionD" type="number" placeholder="0"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none" />
            </div>

            <div>
              <label class="block text-gray-700 font-semibold mb-2">Score Opsi E</label>
              <input v-model.number="formData.scoreOptionE" type="number" placeholder="0"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none" />
            </div>
          </div>
        </div>

        <!-- ==================== GRUP 4: TOPIK & KATEGORI ==================== -->
        <div class="border-2 border-orange-200 rounded-xl p-6 bg-orange-50">
          <h2 class="text-xl font-bold text-orange-800 mb-6 flex items-center">
            <span class="bg-orange-600 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3">4</span>
            Topik & Kategori
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-gray-700 font-semibold mb-2">Sub Topic</label>
              <input v-model="formData.subTopic" type="text" placeholder="Contoh: Kepribadian, Logika, Sejarah"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none" />
            </div>

            <div>
              <label class="block text-gray-700 font-semibold mb-2">Main Topic</label>
              <input v-model="formData.mainTopic" type="text" placeholder="Contoh: TKP, TIU, TWK"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none" />
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <p v-if="errorMsg" class="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
          {{ errorMsg }}
        </p>

        <!-- Action Buttons -->
        <div class="flex justify-end gap-3 pt-6 border-t">
          <button type="button" @click="router.back()"
            class="px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition">
            Batal
          </button>
          <button type="submit" :disabled="isLoading"
            class="px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
            {{ isLoading ? 'Menyimpan...' : 'Update Question' }}
          </button>
        </div>
      </form>
    </div>
  </main>
</template>