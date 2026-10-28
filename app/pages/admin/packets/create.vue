<script setup>
definePageMeta({
  layout: 'admin',
})

const router = useRouter()
const toast = useToast()
const { $api } = useNuxtApp()

// Form fields
const title = ref('')
const category = ref('')
const subCategory = ref('')
const position = ref('')
const description = ref('')
const price = ref('')
const urlGroup = ref('')
const isLoading = ref(false)

// ✅ Fetch categories untuk dropdown
const categories = ref([])
const { data: categoriesData } = await useAsyncData('categories', () =>
  $api('/api/v1/categories')
)
categories.value = categoriesData.value?.data || []

// ✅ Fetch sub-categories
const subCategories = ref([])
const { data: subCategoriesData } = await useAsyncData('sub-categories', () =>
  $api('/api/v1/sub-categories')
)
subCategories.value = subCategoriesData.value?.data || []

// ✅ Fetch positions
const positions = ref([])
const { data: positionsData } = await useAsyncData('positions', () =>
  $api('/api/v1/positions')
)
positions.value = positionsData.value?.data || []

// ==========================================
// ✅ STATE UNTUK SEARCHABLE DROPDOWN POSISI
// ==========================================
const isPositionDropdownOpen = ref(false)
const positionSearch = ref('')

const filteredPositions = computed(() => {
  if (!positionSearch.value.trim()) return positions.value
  
  const searchLower = positionSearch.value.toLowerCase().trim()
  return positions.value.filter(pos => 
    pos.title.toLowerCase().includes(searchLower)
  )
})

const selectPosition = (posTitle) => {
  position.value = posTitle
  isPositionDropdownOpen.value = false
  positionSearch.value = ''
}

// ✅ Check if form has values
const hasFormData = computed(() => {
  return title.value.trim() || 
         category.value.trim() || 
         subCategory.value.trim() || 
         position.value.trim() || 
         description.value.trim() || 
         urlGroup.value.trim() || 
         price.value
})

