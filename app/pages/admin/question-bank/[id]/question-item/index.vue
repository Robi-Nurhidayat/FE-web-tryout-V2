<script setup>
definePageMeta({
  layout: 'admin'
})

const router = useRouter()
const route = useRoute()
const questionItemId = route.params.id
const questionBankId = route.query.questionBankId || null

// ✅ Get $api and toast
const { $api } = useNuxtApp()
const toast = useToast()
const config = useRuntimeConfig()

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

// ✅ Fetch existing data dengan $api
const { data: existingData, pending } = await useAsyncData(
  `question-item-${questionItemId}`,
  () => $api(`/api/v1/question-items/${questionItemId}`)
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

// ✅ File uploads state - TAMBAHKAN explanationImage!
const files = reactive({
  questionImage: null,
  imageOptionA: null,
  imageOptionB: null,
  imageOptionC: null,
  imageOptionD: null,
  imageOptionE: null,
  correctAnswerImage: null,
  explanationImage: null  // ← TAMBAHKAN INI!
})

const previews = reactive({
  questionImage: null,
  imageOptionA: null,
  imageOptionB: null,
  imageOptionC: null,
  imageOptionD: null,
  imageOptionE: null,
  correctAnswerImage: null,
  explanationImage: null  // ← TAMBAHKAN INI!
})

// Existing images from server
const existingImages = reactive({
  questionImage: null,
  imageOptionA: null,
  imageOptionB: null,
  imageOptionC: null,
  imageOptionD: null,
  imageOptionE: null,
  correctAnswerImage: null,
  explanationImage: null  // ← TAMBAHKAN INI!
})

// ✅ Track original data for change detection
const originalData = ref({})

const isLoading = ref(false)

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
    existingImages.questionImage = data.questionImage || null
    existingImages.imageOptionA = data.imageOptionA || null
    existingImages.imageOptionB = data.imageOptionB || null
    existingImages.imageOptionC = data.imageOptionC || null
    existingImages.imageOptionD = data.imageOptionD || null
    existingImages.imageOptionE = data.imageOptionE || null
    existingImages.correctAnswerImage = data.correctAnswerImage || null
    existingImages.explanationImage = data.explanationImage || null  // ← TAMBAHKAN INI!
    
    // Store original data
    originalData.value = { ...formData.value, ...existingImages }
  }
})

// ✅ Check if form has changes
const hasChanges = computed(() => {
  const textChanged = JSON.stringify(formData.value) !== JSON.stringify(originalData.value)
  const filesChanged = Object.values(files).some(file => file !== null)
  return textChanged || filesChanged
})

// ✅ Function untuk validasi image
const hasValidImage = (imageUrl) => {
  if (!imageUrl || imageUrl.trim() === '' || imageUrl === '-') {
    return false
  }
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico']
  return imageExtensions.some(ext => imageUrl.toLowerCase().includes(ext))
}

// ✅ Function untuk build full image URL
const getImageUrl = (filename) => {
  if (!filename || filename.trim() === '' || filename === '-') {
    return null
  }
  
  // Jika sudah full URL, return as is
  if (filename.startsWith('http://') || filename.startsWith('https://')) {
    return filename
  }
  
  // Jika hanya filename, tambahkan base URL
  return config.public.apiBaseUrl + '/uploads/' + filename
}

const handleFileChange = (fieldName, event) => {
  const file = event.target.files[0]
  
  console.log(`🎯 handleFileChange for ${fieldName}:`, file)
  
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
  
  files[fieldName] = file
  previews[fieldName] = URL.createObjectURL(file)
  
  // Clear existing image ketika upload baru
  existingImages[fieldName] = null
  
  toast.success(`✅ ${fieldName} berhasil dipilih: ${file.name}`)
}

const removeFile = (fieldName) => {
  if (previews[fieldName]) {
    URL.revokeObjectURL(previews[fieldName])
  }
  
  files[fieldName] = null
  previews[fieldName] = null
  
  toast.info(`🗑️ ${fieldName} preview dihapus`)
}

const removeExistingImage = (fieldName) => {
  showAlert({
    title: '🗑️ Hapus Gambar?',
    message: `Yakin ingin menghapus gambar ${fieldName}?\n\nGambar akan dihapus saat Anda menyimpan perubahan.`,
    type: 'warning',
    confirmText: 'Ya, Hapus',
    cancelText: 'Batal',
    showCancel: true,
    onConfirm: () => {
      existingImages[fieldName] = null
      toast.info(`🗑️ ${fieldName} akan dihapus saat save`)
    }
  })
}

