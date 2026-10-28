<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

definePageMeta({
  layout: 'admin',
})

const router = useRouter()
const route = useRoute()
const questionBankId = route.params.id

const title = ref('')
const subCategoryId = ref(null)
const positionValue = ref('')
const price = ref('')
const duration = ref('')

// ✅ STATE TAMBAHAN: Passing Grade
const passingGradeTwk = ref(null)
const passingGradeTiu = ref(null)
const passingGradeTkp = ref(null)
const passingGradeTotal = ref(null)

// ✅ STATE TAMBAHAN BARU: PPPK / Multi-Sesi
const isSubSession = ref(false)
const nextQuestionBankId = ref('')

const isLoading = ref(false)

// ✅ Track original values
const originalData = ref({})

// ✅ Get $api and toast dari Nuxt UI
const { $api } = useNuxtApp()
const toast = useToast()

// ✅ Fetch dropdowns (parallel)
const { data: subCategoriesData } = await useAsyncData('sub-categories', () =>
  $api('/api/v1/sub-categories')
)
const subCategories = computed(() => subCategoriesData.value?.data || [])

const { data: positionsData } = await useAsyncData('positions', () =>
  $api('/api/v1/positions')
)
const positions = computed(() => positionsData.value?.data || [])

// ✅ Fetch daftar Question Bank (Untuk dropdown sambungan antar sesi)
const { data: qBanksData } = await useAsyncData('question-banks-list', () =>
  $api('/api/v1/question-banks')
)
// Filter agar Bank Soal yang sedang diedit tidak muncul di pilihan (mencegah infinite loop)
const existingQuestionBanks = computed(() => {
  const list = qBanksData.value?.data || []
  return list.filter(qb => qb.id !== questionBankId)
})

// ==========================================
// ✅ STATE UNTUK SEARCHABLE DROPDOWN POSISI
// ==========================================
const isPositionDropdownOpen = ref(false)
const positionSearch = ref('')

// Filter posisi berdasarkan ketikan di kotak pencarian
const filteredPositions = computed(() => {
  if (!positionSearch.value.trim()) return positions.value
  
  const searchLower = positionSearch.value.toLowerCase().trim()
  return positions.value.filter(pos => 
    pos.title.toLowerCase().includes(searchLower)
  )
})

// Fungsi ketika posisi dipilih dari list
const selectPosition = (posTitle) => {
  positionValue.value = posTitle
  isPositionDropdownOpen.value = false
  positionSearch.value = '' // Reset kolom pencarian
}

// ✅ Fetch question bank data
const { data: questionBankData, pending: isFetching } = await useAsyncData(
  `question-bank-${questionBankId}`,
  () => $api(`/api/v1/question-banks/${questionBankId}`)
)

// Set form values
if (questionBankData.value?.data) {
  const qbData = questionBankData.value.data
  
  title.value = qbData.title || ''
  price.value = qbData.price || ''
  duration.value = qbData.duration || ''
  positionValue.value = qbData.position || ''
  subCategoryId.value = qbData.subCategoryId ? Number(qbData.subCategoryId) : null
  
  // ✅ Set existing passing grades
  passingGradeTwk.value = qbData.passingGradeTwk || null
  passingGradeTiu.value = qbData.passingGradeTiu || null
  passingGradeTkp.value = qbData.passingGradeTkp || null
  passingGradeTotal.value = qbData.passingGradeTotal || null

  // ✅ Set existing Multi-Sesi settings
  isSubSession.value = qbData.isSubSession || false
  nextQuestionBankId.value = qbData.nextQuestionBankId || ''
  
  // ✅ Store original values
  originalData.value = {
    title: qbData.title || '',
    subCategoryId: qbData.subCategoryId ? Number(qbData.subCategoryId) : null,
    position: qbData.position || '',
    price: qbData.price || '',
    duration: qbData.duration || '',
    passingGradeTwk: qbData.passingGradeTwk || null,
    passingGradeTiu: qbData.passingGradeTiu || null,
    passingGradeTkp: qbData.passingGradeTkp || null,
    passingGradeTotal: qbData.passingGradeTotal || null,
    isSubSession: qbData.isSubSession || false,
    nextQuestionBankId: qbData.nextQuestionBankId || ''
  }
}