const submitForm = async () => {
  // ✅ Validation
  if (!title.value.trim()) {
    toast.add({ title: 'Validasi Gagal', description: 'Judul paket wajib diisi', color: 'amber', icon: 'i-heroicons-exclamation-triangle' })
    return
  }
  if (!category.value.trim()) {
    toast.add({ title: 'Validasi Gagal', description: 'Kategori wajib diisi', color: 'amber', icon: 'i-heroicons-exclamation-triangle' })
    return
  }
const numericPrice = Number(price.value)

if (
  price.value === ''
  || Number.isNaN(numericPrice)
  || numericPrice < 0
) {
  toast.add({
    title: 'Validasi Gagal',
    description: 'Harga tidak boleh kosong atau negatif',
    color: 'amber',
    icon: 'i-heroicons-exclamation-triangle'
  })

  return
}
  try {
    isLoading.value = true
    
    // ✅ POST dengan $api
    const response = await $api('/api/v1/packets', {
      method: 'POST',
      body: {
        title: title.value.trim(),
        category: category.value.trim(),
        subCategory: subCategory.value.trim(),
        position: position.value.trim(),
        description: description.value.trim(),
        price: numericPrice,
        urlGroup: urlGroup.value.trim()
      },
    })

    if (response?.statusCode === 201) {
      toast.add({
        title: 'Berhasil!',
        description: 'Paket berhasil ditambahkan',
        color: 'green',
        icon: 'i-heroicons-check-circle'
      })

      setTimeout(() => {
        router.push('/admin/packets')
      }, 500)
    } else {
      toast.add({
        title: 'Gagal',
        description: 'Gagal menambahkan paket',
        color: 'red',
        icon: 'i-heroicons-x-circle'
      })
    }
  } catch (error) {
    console.error('Error:', error)
    toast.add({
      title: 'Error',
      description: error?.data?.message || 'Gagal menambahkan paket',
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
    router.push('/admin/packets')
    return
  }
  isCancelModalOpen.value = true
}

const confirmCancel = () => {
  isCancelModalOpen.value = false
  toast.add({ title: 'Info', description: 'Perubahan dibatalkan', color: 'blue', icon: 'i-heroicons-information-circle' })
  router.push('/admin/packets')
}
</script>

<template>
  <main class="min-h-screen bg-tryout-bg p-4 sm:p-6 lg:p-8 relative transition-colors duration-300">
    <div class="max-w-2xl mx-auto bg-tryout-surface border border-tryout-border rounded-2xl shadow-sm p-5 sm:p-8 relative z-0 transition-colors duration-300 mt-4 sm:mt-0">
      <h1 class="text-xl sm:text-2xl font-bold text-tryout-text mb-6">Tambah Paket</h1>

      <form @submit.prevent="submitForm" class="space-y-5">
        <div>
          <label class="block text-tryout-text mb-1.5 text-sm sm:text-base font-medium">
            Judul Paket <span class="text-red-500 dark:text-red-400">*</span>
          </label>
          <input 
            v-model="title" 
            type="text" 
            placeholder="Masukkan judul paket"
            class="w-full px-4 py-2.5 sm:py-2 border border-tryout-border bg-tryout-surface text-tryout-text rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none transition-shadow"
            :disabled="isLoading"
          />
        </div>

        <div>
          <label class="block text-tryout-text mb-1.5 text-sm sm:text-base font-medium">
            Kategori <span class="text-red-500 dark:text-red-400">*</span>
          </label>
          <select 
            v-model="category"
            class="w-full px-4 py-2.5 sm:py-2 border border-tryout-border rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none transition-shadow bg-tryout-surface text-tryout-text cursor-pointer"
            :disabled="isLoading"
          >
            <option value="">Pilih Kategori</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.title">
              {{ cat.title }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-tryout-text mb-1.5 text-sm sm:text-base font-medium">
            Sub Kategori
          </label>
          <select 
            v-model="subCategory"
            class="w-full px-4 py-2.5 sm:py-2 border border-tryout-border rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none transition-shadow bg-tryout-surface text-tryout-text cursor-pointer"
            :disabled="isLoading"
          >
            <option value="">Pilih Sub Kategori</option>
            <option v-for="sub in subCategories" :key="sub.id" :value="sub.title">
              {{ sub.title }}
            </option>
          </select>
        </div>

        <div class="relative">
          <label class="block text-tryout-text mb-1.5 text-sm sm:text-base font-medium">
            Posisi
          </label>

          <div 
            @click="!isLoading && (isPositionDropdownOpen = !isPositionDropdownOpen)"
            class="w-full px-4 py-2.5 sm:py-2 border border-tryout-border rounded-lg bg-tryout-surface flex justify-between items-center transition-colors"
            :class="isLoading ? 'bg-tryout-hover cursor-not-allowed opacity-70' : 'cursor-pointer focus-within:ring-2 focus-within:ring-tryout-primary hover:border-tryout-primary/50'"
          >
            <span :class="position ? 'text-tryout-text capitalize' : 'text-tryout-subtle'">
              {{ position || 'Pilih atau Cari Posisi' }}
            </span>
            <i class="pi" :class="isPositionDropdownOpen ? 'pi-chevron-up text-tryout-primary' : 'pi-chevron-down text-tryout-subtle'"></i>
          </div>

          <div 
            v-if="isPositionDropdownOpen" 
            @click="isPositionDropdownOpen = false" 
            class="fixed inset-0 z-10"
          ></div>

          <div 
            v-if="isPositionDropdownOpen" 
            class="absolute z-20 w-full mt-1 bg-tryout-surface border border-tryout-border rounded-lg shadow-xl overflow-hidden"
          >
            <div class="p-2 border-b border-tryout-divider bg-tryout-hover sticky top-0">
              <div class="relative">
                <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-tryout-subtle text-sm"></i>
                <input
                  v-model="positionSearch"
                  type="text"
                  placeholder="Ketik untuk mencari posisi..."
                  class="w-full pl-9 pr-3 py-2 text-sm border border-tryout-border bg-tryout-surface text-tryout-text rounded focus:ring-2 focus:ring-tryout-primary focus:outline-none"
                  @click.stop
                />
              </div>
            </div>

            <ul class="max-h-48 overflow-y-auto custom-scrollbar">
              <li 
                @click="selectPosition('')"
                class="px-4 py-2.5 text-sm cursor-pointer transition-colors border-b border-tryout-divider text-tryout-muted hover:bg-tryout-hover"
              >
                Pilih Posisi (Kosongkan)
              </li>
              
              <li 
                v-if="filteredPositions.length === 0" 
                class="px-4 py-3 text-sm text-tryout-subtle text-center italic"
              >
                Posisi tidak ditemukan
              </li>
              
              <li
                v-else
                v-for="pos in filteredPositions"
                :key="pos.id"
                @click="selectPosition(pos.title)"
                class="px-4 py-2.5 text-sm cursor-pointer transition-colors capitalize border-b border-tryout-divider last:border-0"
                :class="position === pos.title ? 'bg-tryout-primary/10 text-tryout-primary font-semibold' : 'text-tryout-text hover:bg-tryout-hover'"
              >
                {{ pos.title }}
              </li>
            </ul>
          </div>
        </div>

        <div>
          <label class="block text-tryout-text mb-1.5 text-sm sm:text-base font-medium">
            URL Group (Link Grup Belajar)
          </label>
          <input 
            v-model="urlGroup" 
            type="url" 
            placeholder="contoh: https://t.me/grupbelajar atau https://chat.whatsapp.com/..."
            class="w-full px-4 py-2.5 sm:py-2 border border-tryout-border bg-tryout-surface text-tryout-text rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none transition-shadow"
            :disabled="isLoading"
          />
        </div>

        <div>
          <label class="block text-tryout-text mb-1.5 text-sm sm:text-base font-medium">
            Deskripsi
          </label>
          <textarea 
            v-model="description" 
            rows="4" 
            placeholder="contoh: paket pksti 1, paket pksti 2, paket pksti 3, dst. pisahkan dengan koma"
            class="w-full px-4 py-3 border border-tryout-border bg-tryout-surface text-tryout-text rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none transition-shadow"
            :disabled="isLoading"
          ></textarea>
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
              placeholder="Ex: 50000"
              class="w-full pl-10 pr-4 py-2.5 sm:py-2 border border-tryout-border bg-tryout-surface text-tryout-text rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none transition-shadow"
              :disabled="isLoading"
            />
          </div>
          <p class="text-xs text-tryout-muted mt-1.5">
            Format: angka tanpa titik/koma (contoh: 50000)
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

        <div class="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-8 pt-6 border-t border-tryout-divider">
          <button 
            type="button" 
            @click="handleCancel" 
            :disabled="isLoading"
            class="w-full sm:w-auto px-6 py-2.5 rounded-xl border-2 border-tryout-border bg-tryout-surface text-tryout-text font-bold hover:bg-tryout-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            Batal
          </button>
          <button 
            type="submit" 
            :disabled="isLoading"
            class="w-full sm:w-auto px-6 py-2.5 cursor-pointer rounded-xl bg-tryout-primary text-white font-bold hover:opacity-90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <svg v-if="isLoading" class="animate-spin h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isLoading ? 'Menyimpan...' : 'Simpan Paket' }}
          </button>
        </div>
      </form>
    </div>

    <Teleport to="body">
      <Transition name="fade">
        <div v-if="isCancelModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center px-4">
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
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: var(--color-tryout-hover); }
.custom-scrollbar::-webkit-scrollbar-thumb { background: var(--color-tryout-border); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--color-tryout-muted); }

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