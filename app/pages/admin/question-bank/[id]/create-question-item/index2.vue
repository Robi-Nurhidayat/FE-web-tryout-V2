<script setup>
definePageMeta({
  layout: 'admin'
})

const router = useRouter()
const route = useRoute()
const questionBankId = route.params.id

// ✅ Get $api and toast
const { $api } = useNuxtApp()
const toast = useToast()

// ✅ Custom Alert State
const alertConfig = ref({
  show: false,
  title: '',
  message: '',
  type: 'warning',
  confirmText: 'OK',
  cancelText: 'Batal',
  showCancel: false,
  onConfirm: () => {},
  onCancel: () => {}
})

// ✅ Alert Helpers
const showAlert = (config) => {
  alertConfig.value = {
    show: true,
    title: config.title || 'Peringatan',
    message: config.message || '',
    type: config.type || 'warning',
    confirmText: config.confirmText || 'OK',
    cancelText: config.cancelText || 'Batal',
    showCancel: config.showCancel || false,
    onConfirm: config.onConfirm || (() => {}),
    onCancel: config.onCancel || (() => {})
  }
}

const closeAlert = () => {
  alertConfig.value.show = false
}

const handleAlertConfirm = () => {
  alertConfig.value.onConfirm()
  closeAlert()
}

const handleAlertCancel = () => {
  alertConfig.value.onCancel()
  closeAlert()
}

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
  correctAnswerImage: null,
  explanationImage: null
})

const previews = ref({
  questionImage: null,
  imageOptionA: null,
  imageOptionB: null,
  imageOptionC: null,
  imageOptionD: null,
  imageOptionE: null,
  correctAnswerImage: null,
  explanationImage: null
})

const isLoading = ref(false)

// ✅ Check if form has any data
const hasFormData = computed(() => {
  const hasText = Object.values(formData.value).some(val => val && val.toString().trim())
  const hasFiles = Object.values(files.value).some(file => file !== null)
  return hasText || hasFiles
})

const handleFileChange = (fieldName, event) => {
  const file = event.target.files[0]
  
  if (!file) return
  
  const maxSize = 2 * 1024 * 1024
  if (file.size > maxSize) {
    toast.warning(`⚠️ ${fieldName}: Ukuran file maksimal 2MB`)
    event.target.value = ''
    return
  }
  
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    toast.warning(`⚠️ ${fieldName}: Format file harus JPG, PNG, atau WEBP`)
    event.target.value = ''
    return
  }
  
  files.value[fieldName] = file
  previews.value[fieldName] = URL.createObjectURL(file)
  
  toast.success(`✅ ${fieldName} berhasil dipilih`)
}

const removeFile = (fieldName) => {
  if (previews.value[fieldName]) {
    URL.revokeObjectURL(previews.value[fieldName])
  }
  
  files.value[fieldName] = null
  previews.value[fieldName] = null
  
  toast.info(`🗑️ ${fieldName} dihapus`)
}