// ✅ Check if form has changes
const hasChanges = computed(() => {
  return title.value !== originalData.value.title ||
         subCategoryId.value !== originalData.value.subCategoryId ||
         positionValue.value !== originalData.value.position ||
         price.value !== originalData.value.price ||
         duration.value !== originalData.value.duration ||
         passingGradeTwk.value !== originalData.value.passingGradeTwk ||
         passingGradeTiu.value !== originalData.value.passingGradeTiu ||
         passingGradeTkp.value !== originalData.value.passingGradeTkp ||
         passingGradeTotal.value !== originalData.value.passingGradeTotal ||
         isSubSession.value !== originalData.value.isSubSession ||
         nextQuestionBankId.value !== originalData.value.nextQuestionBankId
})

const submitForm = async () => {
  // ✅ Validation dengan Toast Nuxt UI
  if (!title.value.trim()) {
    toast.add({ title: 'Peringatan', description: 'Judul question bank wajib diisi!', color: 'amber', icon: 'i-heroicons-exclamation-triangle' })
    return
  }
  if (!subCategoryId.value) {
    toast.add({ title: 'Peringatan', description: 'Sub kategori wajib dipilih!', color: 'amber', icon: 'i-heroicons-exclamation-triangle' })
    return
  }
  if (!positionValue.value) {
    toast.add({ title: 'Peringatan', description: 'Posisi wajib dipilih!', color: 'amber', icon: 'i-heroicons-exclamation-triangle' })
    return
  }
  if (price.value === '' || price.value < 0) {
    toast.add({ title: 'Peringatan', description: 'Harga tidak valid!', color: 'amber', icon: 'i-heroicons-exclamation-triangle' })
    return
  }
  if (!duration.value || duration.value <= 0) {
    toast.add({ title: 'Peringatan', description: 'Durasi harus lebih dari 0!', color: 'amber', icon: 'i-heroicons-exclamation-triangle' })
    return
  }

  if (!hasChanges.value) {
    toast.add({ title: 'Info', description: 'Tidak ada perubahan yang perlu disimpan', color: 'blue', icon: 'i-heroicons-information-circle' })
    return
  }

  try {
    isLoading.value = true
    
    // ✅ PUT dengan $api
    const response = await $api(`/api/v1/question-banks/${questionBankId}`, {
      method: 'PUT',
      body: {
        title: title.value.trim(),
        subCategoryId: Number(subCategoryId.value),
        position: positionValue.value,
        price: Number(price.value),
        duration: Number(duration.value),
        
        // ✅ KIRIM PASSING GRADE KE BACKEND
        passingGradeTwk: passingGradeTwk.value ? Number(passingGradeTwk.value) : null,
        passingGradeTiu: passingGradeTiu.value ? Number(passingGradeTiu.value) : null,
        passingGradeTkp: passingGradeTkp.value ? Number(passingGradeTkp.value) : null,
        passingGradeTotal: passingGradeTotal.value ? Number(passingGradeTotal.value) : null,

        // ✅ KIRIM PENGATURAN MULTI-SESI KE BACKEND
        isSubSession: isSubSession.value,
        nextQuestionBankId: nextQuestionBankId.value || null
      }
    })

    // ✅ Success toast
    toast.add({
      title: 'Berhasil',
      description: 'Question bank berhasil diperbarui!',
      icon: 'i-heroicons-check-circle',
      color: 'green'
    })

    setTimeout(() => {
      router.push('/admin/question-bank')
    }, 500)

  } catch (error) {
    console.error('Error:', error)
    toast.add({
      title: 'Gagal',
      description: error.data?.message || 'Gagal memperbarui question bank',
      color: 'red',
      icon: 'i-heroicons-x-circle'
    })
  } finally {
    isLoading.value = false
  }
}

// ✅ MODAL CANCEL LOGIC
const isCancelModalOpen = ref(false)

const handleCancel = () => {
  if (!hasChanges.value) {
    router.back()
    return
  }
  // Buka modal jika ada perubahan
  isCancelModalOpen.value = true
}

const confirmCancel = () => {
  isCancelModalOpen.value = false
  toast.add({ title: 'Info', description: 'Perubahan dibatalkan', color: 'blue' })
  router.back()
}
</script>

