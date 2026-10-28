<script setup>
definePageMeta({
  layout: 'admin'
})

const router = useRouter()
const route = useRoute()
const questionBankId = route.params.id
const { authToken } = useAuthUser()

console.log("token:", authToken.value)


// Form state
const formData = ref({
  questionBankId: questionBankId,
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
  correctAnswerImage: null
})

// Preview images
const previews = ref({
  questionImage: null,
  imageOptionA: null,
  imageOptionB: null,
  imageOptionC: null,
  imageOptionD: null,
  imageOptionE: null,
  correctAnswerImage: null
})

const isLoading = ref(false)
const errorMsg = ref('')

// Handle file selection
const handleFileChange = (field, event) => {
  const file = event.target.files[0]
  if (file) {
    files.value[field] = file
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      previews.value[field] = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

// Remove file
const removeFile = (field) => {
  files.value[field] = null
  previews.value[field] = null
}

// Submit form
const submitForm = async () => {
  isLoading.value = true
  errorMsg.value = ''

  try {
    // ✅ authToken.value sudah otomatis ambil dari cookie
    if (!authToken.value) {
      throw new Error('Token tidak ditemukan. Silakan login kembali.')
    }

    console.log("Token yang akan dikirim:", authToken.value)

    const formDataToSend = new FormData()
    
    // Append text fields
    formDataToSend.append('questionBankId', formData.value.questionBankId)
    formDataToSend.append('questionText', formData.value.questionText)
    formDataToSend.append('optionA', formData.value.optionA)
    formDataToSend.append('optionB', formData.value.optionB)
    formDataToSend.append('optionC', formData.value.optionC)
    formDataToSend.append('optionD', formData.value.optionD)
    formDataToSend.append('optionE', formData.value.optionE)
    formDataToSend.append('correctAnswerText', formData.value.correctAnswerText)
    formDataToSend.append('explanation', formData.value.explanation)
    formDataToSend.append('mainTopic', formData.value.mainTopic)
    formDataToSend.append('subTopic', formData.value.subTopic)
    formDataToSend.append('scoreOptionA', formData.value.scoreOptionA)
    formDataToSend.append('scoreOptionB', formData.value.scoreOptionB)
    formDataToSend.append('scoreOptionC', formData.value.scoreOptionC)
    formDataToSend.append('scoreOptionD', formData.value.scoreOptionD)
    formDataToSend.append('scoreOptionE', formData.value.scoreOptionE)

    // Append files if exists
    if (files.value.questionImage) {
      formDataToSend.append('questionImage', files.value.questionImage)
    }
    if (files.value.imageOptionA) {
      formDataToSend.append('imageOptionA', files.value.imageOptionA)
    }
    if (files.value.imageOptionB) {
      formDataToSend.append('imageOptionB', files.value.imageOptionB)
    }
    if (files.value.imageOptionC) {
      formDataToSend.append('imageOptionC', files.value.imageOptionC)
    }
    if (files.value.imageOptionD) {
      formDataToSend.append('imageOptionD', files.value.imageOptionD)
    }
    if (files.value.imageOptionE) {
      formDataToSend.append('imageOptionE', files.value.imageOptionE)
    }
    if (files.value.correctAnswerImage) {
      formDataToSend.append('correctAnswerImage', files.value.correctAnswerImage)
    }

    // Debug FormData
    console.log("=== Form Data Content ===")
    for (let [key, value] of formDataToSend.entries()) {
      if (value instanceof File) {
        console.log(key, ':', `File - ${value.name} (${value.size} bytes)`)
      } else {
        console.log(key, ':', value)
      }
    }

    // ✅ KIRIM REQUEST dengan fetch native
    const response = await fetch('http://localhost:9000/api/v1/question-items', {
      method: 'POST',
      headers: {
        'Authorization': authToken.value  // ✅ Token dari cookie via composable
      },
      body: formDataToSend
    })

    console.log("Response Status:", response.status)
    console.log("Response OK:", response.ok)

    // Handle response
    const contentType = response.headers.get('content-type')
    let data

    if (contentType && contentType.includes('application/json')) {
      data = await response.json()
      console.log("Response Data:", data)
    } else {
      const text = await response.text()
      console.log("Response Text:", text.substring(0, 500))
      
      if (response.status === 403) {
        errorMsg.value = 'Access Denied: Anda tidak memiliki akses atau token tidak valid'
        return
      }
      
      throw new Error(`Server error ${response.status}`)
    }

    // Success handling
    if (response.ok) {
      alert('Question berhasil ditambahkan!')
      router.push(`/admin/question-banks/${questionBankId}`)
    } else {
      errorMsg.value = data.message || `Error ${response.status}: Gagal menambahkan question`
    }

  } catch (error) {
    console.error('Submit Error:', error)
    errorMsg.value = error.message || 'Terjadi kesalahan saat menyimpan data'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <main class="min-h-screen bg-gray-50 p-8">
    <div class="max-w-5xl mx-auto bg-white rounded-2xl shadow p-8">
      <h1 class="text-2xl font-bold text-gray-800 mb-6">Tambah Question Item</h1>

      <form @submit.prevent="submitForm" class="space-y-8">
        
        <!-- ==================== GRUP 1: KONTEN TEKS ==================== -->
        <div class="border-2 border-blue-200 rounded-xl p-6 bg-blue-50">
          <h2 class="text-xl font-bold text-blue-800 mb-6 flex items-center">
            <span class="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3">1</span>
            Question Type Text
          </h2>
          
          <!-- Question Text -->
          <div class="mb-6">
            <label class="block text-gray-700 font-semibold mb-2">Teks Pertanyaan</label>
            <textarea
              v-model="formData.questionText"
              placeholder="Masukkan pertanyaan dalam bentuk teks"
              rows="4"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            ></textarea>
          </div>

          <!-- Options Text -->
          <div class="grid grid-cols-1 gap-4 mb-6">
            <div>
              <label class="block text-gray-700 font-semibold mb-2">Opsi A (Teks)</label>
              <input
                v-model="formData.optionA"
                type="text"
                placeholder="Masukkan teks untuk opsi A"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label class="block text-gray-700 font-semibold mb-2">Opsi B (Teks)</label>
              <input
                v-model="formData.optionB"
                type="text"
                placeholder="Masukkan teks untuk opsi B"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label class="block text-gray-700 font-semibold mb-2">Opsi C (Teks)</label>
              <input
                v-model="formData.optionC"
                type="text"
                placeholder="Masukkan teks untuk opsi C"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label class="block text-gray-700 font-semibold mb-2">Opsi D (Teks)</label>
              <input
                v-model="formData.optionD"
                type="text"
                placeholder="Masukkan teks untuk opsi D"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label class="block text-gray-700 font-semibold mb-2">Opsi E (Teks)</label>
              <input
                v-model="formData.optionE"
                type="text"
                placeholder="Masukkan teks untuk opsi E"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <!-- Correct Answer Text -->
          <div class="mb-6">
            <label class="block text-gray-700 font-semibold mb-2">Jawaban Benar (Teks)</label>
            <input
              v-model="formData.correctAnswerText"
              type="text"
              placeholder="Contoh: A, B, C, D, E atau teks jawaban lengkap"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <!-- Explanation -->
          <div>
            <label class="block text-gray-700 font-semibold mb-2">Penjelasan</label>
            <textarea
              v-model="formData.explanation"
              placeholder="Masukkan penjelasan mengapa jawaban ini benar"
              rows="4"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            ></textarea>
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
            <input
              type="file"
              accept="image/*"
              @change="handleFileChange('questionImage', $event)"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
            <p class="text-sm text-gray-500 mt-1">Upload gambar jika pertanyaan berbentuk gambar/figural</p>
            <div v-if="previews.questionImage" class="mt-3 relative inline-block">
              <img :src="previews.questionImage" class="w-40 h-40 object-cover rounded-lg border-2 border-purple-300" />
              <button
                type="button"
                @click="removeFile('questionImage')"
                class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 shadow-lg"
              >
                ×
              </button>
            </div>
          </div>

          <!-- Options Images -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <!-- Image Option A -->
            <div>
              <label class="block text-gray-700 font-semibold mb-2">Gambar Opsi A</label>
              <input
                type="file"
                accept="image/*"
                @change="handleFileChange('imageOptionA', $event)"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <div v-if="previews.imageOptionA" class="mt-3 relative inline-block">
                <img :src="previews.imageOptionA" class="w-32 h-32 object-cover rounded-lg border-2 border-purple-300" />
                <button
                  type="button"
                  @click="removeFile('imageOptionA')"
                  class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 shadow-lg"
                >
                  ×
                </button>
              </div>
            </div>

            <!-- Image Option B -->
            <div>
              <label class="block text-gray-700 font-semibold mb-2">Gambar Opsi B</label>
              <input
                type="file"
                accept="image/*"
                @change="handleFileChange('imageOptionB', $event)"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <div v-if="previews.imageOptionB" class="mt-3 relative inline-block">
                <img :src="previews.imageOptionB" class="w-32 h-32 object-cover rounded-lg border-2 border-purple-300" />
                <button
                  type="button"
                  @click="removeFile('imageOptionB')"
                  class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 shadow-lg"
                >
                  ×
                </button>
              </div>
            </div>

            <!-- Image Option C -->
            <div>
              <label class="block text-gray-700 font-semibold mb-2">Gambar Opsi C</label>
              <input
                type="file"
                accept="image/*"
                @change="handleFileChange('imageOptionC', $event)"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <div v-if="previews.imageOptionC" class="mt-3 relative inline-block">
                <img :src="previews.imageOptionC" class="w-32 h-32 object-cover rounded-lg border-2 border-purple-300" />
                <button
                  type="button"
                  @click="removeFile('imageOptionC')"
                  class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 shadow-lg"
                >
                  ×
                </button>
              </div>
            </div>

            <!-- Image Option D -->
            <div>
              <label class="block text-gray-700 font-semibold mb-2">Gambar Opsi D</label>
              <input
                type="file"
                accept="image/*"
                @change="handleFileChange('imageOptionD', $event)"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <div v-if="previews.imageOptionD" class="mt-3 relative inline-block">
                <img :src="previews.imageOptionD" class="w-32 h-32 object-cover rounded-lg border-2 border-purple-300" />
                <button
                  type="button"
                  @click="removeFile('imageOptionD')"
                  class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 shadow-lg"
                >
                  ×
                </button>
              </div>
            </div>

            <!-- Image Option E -->
            <div>
              <label class="block text-gray-700 font-semibold mb-2">Gambar Opsi E</label>
              <input
                type="file"
                accept="image/*"
                @change="handleFileChange('imageOptionE', $event)"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <div v-if="previews.imageOptionE" class="mt-3 relative inline-block">
                <img :src="previews.imageOptionE" class="w-32 h-32 object-cover rounded-lg border-2 border-purple-300" />
                <button
                  type="button"
                  @click="removeFile('imageOptionE')"
                  class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 shadow-lg"
                >
                  ×
                </button>
              </div>
            </div>
          </div>

          <!-- Correct Answer Image -->
          <div>
            <label class="block text-gray-700 font-semibold mb-2">Gambar Jawaban Benar</label>
            <input
              type="file"
              accept="image/*"
              @change="handleFileChange('correctAnswerImage', $event)"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
            <p class="text-sm text-gray-500 mt-1">Upload gambar jika jawaban benar berbentuk gambar</p>
            <div v-if="previews.correctAnswerImage" class="mt-3 relative inline-block">
              <img :src="previews.correctAnswerImage" class="w-40 h-40 object-cover rounded-lg border-2 border-purple-300" />
              <button
                type="button"
                @click="removeFile('correctAnswerImage')"
                class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 shadow-lg"
              >
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
          
          <p class="text-sm text-gray-600 mb-4">Masukkan bobot nilai untuk setiap opsi (digunakan untuk soal TKP atau soal dengan sistem penilaian bertingkat)</p>

          <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label class="block text-gray-700 font-semibold mb-2">Score Opsi A</label>
              <input
                v-model.number="formData.scoreOptionA"
                type="number"
                placeholder="0"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
            </div>

            <div>
              <label class="block text-gray-700 font-semibold mb-2">Score Opsi B</label>
              <input
                v-model.number="formData.scoreOptionB"
                type="number"
                placeholder="0"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
            </div>

            <div>
              <label class="block text-gray-700 font-semibold mb-2">Score Opsi C</label>
              <input
                v-model.number="formData.scoreOptionC"
                type="number"
                placeholder="0"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
            </div>

            <div>
              <label class="block text-gray-700 font-semibold mb-2">Score Opsi D</label>
              <input
                v-model.number="formData.scoreOptionD"
                type="number"
                placeholder="0"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
            </div>

            <div>
              <label class="block text-gray-700 font-semibold mb-2">Score Opsi E</label>
              <input
                v-model.number="formData.scoreOptionE"
                type="number"
                placeholder="0"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
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
              <input
                v-model="formData.subTopic"
                type="text"
                placeholder="Contoh: Kepribadian, Logika, Sejarah"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label class="block text-gray-700 font-semibold mb-2">Main Topic</label>
              <input
                v-model="formData.mainTopic"
                type="text"
                placeholder="Contoh: TKP, TIU, TWK"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <p v-if="errorMsg" class="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
          {{ errorMsg }}
        </p>

        <!-- Action Buttons -->
        <div class="flex justify-end gap-3 pt-6 border-t">
          <button
            type="button"
            @click="router.back()"
            class="px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition"
          >
            Batal
          </button>
          <button
            type="submit"
            :disabled="isLoading"
            class="px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isLoading ? 'Menyimpan...' : 'Simpan Question' }}
          </button>
        </div>
      </form>
    </div>
  </main>
</template>