const submitForm = async () => {
  try {
    // ✅ Validation dengan Toast
    if (!formData.value.questionText && !files.value.questionImage) {
      toast.warning('⚠️ Pertanyaan harus diisi (teks atau gambar)!')
      return
    }
    
    isLoading.value = true
    
    // ✅ Toast loading
    const loadingToastId = toast.info('📤 Menyimpan question item...', { 
      duration: 0,
      position: 'top-right' 
    })
    
    // Buat FormData
    const formDataToSend = new FormData()
    
    // Append text fields
    Object.keys(formData.value).forEach(key => {
      formDataToSend.append(key, formData.value[key])
    })
    
    // Append files (hanya yang ada)
    Object.keys(files.value).forEach(key => {
      if (files.value[key]) {
        formDataToSend.append(key, files.value[key])
      }
    })
    
    // ✅ POST dengan $api
    const response = await $api('/api/v1/question-items', {
      method: 'POST',
      body: formDataToSend
    })
    
    // ✅ Remove loading toast
    toast.removeToast(loadingToastId)
    
    if (response?.statusCode === 201) {
      // ✅ Success toast
      toast.success('✅ Question item berhasil ditambahkan!', {
        duration: 2000,
        position: 'top-right'
      })
      
      // ✅ Redirect setelah 500ms
      setTimeout(() => {
        router.push(`/admin/question-bank/${questionBankId}/detail`)
      }, 500)
    } else {
      toast.error('❌ Gagal menyimpan question item')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
    // ✅ Error toast sudah di-handle oleh plugin
  } finally {
    isLoading.value = false
  }
}

// ✅ Confirm sebelum cancel (jika ada isian)
const handleCancel = () => {
  // Jika form kosong, langsung kembali
  if (!hasFormData.value) {
    router.back()
    return
  }

  // Jika ada isian, confirm dulu
  showAlert({
    title: '⚠️ Batalkan Perubahan?',
    message: 'Anda memiliki data yang belum disimpan.\n\nYakin ingin membatalkan?',
    type: 'warning',
    confirmText: 'Ya, Batalkan',
    cancelText: 'Tetap di Sini',
    showCancel: true,
    onConfirm: () => {
      toast.info('Perubahan dibatalkan')
      router.back()
    }
  })
}

// Cleanup previews on unmount
onUnmounted(() => {
  Object.values(previews.value).forEach(url => {
    if (url) URL.revokeObjectURL(url)
  })
})
</script>

<template>
  <!-- ✅ Custom Alert Component -->
  <CustomAlert
    :show="alertConfig.show"
    :title="alertConfig.title"
    :message="alertConfig.message"
    :type="alertConfig.type"
    :confirmText="alertConfig.confirmText"
    :cancelText="alertConfig.cancelText"
    :showCancel="alertConfig.showCancel"
    @confirm="handleAlertConfirm"
    @cancel="handleAlertCancel"
    @close="closeAlert"
  />

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
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              :disabled="isLoading"
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
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                :disabled="isLoading"
              />
            </div>

            <div>
              <label class="block text-gray-700 font-semibold mb-2">Opsi B (Teks)</label>
              <input
                v-model="formData.optionB"
                type="text"
                placeholder="Masukkan teks untuk opsi B"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                :disabled="isLoading"
              />
            </div>

            <div>
              <label class="block text-gray-700 font-semibold mb-2">Opsi C (Teks)</label>
              <input
                v-model="formData.optionC"
                type="text"
                placeholder="Masukkan teks untuk opsi C"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                :disabled="isLoading"
              />
            </div>

            <div>
              <label class="block text-gray-700 font-semibold mb-2">Opsi D (Teks)</label>
              <input
                v-model="formData.optionD"
                type="text"
                placeholder="Masukkan teks untuk opsi D"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                :disabled="isLoading"
              />
            </div>

            <div>
              <label class="block text-gray-700 font-semibold mb-2">Opsi E (Teks)</label>
              <input
                v-model="formData.optionE"
                type="text"
                placeholder="Masukkan teks untuk opsi E"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                :disabled="isLoading"
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
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              :disabled="isLoading"
            />
          </div>

          <!-- Explanation -->
          <div>
            <label class="block text-gray-700 font-semibold mb-2">Penjelasan (Teks)</label>
            <textarea
              v-model="formData.explanation"
              placeholder="Masukkan penjelasan mengapa jawaban ini benar"
              rows="4"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              :disabled="isLoading"
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
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
              :disabled="isLoading"
            />
            <p class="text-sm text-gray-500 mt-1">Upload gambar jika pertanyaan berbentuk gambar/figural (Max: 2MB, Format: JPG/PNG/WEBP)</p>
            <div v-if="previews.questionImage" class="mt-3 relative inline-block">
              <img :src="previews.questionImage" class="w-40 h-40 object-cover rounded-lg border-2 border-purple-300" />
              <button
                type="button"
                @click="removeFile('questionImage')"
                class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 shadow-lg transition"
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
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
                :disabled="isLoading"
              />
              <div v-if="previews.imageOptionA" class="mt-3 relative inline-block">
                <img :src="previews.imageOptionA" class="w-32 h-32 object-cover rounded-lg border-2 border-purple-300" />
                <button
                  type="button"
                  @click="removeFile('imageOptionA')"
                  class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 shadow-lg transition"
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
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
                :disabled="isLoading"
              />
              <div v-if="previews.imageOptionB" class="mt-3 relative inline-block">
                <img :src="previews.imageOptionB" class="w-32 h-32 object-cover rounded-lg border-2 border-purple-300" />
                <button
                  type="button"
                  @click="removeFile('imageOptionB')"
                  class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 shadow-lg transition"
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
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
                :disabled="isLoading"
              />
              <div v-if="previews.imageOptionC" class="mt-3 relative inline-block">
                <img :src="previews.imageOptionC" class="w-32 h-32 object-cover rounded-lg border-2 border-purple-300" />
                <button
                  type="button"
                  @click="removeFile('imageOptionC')"
                  class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 shadow-lg transition"
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
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
                :disabled="isLoading"
              />
              <div v-if="previews.imageOptionD" class="mt-3 relative inline-block">
                <img :src="previews.imageOptionD" class="w-32 h-32 object-cover rounded-lg border-2 border-purple-300" />
                <button
                  type="button"
                  @click="removeFile('imageOptionD')"
                  class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 shadow-lg transition"
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
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
                :disabled="isLoading"
              />
              <div v-if="previews.imageOptionE" class="mt-3 relative inline-block">
                <img :src="previews.imageOptionE" class="w-32 h-32 object-cover rounded-lg border-2 border-purple-300" />
                <button
                  type="button"
                  @click="removeFile('imageOptionE')"
                  class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 shadow-lg transition"
                >
                  ×
                </button>
              </div>
            </div>
          </div>

          <!-- Correct Answer Image -->
          <div class="mb-6">
            <label class="block text-gray-700 font-semibold mb-2">Gambar Jawaban Benar</label>
            <input
              type="file"
              accept="image/*"
              @change="handleFileChange('correctAnswerImage', $event)"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
              :disabled="isLoading"
            />
            <p class="text-sm text-gray-500 mt-1">Upload gambar jika jawaban benar berbentuk gambar</p>
            <div v-if="previews.correctAnswerImage" class="mt-3 relative inline-block">
              <img :src="previews.correctAnswerImage" class="w-40 h-40 object-cover rounded-lg border-2 border-purple-300" />
              <button
                type="button"
                @click="removeFile('correctAnswerImage')"
                class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 shadow-lg transition"
              >
                ×
              </button>
            </div>
          </div>

          <!-- Explanation Image -->
          <div>
            <label class="block text-gray-700 font-semibold mb-2">Gambar Pembahasan</label>
            <input
              type="file"
              accept="image/*"
              @change="handleFileChange('explanationImage', $event)"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
              :disabled="isLoading"
            />
            <p class="text-sm text-gray-500 mt-1">Upload gambar untuk melengkapi penjelasan (opsional)</p>
            <div v-if="previews.explanationImage" class="mt-3 relative inline-block">
              <img :src="previews.explanationImage" class="w-40 h-40 object-cover rounded-lg border-2 border-purple-300" />
              <button
                type="button"
                @click="removeFile('explanationImage')"
                class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 shadow-lg transition"
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
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none transition"
                :disabled="isLoading"
              />
            </div>

            <div>
              <label class="block text-gray-700 font-semibold mb-2">Score Opsi B</label>
              <input
                v-model.number="formData.scoreOptionB"
                type="number"
                placeholder="0"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none transition"
                :disabled="isLoading"
              />
            </div>

            <div>
              <label class="block text-gray-700 font-semibold mb-2">Score Opsi C</label>
              <input
                v-model.number="formData.scoreOptionC"
                type="number"
                placeholder="0"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none transition"
                :disabled="isLoading"
              />
            </div>

            <div>
              <label class="block text-gray-700 font-semibold mb-2">Score Opsi D</label>
              <input
                v-model.number="formData.scoreOptionD"
                type="number"
                placeholder="0"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none transition"
                :disabled="isLoading"
              />
            </div>

            <div>
              <label class="block text-gray-700 font-semibold mb-2">Score Opsi E</label>
              <input
                v-model.number="formData.scoreOptionE"
                type="number"
                placeholder="0"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none transition"
                :disabled="isLoading"
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
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none transition"
                :disabled="isLoading"
              />
            </div>

            <div>
              <label class="block text-gray-700 font-semibold mb-2">Main Topic</label>
              <input
                v-model="formData.mainTopic"
                type="text"
                placeholder="Contoh: TKP, TIU, TWK"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none transition"
                :disabled="isLoading"
              />
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end gap-3 pt-6 border-t">
          <button
            type="button"
            @click="handleCancel"
            :disabled="isLoading"
            class="px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Batal
          </button>
          <button
            type="submit"
            :disabled="isLoading"
            class="px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg 
              v-if="isLoading" 
              class="animate-spin h-5 w-5" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isLoading ? 'Menyimpan...' : 'Simpan Question' }}
          </button>
        </div>
      </form>
    </div>
  </main>
</template>