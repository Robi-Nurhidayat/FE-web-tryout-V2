<script setup>
definePageMeta({
  layout: 'admin'
})

const router = useRouter()
const route = useRoute()
const questionBankId = route.params.id

// ✅ Get $api and toast dari Nuxt UI
const { $api } = useNuxtApp()
const toast = useToast()

// ✅ STATE BARU: Untuk Toggle Tipe Soal
const questionType = ref('text') // Default 'text'

// Form state
const formData = ref({
  questionBankId: questionBankId,
  questionText: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  optionE: '',
  correctAnswerText: '', // Akan diisi otomatis saat submit
  explanation: '',
  mainTopic: '',
  subTopic: '',
  scoreOptionA: 0,
  scoreOptionB: 0,
  scoreOptionC: 0,
  scoreOptionD: 0,
  scoreOptionE: 0
})

// ✅ STATE: Untuk menyimpan pilihan A/B/C/D/E di Dropdown (HANYA UNTUK TIPE TEKS)
const selectedAnswerKey = ref('')

// File uploads state
const files = ref({
  questionImage: null,
  imageOptionA: null,
  imageOptionB: null,
  imageOptionC: null,
  imageOptionD: null,
  imageOptionE: null,
  correctAnswerImage: null, // Digunakan hanya untuk Tipe Gambar
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

// ✅ Check if form has any data (untuk warning modal Batal)
const hasFormData = computed(() => {
  const hasText = Object.values(formData.value).some(val => val && val.toString().trim() && val !== questionBankId)
  const hasFiles = Object.values(files.value).some(file => file !== null)
  return hasText || hasFiles || selectedAnswerKey.value !== ''
})

const handleFileChange = (fieldName, event) => {
  const file = event.target.files[0]
  
  if (!file) return
  
  const maxSize = 2 * 1024 * 1024
  if (file.size > maxSize) {
    toast.add({
      title: 'File Terlalu Besar',
      description: `Ukuran file maksimal 2MB`,
      color: 'amber',
      icon: 'i-heroicons-exclamation-triangle'
    })
    event.target.value = ''
    return
  }
  
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    toast.add({
      title: 'Format Salah',
      description: `Format file harus JPG, PNG, atau WEBP`,
      color: 'amber',
      icon: 'i-heroicons-exclamation-triangle'
    })
    event.target.value = ''
    return
  }
  
  files.value[fieldName] = file
  previews.value[fieldName] = URL.createObjectURL(file)
  
  toast.add({
    title: 'File Ditambahkan',
    description: `Gambar berhasil dipilih.`,
    color: 'green',
    icon: 'i-heroicons-check-circle'
  })
}

const removeFile = (fieldName) => {
  if (previews.value[fieldName]) {
    URL.revokeObjectURL(previews.value[fieldName])
  }
  
  files.value[fieldName] = null
  previews.value[fieldName] = null
  
  toast.add({
    title: 'File Dihapus',
    description: `Gambar telah dihapus.`,
    color: 'gray',
    icon: 'i-heroicons-trash'
  })
}

const submitForm = async () => {
  // ✅ Validasi dasar berdasarkan tipe soal
  if (questionType.value === 'text') {
    if (!formData.value.questionText) {
      toast.add({ title: 'Validasi Gagal', description: 'Teks Pertanyaan wajib diisi!', color: 'amber', icon: 'i-heroicons-exclamation-triangle' })
      return
    }
    if (!selectedAnswerKey.value) {
      toast.add({ title: 'Validasi Gagal', description: 'Pilih Kunci Jawaban Benar dari Dropdown!', color: 'amber', icon: 'i-heroicons-exclamation-triangle' })
      return
    }
  } else if (questionType.value === 'image') {
    if (!files.value.questionImage) {
      toast.add({ title: 'Validasi Gagal', description: 'Gambar Pertanyaan wajib diisi!', color: 'amber', icon: 'i-heroicons-exclamation-triangle' })
      return
    }
    if (!files.value.correctAnswerImage) {
      toast.add({ title: 'Validasi Gagal', description: 'Gambar Kunci Jawaban wajib diisi!', color: 'amber', icon: 'i-heroicons-exclamation-triangle' })
      return
    }
  }

  // ✅ LOGIKA PEMBERSIH OTOMATIS (AUTO-CLEAR)
  if (questionType.value === 'image') {
    // Bersihkan semua data Teks Eksklusif
    formData.value.questionText = ''
    formData.value.optionA = ''
    formData.value.optionB = ''
    formData.value.optionC = ''
    formData.value.optionD = ''
    formData.value.optionE = ''
    formData.value.correctAnswerText = '' 
  } else {
    // Bersihkan semua data Gambar Eksklusif
    files.value.questionImage = null
    files.value.imageOptionA = null
    files.value.imageOptionB = null
    files.value.imageOptionC = null
    files.value.imageOptionD = null
    files.value.imageOptionE = null
    files.value.correctAnswerImage = null
    
    // Set teks jawaban dari dropdown
    formData.value.correctAnswerText = formData.value[`option${selectedAnswerKey.value}`] || selectedAnswerKey.value
  }

  try {
    isLoading.value = true
    
    const loadingToast = toast.add({
      title: 'Menyimpan Data...',
      description: 'Sedang mengunggah question item.',
      icon: 'i-heroicons-arrow-path',
      color: 'blue',
      timeout: 0 
    })
    
    const formDataToSend = new FormData()
    
    // Append text fields
    Object.keys(formData.value).forEach(key => {
      formDataToSend.append(key, formData.value[key])
    })
    
    // Append files
    Object.keys(files.value).forEach(key => {
      if (files.value[key]) {
        formDataToSend.append(key, files.value[key])
      }
    })
    
    const response = await $api('/api/v1/question-items', {
      method: 'POST',
      body: formDataToSend
    })
    
    toast.remove(loadingToast.id)
    
    if (response?.statusCode === 201) {
      toast.add({
        title: 'Berhasil!',
        description: 'Question item berhasil ditambahkan!',
        color: 'green',
        icon: 'i-heroicons-check-circle'
      })
      
      setTimeout(() => {
        router.push(`/admin/question-bank/${questionBankId}/detail`)
      }, 500)
    } else {
      toast.add({
        title: 'Gagal',
        description: 'Gagal menyimpan question item.',
        color: 'red',
        icon: 'i-heroicons-x-circle'
      })
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
    toast.add({
      title: 'Terjadi Kesalahan',
      description: error?.data?.message || 'Gagal terhubung ke server.',
      color: 'red',
      icon: 'i-heroicons-x-circle'
    })
  } finally {
    isLoading.value = false
  }
}

// ==========================================
// ✅ MODAL CANCEL LOGIC
// ==========================================
const isCancelModalOpen = ref(false)

const handleCancel = () => {
  if (!hasFormData.value) {
    router.back()
    return
  }
  isCancelModalOpen.value = true
}

const confirmCancel = () => {
  isCancelModalOpen.value = false
  toast.add({ title: 'Info', description: 'Pengisian dibatalkan.', color: 'blue', icon: 'i-heroicons-information-circle' })
  router.back()
}

onUnmounted(() => {
  Object.values(previews.value).forEach(url => {
    if (url) URL.revokeObjectURL(url)
  })
})
</script>

<template>
  <main class="min-h-screen bg-tryout-bg p-4 sm:p-6 lg:p-8 relative transition-colors duration-300">
    <div class="max-w-5xl mx-auto bg-tryout-surface rounded-2xl shadow-sm border border-tryout-border p-5 sm:p-8 transition-colors duration-300 mt-4 sm:mt-0">
      <h1 class="text-xl sm:text-2xl font-bold text-tryout-text mb-6">Tambah Question Item</h1>

      <form @submit.prevent="submitForm" class="space-y-8">
        
        <div class="bg-tryout-hover border border-tryout-border rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-center shadow-sm transition-colors">
          <span class="font-bold text-tryout-text">Pilih Tipe Soal:</span>
          
          <div class="flex gap-4">
            <label class="flex items-center gap-2 cursor-pointer bg-tryout-surface border hover:bg-blue-50 dark:hover:bg-blue-900/20 px-5 py-3 rounded-lg shadow-sm transition-all" 
                   :class="questionType === 'text' ? 'ring-2 ring-blue-500 border-blue-500 dark:ring-blue-400 dark:border-blue-400' : 'border-tryout-border'">
              <input type="radio" v-model="questionType" value="text" class="w-5 h-5 text-blue-600 focus:ring-blue-500">
              <span class="font-bold" :class="questionType === 'text' ? 'text-blue-700 dark:text-blue-400' : 'text-tryout-muted'">📝 Khusus Teks</span>
            </label>

            <label class="flex items-center gap-2 cursor-pointer bg-tryout-surface border hover:bg-purple-50 dark:hover:bg-purple-900/20 px-5 py-3 rounded-lg shadow-sm transition-all" 
                   :class="questionType === 'image' ? 'ring-2 ring-purple-500 border-purple-500 dark:ring-purple-400 dark:border-purple-400' : 'border-tryout-border'">
              <input type="radio" v-model="questionType" value="image" class="w-5 h-5 text-purple-600 focus:ring-purple-500">
              <span class="font-bold" :class="questionType === 'image' ? 'text-purple-700 dark:text-purple-400' : 'text-tryout-muted'">🖼️ Teks & Gambar</span>
            </label>
          </div>
        </div>

        <div v-show="questionType === 'text'" class="border-2 border-blue-200 dark:border-blue-900/40 rounded-xl p-5 sm:p-6 bg-blue-50 dark:bg-blue-900/10 transition-all duration-300 origin-top">
          <h2 class="text-lg sm:text-xl font-bold text-blue-800 dark:text-blue-300 mb-6 flex items-center">
            <span class="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm sm:text-base">1</span>
            Konten Soal & Opsi (Teks)
          </h2>
          
          <div class="mb-6">
            <label class="block text-tryout-text font-semibold mb-2">Teks Pertanyaan <span class="text-red-500 dark:text-red-400">*</span></label>
            <textarea
              v-model="formData.questionText"
              placeholder="Masukkan pertanyaan dalam bentuk teks"
              rows="4"
              class="w-full px-4 py-3 border border-tryout-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow bg-tryout-surface text-tryout-text"
              :disabled="isLoading"
            ></textarea>
          </div>

          <div class="grid grid-cols-1 gap-4 mb-6">
            <div><label class="block text-tryout-text font-semibold mb-2">Opsi A</label><input v-model="formData.optionA" type="text" class="w-full px-4 py-3 border border-tryout-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow bg-tryout-surface text-tryout-text" :disabled="isLoading" /></div>
            <div><label class="block text-tryout-text font-semibold mb-2">Opsi B</label><input v-model="formData.optionB" type="text" class="w-full px-4 py-3 border border-tryout-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow bg-tryout-surface text-tryout-text" :disabled="isLoading" /></div>
            <div><label class="block text-tryout-text font-semibold mb-2">Opsi C</label><input v-model="formData.optionC" type="text" class="w-full px-4 py-3 border border-tryout-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow bg-tryout-surface text-tryout-text" :disabled="isLoading" /></div>
            <div><label class="block text-tryout-text font-semibold mb-2">Opsi D</label><input v-model="formData.optionD" type="text" class="w-full px-4 py-3 border border-tryout-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow bg-tryout-surface text-tryout-text" :disabled="isLoading" /></div>
            <div><label class="block text-tryout-text font-semibold mb-2">Opsi E</label><input v-model="formData.optionE" type="text" class="w-full px-4 py-3 border border-tryout-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow bg-tryout-surface text-tryout-text" :disabled="isLoading" /></div>
          </div>

          <div class="mt-8 border-t border-blue-200 dark:border-blue-900/40 pt-6">
            <label class="block text-tryout-text font-bold mb-2 text-base sm:text-lg">Jawaban Benar (Teks) <span class="text-red-500 dark:text-red-400">*</span></label>
            <select
              v-model="selectedAnswerKey"
              class="w-full sm:max-w-md px-4 py-3 border-2 border-blue-300 dark:border-blue-700/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-shadow bg-tryout-surface text-tryout-text text-base sm:text-lg font-semibold cursor-pointer"
              :disabled="isLoading"
            >
              <option value="" disabled selected>-- Pilih Kunci Jawaban --</option>
              <option value="A">Kunci: A {{ formData.optionA ? `(${formData.optionA})` : '' }}</option>
              <option value="B">Kunci: B {{ formData.optionB ? `(${formData.optionB})` : '' }}</option>
              <option value="C">Kunci: C {{ formData.optionC ? `(${formData.optionC})` : '' }}</option>
              <option value="D">Kunci: D {{ formData.optionD ? `(${formData.optionD})` : '' }}</option>
              <option value="E">Kunci: E {{ formData.optionE ? `(${formData.optionE})` : '' }}</option>
            </select>
          </div>
        </div>

        <div v-show="questionType === 'image'" class="border-2 border-purple-200 dark:border-purple-900/40 rounded-xl p-5 sm:p-6 bg-purple-50 dark:bg-purple-900/10 transition-all duration-300 origin-top">
          <h2 class="text-lg sm:text-xl font-bold text-purple-800 dark:text-purple-300 mb-6 flex items-center">
            <span class="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm sm:text-base">2</span>
            Konten Soal & Opsi (Gambar)
          </h2>

          <div class="mb-6">
            <label class="block text-tryout-text font-semibold mb-2">Gambar Pertanyaan <span class="text-red-500 dark:text-red-400">*</span></label>
            <input
              type="file"
              accept="image/*"
              @change="handleFileChange('questionImage', $event)"
              class="w-full px-4 py-2.5 sm:py-3 border border-tryout-border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-shadow bg-tryout-surface text-tryout-text"
              :disabled="isLoading"
            />
            <div v-if="previews.questionImage" class="mt-3 relative inline-block">
              <img :src="previews.questionImage" class="w-32 h-32 sm:w-40 sm:h-40 object-cover rounded-lg border-2 border-emerald-500" />
              <button type="button" @click="removeFile('questionImage')" class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 shadow-lg transition">×</button>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div v-for="opt in ['A', 'B', 'C', 'D', 'E']" :key="opt">
              <label class="block text-tryout-text font-semibold mb-2">Gambar Opsi {{ opt }}</label>
              <input
                type="file"
                accept="image/*"
                @change="handleFileChange(`imageOption${opt}`, $event)"
                class="w-full px-4 py-2.5 sm:py-3 border border-tryout-border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-shadow bg-tryout-surface text-tryout-text"
                :disabled="isLoading"
              />
              <div v-if="previews[`imageOption${opt}`]" class="mt-3 relative inline-block">
                <img :src="previews[`imageOption${opt}`]" class="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg border-2 border-emerald-500" />
                <button type="button" @click="removeFile(`imageOption${opt}`)" class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 shadow-lg transition">×</button>
              </div>
            </div>
          </div>

          <div class="mt-8 border-t border-purple-200 dark:border-purple-900/40 pt-6">
            <label class="block text-tryout-text font-bold mb-2 text-base sm:text-lg">Gambar Jawaban Benar <span class="text-red-500 dark:text-red-400">*</span></label>
            <input
              type="file"
              accept="image/*"
              @change="handleFileChange('correctAnswerImage', $event)"
              class="w-full sm:max-w-md px-4 py-2.5 sm:py-3 border border-tryout-border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-shadow bg-tryout-surface text-tryout-text"
              :disabled="isLoading"
            />
            <div v-if="previews.correctAnswerImage" class="mt-3 relative inline-block">
              <img :src="previews.correctAnswerImage" class="w-32 h-32 sm:w-40 sm:h-40 object-cover rounded-lg border-2 border-emerald-500" />
              <button type="button" @click="removeFile('correctAnswerImage')" class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 shadow-lg transition">×</button>
            </div>
          </div>
        </div>

        <div class="border-2 border-tryout-border rounded-xl p-5 sm:p-6 bg-tryout-surface shadow-sm transition-colors">
          <h2 class="text-lg sm:text-xl font-bold text-tryout-text mb-6 flex items-center">
            <span class="bg-tryout-muted text-white w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm sm:text-base">3</span>
            Penjelasan, Bobot Skor & Topik
          </h2>

          <div class="mb-6 bg-tryout-hover/50 p-4 rounded-lg border border-tryout-border">
            <h3 class="font-bold text-tryout-text mb-4">Materi Pembahasan</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-tryout-text font-semibold mb-2">Teks Penjelasan</label>
                <textarea v-model="formData.explanation" placeholder="Tulis pembahasan disini..." rows="4"
                  class="w-full px-4 py-3 border border-tryout-border rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none transition-shadow bg-tryout-surface text-tryout-text" :disabled="isLoading"></textarea>
              </div>
              <div>
                <label class="block text-tryout-text font-semibold mb-2">Gambar Penjelasan (Opsional)</label>
                <input type="file" accept="image/*" @change="handleFileChange('explanationImage', $event)" class="w-full px-4 py-2 border border-tryout-border rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none transition-shadow bg-tryout-surface text-tryout-text text-sm" :disabled="isLoading" />
                <div v-if="previews.explanationImage" class="mt-3 relative inline-block">
                  <img :src="previews.explanationImage" class="w-24 h-24 object-cover rounded-lg border border-emerald-500" />
                  <button type="button" @click="removeFile('explanationImage')" class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 shadow-lg text-sm transition">×</button>
                </div>
              </div>
            </div>
          </div>

          <div class="mb-6">
            <p class="text-sm text-tryout-text mb-3 font-semibold border-b border-tryout-divider pb-2">Bobot Nilai (Score) per Opsi:</p>
            <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div><label class="block text-tryout-text text-sm font-semibold mb-2">Score A</label><input v-model.number="formData.scoreOptionA" type="number" class="w-full px-4 py-2.5 sm:py-2 border border-tryout-border rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none bg-tryout-surface text-tryout-text" :disabled="isLoading" /></div>
              <div><label class="block text-tryout-text text-sm font-semibold mb-2">Score B</label><input v-model.number="formData.scoreOptionB" type="number" class="w-full px-4 py-2.5 sm:py-2 border border-tryout-border rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none bg-tryout-surface text-tryout-text" :disabled="isLoading" /></div>
              <div><label class="block text-tryout-text text-sm font-semibold mb-2">Score C</label><input v-model.number="formData.scoreOptionC" type="number" class="w-full px-4 py-2.5 sm:py-2 border border-tryout-border rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none bg-tryout-surface text-tryout-text" :disabled="isLoading" /></div>
              <div><label class="block text-tryout-text text-sm font-semibold mb-2">Score D</label><input v-model.number="formData.scoreOptionD" type="number" class="w-full px-4 py-2.5 sm:py-2 border border-tryout-border rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none bg-tryout-surface text-tryout-text" :disabled="isLoading" /></div>
              <div><label class="block text-tryout-text text-sm font-semibold mb-2">Score E</label><input v-model.number="formData.scoreOptionE" type="number" class="w-full px-4 py-2.5 sm:py-2 border border-tryout-border rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none bg-tryout-surface text-tryout-text" :disabled="isLoading" /></div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label class="block text-tryout-text font-semibold mb-2">Sub Topic</label><input v-model="formData.subTopic" type="text" class="w-full px-4 py-2.5 sm:py-3 border border-tryout-border rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none bg-tryout-surface text-tryout-text" :disabled="isLoading" /></div>
            <div><label class="block text-tryout-text font-semibold mb-2">Main Topic</label><input v-model="formData.mainTopic" type="text" class="w-full px-4 py-2.5 sm:py-3 border border-tryout-border rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none bg-tryout-surface text-tryout-text" :disabled="isLoading" /></div>
          </div>
        </div>

        <div class="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-tryout-divider">
          <button
            type="button"
            @click="handleCancel"
            :disabled="isLoading"
            class="w-full sm:w-auto px-6 py-3 rounded-xl border-2 border-tryout-border bg-tryout-surface text-tryout-text font-bold hover:bg-tryout-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            Batal
          </button>
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full sm:w-auto px-6 py-3 rounded-xl bg-tryout-primary text-white font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-md active:scale-[0.98]"
          >
            <svg v-if="isLoading" class="animate-spin h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isLoading ? 'Menyimpan...' : 'Simpan Question' }}
          </button>
        </div>
      </form>
    </div>

    <Teleport to="body">
      <Transition name="fade">
        <div v-if="isCancelModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div class="absolute inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm" @click="isCancelModalOpen = false"></div>
          
          <div class="bg-tryout-surface rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden border border-tryout-border">
            <div class="bg-amber-50 dark:bg-amber-900/10 p-6 flex justify-center border-b border-amber-100 dark:border-amber-900/30">
              <div class="w-16 h-16 bg-amber-100 dark:bg-amber-800/30 rounded-full flex items-center justify-center">
                <svg class="w-8 h-8 text-amber-600 dark:text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              </div>
            </div>

            <div class="p-6 text-center">
              <h3 class="text-xl font-extrabold text-tryout-text mb-2">Batalkan Pengisian?</h3>
              <p class="text-tryout-muted font-medium">Anda memiliki data yang belum disimpan. Yakin ingin membatalkan dan kembali?</p>
            </div>

            <div class="p-6 bg-tryout-hover/50 flex flex-col sm:flex-row gap-3 border-t border-tryout-divider">
              <button 
                @click="isCancelModalOpen = false" 
                class="flex-1 px-4 py-2.5 bg-tryout-surface border border-tryout-border text-tryout-text font-bold rounded-xl hover:bg-tryout-hover transition active:scale-[0.98]"
              >
                Tetap di Sini
              </button>
              <button 
                @click="confirmCancel" 
                class="flex-1 px-4 py-2.5 bg-amber-500 dark:bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-600 dark:hover:bg-amber-700 transition flex justify-center items-center gap-2 active:scale-[0.98]"
              >
                Ya, Batalkan
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </main>
</template>

<style scoped>
/* Transisi Modal */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-active .bg-tryout-surface,
.fade-leave-active .bg-tryout-surface {
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.fade-enter-from .bg-tryout-surface,
.fade-leave-to .bg-tryout-surface {
  transform: scale(0.95) translateY(10px);
}
</style>