<template>
  <main class="min-h-screen bg-tryout-bg p-4 sm:p-6 lg:p-8 relative transition-colors duration-300">
    
    <div class="max-w-2xl mx-auto bg-tryout-surface border border-tryout-border rounded-2xl shadow-sm p-5 sm:p-8 relative z-0 transition-colors duration-300 mt-4 sm:mt-0">
      <h1 class="text-xl sm:text-2xl font-bold text-tryout-text mb-6">Edit Question Bank</h1>

      <div v-if="isFetching" class="text-center py-8">
        <div class="animate-spin rounded-full h-10 w-10 border-4 border-tryout-border border-t-tryout-primary mx-auto mb-4"></div>
        <p class="text-sm font-medium text-tryout-muted">Memuat data question bank...</p>
      </div>

      <form v-else @submit.prevent="submitForm" class="space-y-5">
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div class="md:col-span-2">
            <label class="block text-tryout-text mb-1.5 text-sm sm:text-base font-medium">
              Judul Question Bank <span class="text-red-500 dark:text-red-400">*</span>
            </label>
            <input
              v-model="title"
              type="text"
              placeholder="Ex: Pranata Komputer 1"
              class="w-full px-4 py-2.5 sm:py-2 border border-tryout-border rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none transition-shadow text-sm sm:text-base"
              :disabled="isLoading"
            />
          </div>

          <div>
            <label class="block text-tryout-text mb-1.5 text-sm sm:text-base font-medium">
              Sub Kategori <span class="text-red-500 dark:text-red-400">*</span>
            </label>
            <select
              v-model="subCategoryId"
              class="w-full px-4 py-2.5 sm:py-2 border border-tryout-border rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none transition-shadow bg-tryout-surface text-tryout-text cursor-pointer text-sm sm:text-base"
              :disabled="isLoading"
            >
              <option :value="null">-- Pilih Sub Kategori --</option>
              <option
                v-for="subCategory in subCategories"
                :key="subCategory.id"
                :value="subCategory.id"
              >
                {{ subCategory.title }}
              </option>
            </select>
          </div>

          <div class="relative">
            <label class="block text-tryout-text mb-1.5 text-sm sm:text-base font-medium">
              Posisi <span class="text-red-500 dark:text-red-400">*</span>
            </label>

            <div 
              @click="!isLoading && (isPositionDropdownOpen = !isPositionDropdownOpen)"
              class="w-full px-4 py-2.5 sm:py-2 border border-tryout-border rounded-lg bg-tryout-surface flex justify-between items-center transition-colors text-sm sm:text-base"
              :class="isLoading ? 'bg-tryout-hover cursor-not-allowed opacity-70' : 'cursor-pointer focus-within:ring-2 focus-within:ring-tryout-primary hover:border-tryout-primary/50'"
            >
              <span :class="positionValue ? 'text-tryout-text capitalize' : 'text-tryout-subtle'">
                {{ positionValue || '-- Pilih atau Cari Posisi --' }}
              </span>
              <i class="pi" :class="isPositionDropdownOpen ? 'pi-chevron-up text-tryout-primary' : 'pi-chevron-down text-tryout-subtle'"></i>
            </div>

            <div v-if="isPositionDropdownOpen" @click="isPositionDropdownOpen = false" class="fixed inset-0 z-10"></div>

            <div v-if="isPositionDropdownOpen" class="absolute z-20 w-full mt-1 bg-tryout-surface border border-tryout-border rounded-lg shadow-xl overflow-hidden">
              <div class="p-2 border-b border-tryout-divider bg-tryout-hover sticky top-0">
                <div class="relative">
                  <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-tryout-subtle text-sm"></i>
                  <input v-model="positionSearch" type="text" placeholder="Ketik untuk mencari posisi..." class="w-full pl-9 pr-3 py-2 text-sm border border-tryout-border rounded bg-tryout-surface text-tryout-text focus:ring-2 focus:ring-tryout-primary focus:outline-none" @click.stop />
                </div>
              </div>

              <ul class="max-h-48 overflow-y-auto custom-scrollbar">
                <li v-if="filteredPositions.length === 0" class="px-4 py-3 text-sm text-tryout-subtle text-center italic">Posisi tidak ditemukan</li>
                <li v-else v-for="position in filteredPositions" :key="position.id" @click="selectPosition(position.title)" class="px-4 py-2.5 text-sm cursor-pointer transition-colors capitalize border-b border-tryout-divider last:border-0" :class="positionValue === position.title ? 'bg-tryout-primary/10 text-tryout-primary font-semibold' : 'text-tryout-text hover:bg-tryout-hover'">
                  {{ position.title }}
                </li>
              </ul>
            </div>
          </div>
          
          <div>
            <label class="block text-tryout-text mb-1.5 text-sm sm:text-base font-medium">
              Harga <span class="text-red-500 dark:text-red-400">*</span>
            </label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-tryout-subtle font-medium text-sm sm:text-base">Rp</span>
              <input
                v-model="price"
                type="number"
                step="1000"
                min="0"
                placeholder="Ex: 10000"
                class="w-full pl-10 pr-4 py-2.5 sm:py-2 border border-tryout-border rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none transition-shadow text-sm sm:text-base"
                :disabled="isLoading"
              />
            </div>
            <p class="text-xs text-tryout-muted mt-1.5">
              Format: angka tanpa titik/koma (contoh: 50000)
            </p>
          </div>

          <div>
            <label class="block text-tryout-text mb-1.5 text-sm sm:text-base font-medium">
              Durasi <span class="text-red-500 dark:text-red-400">*</span>
            </label>
            <div class="relative">
              <input
                v-model="duration"
                type="number"
                min="1"
                placeholder="Ex: 120"
                class="w-full pl-4 pr-16 py-2.5 sm:py-2 border border-tryout-border rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none transition-shadow text-sm sm:text-base"
                :disabled="isLoading"
              />
              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-tryout-subtle text-sm">Menit</span>
            </div>
          </div>
        </div>

        <div class="pt-6 mt-2 border-t border-tryout-divider">
          <div class="mb-4">
            <h3 class="text-lg font-bold text-tryout-text">Pengaturan Passing Grade</h3>
            <p class="text-sm text-tryout-muted">Kosongkan jika paket ini tidak menggunakan ambang batas nilai (Misal: SKB).</p>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-tryout-text mb-1 text-sm font-medium">Nilai Min. TWK</label>
              <input v-model="passingGradeTwk" type="number" min="0" placeholder="Ex: 65" class="w-full px-3 py-2 border border-tryout-border rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none transition-shadow" :disabled="isLoading" />
            </div>
            <div>
              <label class="block text-tryout-text mb-1 text-sm font-medium">Nilai Min. TIU</label>
              <input v-model="passingGradeTiu" type="number" min="0" placeholder="Ex: 80" class="w-full px-3 py-2 border border-tryout-border rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none transition-shadow" :disabled="isLoading" />
            </div>
            <div>
              <label class="block text-tryout-text mb-1 text-sm font-medium">Nilai Min. TKP</label>
              <input v-model="passingGradeTkp" type="number" min="0" placeholder="Ex: 166" class="w-full px-3 py-2 border border-tryout-border rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none transition-shadow" :disabled="isLoading" />
            </div>
            <div>
              <label class="block text-tryout-text mb-1 text-sm font-medium">Nilai Min. Total</label>
              <input v-model="passingGradeTotal" type="number" min="0" placeholder="Ex: 311" class="w-full px-3 py-2 border border-tryout-border rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none transition-shadow" :disabled="isLoading" />
            </div>
          </div>
        </div>

        <div class="pt-6 mt-2 border-t border-tryout-divider">
          <div class="mb-4">
            <h3 class="text-lg font-bold text-tryout-text">Pengaturan Lanjutan (Multi-Sesi / PPPK)</h3>
            <p class="text-sm text-tryout-muted">Gunakan pengaturan ini untuk menyambungkan antar Bank Soal (contoh: Sesi Utama lanjut ke Wawancara).</p>
          </div>

          <div class="space-y-5 bg-tryout-hover/50 p-4 border border-tryout-border rounded-xl">
            
            <label class="flex items-start gap-3 cursor-pointer p-3 bg-tryout-surface border border-tryout-border rounded-lg hover:border-tryout-primary/50 transition-colors">
              <div class="flex items-center h-5 mt-0.5">
                <input 
                  v-model="isSubSession" 
                  type="checkbox" 
                  class="w-4 h-4 text-tryout-primary bg-tryout-bg border-tryout-border rounded focus:ring-tryout-primary" 
                  :disabled="isLoading"
                >
              </div>
              <div class="flex flex-col">
                <span class="text-sm font-bold text-tryout-text">Jadikan sebagai Sub-Sesi (Sembunyikan dari menu peserta)</span>
                <span class="text-xs text-tryout-muted mt-1 leading-relaxed">
                  Centang opsi ini JIKA bank soal ini adalah sesi lanjutan (seperti soal Wawancara). 
                  Peserta tidak akan bisa melihat soal ini secara langsung, melainkan harus menyelesaikan sesi utamanya terlebih dahulu.
                </span>
              </div>
            </label>

            <div>
              <label class="block text-tryout-text mb-1.5 text-sm font-bold">
                Sambungkan ke Bank Soal Selanjutnya
              </label>
              <select
                v-model="nextQuestionBankId"
                class="w-full px-4 py-2.5 text-sm border border-tryout-border rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none transition-shadow bg-tryout-surface text-tryout-text cursor-pointer"
                :disabled="isLoading"
              >
                <option value="">-- Tidak Ada / Selesai (Default) --</option>
                <option
                  v-for="qb in existingQuestionBanks"
                  :key="qb.id"
                  :value="qb.id"
                >
                  {{ qb.title }} ({{ qb.position || 'Umum' }})
                </option>
              </select>
              <p class="mt-2 text-xs text-tryout-muted leading-relaxed">
                Pilih bank soal yang akan <strong class="text-tryout-text">otomatis terbuka</strong> setelah peserta mengeklik tombol Submit pada ujian ini. 
                <br/><em class="opacity-80">(Pastikan Anda sudah membuat bank soal tambahannya terlebih dahulu sebelum memilih di sini).</em>
              </p>
            </div>

          </div>
        </div>

        <div v-if="hasChanges" class="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-lg p-3 sm:p-4 mt-4 transition-colors">
          <p class="text-sm text-amber-800 dark:text-amber-400 flex items-center gap-2 font-medium">
            <svg class="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Ada perubahan yang belum disimpan
          </p>
        </div>

        <div class="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-lg p-3 sm:p-4 mt-4 transition-colors">
          <p class="text-sm text-blue-800 dark:text-blue-300 flex items-center gap-2 font-medium">
            <svg class="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span><span class="text-red-500 dark:text-red-400 font-bold">*</span> = Wajib diisi</span>
          </p>
        </div>

        <div class="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-8 pt-4 border-t border-tryout-divider">
          <button
            type="button"
            @click="handleCancel"
            :disabled="isLoading"
            class="w-full sm:w-auto px-5 py-2.5 rounded-xl border-2 border-tryout-border bg-tryout-surface text-tryout-text font-bold hover:bg-tryout-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            Batal
          </button>
          <button
            type="submit"
            :disabled="isLoading || !hasChanges"
            class="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-tryout-primary text-white font-bold hover:opacity-90 transition-all shadow-md shadow-tryout-primary/20 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <svg v-if="isLoading" class="animate-spin h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isLoading ? 'Menyimpan...' : 'Simpan Perubahan' }}
          </button>
        </div>
      </form>
    </div>

    <Teleport to="body">
      <Transition name="fade">
        <div v-if="isCancelModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm" @click="isCancelModalOpen = false"></div>
          
          <div class="bg-tryout-surface rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden border border-tryout-border transition-transform">
            <div class="bg-amber-50 dark:bg-amber-900/10 p-6 flex justify-center border-b border-amber-100 dark:border-amber-900/30">
              <div class="w-16 h-16 bg-amber-100 dark:bg-amber-800/30 rounded-full flex items-center justify-center">
                <svg class="w-8 h-8 text-amber-600 dark:text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              </div>
            </div>

            <div class="p-6 text-center">
              <h3 class="text-xl font-extrabold text-tryout-text mb-2">Batalkan Perubahan?</h3>
              <p class="text-tryout-muted text-sm font-medium">Anda memiliki perubahan yang belum disimpan. Yakin ingin membatalkan dan kembali?</p>
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
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: var(--color-tryout-hover); }
.custom-scrollbar::-webkit-scrollbar-thumb { background: var(--color-tryout-border); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--color-tryout-muted); }

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-active > div:nth-child(2),
.fade-leave-active > div:nth-child(2) {
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.fade-enter-from > div:nth-child(2),
.fade-leave-to > div:nth-child(2) {
  transform: scale(0.95) translateY(10px);
}
</style>