const submitForm = async () => {
  try {
    // ✅ Validation dengan Toast
    if (!formData.value.questionText && !files.questionImage && !existingImages.questionImage) {
      toast.warning('⚠️ Pertanyaan harus diisi (teks atau gambar)!')
      return
    }
    
    // ✅ Check if no changes
    if (!hasChanges.value) {
      toast.info('ℹ️ Tidak ada perubahan yang perlu disimpan')
      return
    }
    
    isLoading.value = true
    
    console.log('🚀 ===== SUBMIT UPDATE START =====')
    console.log('📋 Form Data:', formData.value)
    console.log('📁 Files:', files)
    console.log('🖼️ Existing Images:', existingImages)
    
    // ✅ Toast loading
    const loadingToastId = toast.info('📤 Menyimpan perubahan...', { 
      duration: 0,
      position: 'top-right' 
    })
    
    // Buat FormData
    const formDataToSend = new FormData()
    
    // Append text fields
    Object.keys(formData.value).forEach(key => {
      const value = formData.value[key]
      formDataToSend.append(key, value !== null && value !== undefined ? value : '')
    })
    
    // ✅ Append files (baru di-upload) dengan explicit check
    const fileFields = [
      'questionImage',
      'imageOptionA',
      'imageOptionB',
      'imageOptionC',
      'imageOptionD',
      'imageOptionE',
      'correctAnswerImage',
      'explanationImage'  // ← PASTIKAN INI DIPROSES!
    ]
    
    fileFields.forEach(fieldName => {
      const file = files[fieldName]
      if (file && file instanceof File) {
        formDataToSend.append(fieldName, file)
        console.log(`✅ Appending new ${fieldName}:`, file.name)
      } else {
        console.log(`⚠️ Skipping ${fieldName}: no new file`)
      }
    })
    
    // ✅ PUT dengan $api
    const response = await $api(`/api/v1/question-items/${questionItemId}`, {
      method: 'PUT',
      body: formDataToSend
    })
    
    console.log('✅ Response:', response)
    
    // ✅ Remove loading toast
    toast.removeToast(loadingToastId)
    
    if (response?.statusCode === 200) {
      // ✅ Success toast
      toast.success('✅ Question item berhasil diperbarui!', {
        duration: 2000,
        position: 'top-right'
      })
      
      // ✅ Redirect setelah 500ms
      setTimeout(() => {
        router.push(`/admin/question-bank/${formData.value.questionBankId}/detail`)
      }, 500)
    } else {
      toast.error('❌ Gagal memperbarui question item')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
    console.error('❌ Error status:', error.status)
    console.error('❌ Error data:', error.data)
    
    // ✅ Specific error handling
    if (error.status === 403) {
      toast.error('🚫 Akses ditolak. Anda tidak memiliki izin ADMIN.')
    } else if (error.status === 401) {
      toast.error('🔒 Session expired. Silakan login kembali.')
      setTimeout(() => {
        navigateTo('/auth/sign-in')
      }, 1500)
    } else if (error.status === 413) {
      toast.error('📦 File terlalu besar. Kurangi ukuran file.')
    } else {
      toast.error(error.data?.message || '❌ Terjadi kesalahan saat menyimpan')
    }
  } finally {
    isLoading.value = false
  }
}

// ✅ Confirm sebelum cancel (jika ada perubahan)
const handleCancel = () => {
  // Jika tidak ada perubahan, langsung kembali
  if (!hasChanges.value) {
    router.back()
    return
  }

  // Jika ada perubahan, confirm dulu
  showAlert({
    title: '⚠️ Batalkan Perubahan?',
    message: 'Anda memiliki perubahan yang belum disimpan.\n\nYakin ingin membatalkan?',
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
  console.log('🧹 Cleaning up previews...')
  Object.keys(previews).forEach(key => {
    if (previews[key]) {
      URL.revokeObjectURL(previews[key])
    }
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
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-800">Edit Question Item</h1>
        <button
          type="button"
          @click="handleCancel"
          class="text-gray-600 hover:text-gray-800 transition"
          title="Kembali"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="pending" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-4"></div>
        <p class="text-gray-600">Loading data...</p>
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
            <textarea
              v-model="formData.questionText"
              placeholder="Masukkan pertanyaan dalam bentuk teks"
              rows="4"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              :disabled="isLoading"
            ></textarea>
          </div>

          <!-- Options Text (A-E) - sama seperti sebelumnya -->
          <div class="grid grid-cols-1 gap-4 mb-6">
            <div>
              <label class="block text-gray-700 font-semibold mb-2">Opsi A (Teks)</label>
              <input v-model="formData.optionA" type="text" placeholder="Masukkan teks untuk opsi A" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition" :disabled="isLoading" />
            </div>
            <div>
              <label class="block text-gray-700 font-semibold mb-2">Opsi B (Teks)</label>
              <input v-model="formData.optionB" type="text" placeholder="Masukkan teks untuk opsi B" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition" :disabled="isLoading" />
            </div>
            <div>
              <label class="block text-gray-700 font-semibold mb-2">Opsi C (Teks)</label>
              <input v-model="formData.optionC" type="text" placeholder="Masukkan teks untuk opsi C" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition" :disabled="isLoading" />
            </div>
            <div>
              <label class="block text-gray-700 font-semibold mb-2">Opsi D (Teks)</label>
              <input v-model="formData.optionD" type="text" placeholder="Masukkan teks untuk opsi D" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition" :disabled="isLoading" />
            </div>
            <div>
              <label class="block text-gray-700 font-semibold mb-2">Opsi E (Teks)</label>
              <input v-model="formData.optionE" type="text" placeholder="Masukkan teks untuk opsi E" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition" :disabled="isLoading" />
            </div>
          </div>

          <!-- Correct Answer Text -->
          <div class="mb-6">
            <label class="block text-gray-700 font-semibold mb-2">Jawaban Benar (Teks)</label>
            <input v-model="formData.correctAnswerText" type="text" placeholder="Contoh: A, B, C, D, E atau teks jawaban lengkap" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition" :disabled="isLoading" />
          </div>

          <!-- Explanation -->
          <div>
            <label class="block text-gray-700 font-semibold mb-2">Penjelasan (Teks)</label>
            <textarea v-model="formData.explanation" placeholder="Masukkan penjelasan mengapa jawaban ini benar" rows="4" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition" :disabled="isLoading"></textarea>
          </div>
        </div>

        <!-- ==================== GRUP 2: KONTEN GAMBAR ==================== -->
        <!-- Image sections sama seperti template sebelumnya, tapi tambahkan explanationImage -->
        <div class="border-2 border-purple-200 rounded-xl p-6 bg-purple-50">
          <h2 class="text-xl font-bold text-purple-800 mb-6 flex items-center">
            <span class="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3">2</span>
            Question Type Image
          </h2>

          <!-- ... (sisanya sama dengan template asli, tapi pastikan ada explanationImage) ... -->
          
          <!-- ✅ TAMBAHKAN SECTION INI untuk explanationImage! -->
          <div class="mt-6">
            <label class="block text-gray-700 font-semibold mb-2">Gambar Pembahasan</label>
            
            <div v-if="existingImages.explanationImage && hasValidImage(existingImages.explanationImage)" class="mb-3">
              <p class="text-sm text-gray-600 mb-2">Gambar saat ini:</p>
              <div class="relative inline-block">
                <img :src="getImageUrl(existingImages.explanationImage)" class="w-40 h-40 object-cover rounded-lg border-2 border-purple-300" />
                <button type="button" @click="removeExistingImage('explanationImage')" class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 shadow-lg transition">×</button>
              </div>
            </div>

            <input type="file" accept="image/*" @change="handleFileChange('explanationImage', $event)" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition" :disabled="isLoading" />
            <p class="text-sm text-gray-500 mt-1">Upload gambar untuk melengkapi penjelasan (opsional)</p>
            
            <div v-if="previews.explanationImage" class="mt-3 relative inline-block">
              <p class="text-sm text-green-600 mb-2">Preview gambar baru:</p>
              <img :src="previews.explanationImage" class="w-40 h-40 object-cover rounded-lg border-2 border-green-400" />
              <button type="button" @click="removeFile('explanationImage')" class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 shadow-lg transition">×</button>
            </div>
          </div>
        </div>

        <!-- ==================== GRUP 3 & 4: SCORE & TOPICS ==================== -->
        <!-- (sama seperti template asli) -->

        <!-- ✅ Show indicator jika ada perubahan -->
        <div v-if="hasChanges" class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p class="text-sm text-yellow-800 flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Ada perubahan yang belum disimpan
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end gap-3 pt-6 border-t">
          <button type="button" @click="handleCancel" :disabled="isLoading" class="px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed">
            Batal
          </button>
          <button type="submit" :disabled="isLoading || !hasChanges" class="px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
            <svg v-if="isLoading" class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isLoading ? 'Menyimpan...' : 'Simpan Perubahan' }}
          </button>
        </div>
      </form>
    </div>
  </main>
</template>