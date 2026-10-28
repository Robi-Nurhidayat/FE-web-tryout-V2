<script setup>
definePageMeta({
  layout: 'admin'
})

const search = ref('')
const selectedQuestionBanks = ref([])
const router = useRouter()
const route = useRoute()
const packetId = String(route.params.id) 

// ✅ Get $api and toast
const { $api } = useNuxtApp()
const toast = useToast()

// Pagination state
const currentPage = ref(1)
const itemsPerPage = ref(20)
const itemsPerPageOptions = [10, 20, 40, 50, 100]

// State Modal & Loading
const isConfirmModalOpen = ref(false)
const isSubmitting = ref(false)

// ✅ Fetch existing packet items (Diberikan nama fungsi refresh khusus)
const { data: packetData, refresh: refreshPacketData } = await useAsyncData(`packet-items-${packetId}`, () =>
  $api(`/api/v1/packet-items/by-packet-id/${packetId}`)
)

// ✅ Fetch all question banks (Diberikan nama fungsi refresh khusus)
const { data: response, refresh: refreshAllBanks } = await useAsyncData('all-question-banks', () =>
  $api('/api/v1/question-banks')
)

// ✅ TRICK ANTI STALE-DATA: Paksa refresh agar data selalu up-to-date saat halaman dibuka
onMounted(() => {
  refreshPacketData()
  refreshAllBanks()
})

// ✅ Filter questions yang belum ada di packet (LOGIKA DIPERBAIKI)
const availableQuestions = computed(() => {
  const allBanks = response.value?.data || []
  const existingItems = packetData.value?.data || []

  // 1. Kumpulkan semua questionBankId yang sudah ada di paket. 
  // Paksa ubah menjadi String agar aman dari perbedaan tipe data (Number vs String)
  const existingIds = new Set(existingItems.map(item => String(item.questionBankId)))

  // 2. Filter: Hanya tampilkan question bank yang ID-nya belum ada di dalam paket
  return allBanks.filter(qb => !existingIds.has(String(qb.id)))
})

// Filter berdasarkan search
const filteredQuestions = computed(() => {
  if (!search.value.trim()) {
    return availableQuestions.value
  }

  const searchLower = search.value.toLowerCase().trim()

  return availableQuestions.value.filter(item => {
    const title = item.title?.toLowerCase() || ''
    const position = item.position?.toLowerCase() || ''
    const subCategoryTitle = item.subCategoryTitle?.toLowerCase() || ''
    
    return title.includes(searchLower) || 
           position.includes(searchLower) || 
           subCategoryTitle.includes(searchLower)
  })
})

// Pagination calculations
const totalItems = computed(() => filteredQuestions.value.length)
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value))

// Reset to page 1 when search changes
watch([search, itemsPerPage], () => {
  currentPage.value = 1
})

// Paginated data
const questionBanks = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredQuestions.value.slice(start, end)
})

// Pagination helper
const pageNumbers = computed(() => {
  const pages = []
  const maxVisible = 5
  
  let startPage = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  let endPage = Math.min(totalPages.value, startPage + maxVisible - 1)
  
  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1)
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }
  
  return pages
})

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

// ✅ Handle select/deselect
const handleSelectOrDeselect = (questionBankId) => {
  // Pastikan ID disave sebagai string biar aman
  const stringId = String(questionBankId)
  if (selectedQuestionBanks.value.includes(stringId)) {
    selectedQuestionBanks.value = selectedQuestionBanks.value.filter(id => id !== stringId)
  } else {
    selectedQuestionBanks.value.push(stringId)
  }
}

// ✅ Select all on current page
const selectAllOnPage = () => {
  const currentPageIds = questionBanks.value.map(qb => String(qb.id))
  const allSelected = currentPageIds.every(id => selectedQuestionBanks.value.includes(id))
  
  if (allSelected) {
    selectedQuestionBanks.value = selectedQuestionBanks.value.filter(
      id => !currentPageIds.includes(id)
    )
  } else {
    currentPageIds.forEach(id => {
      if (!selectedQuestionBanks.value.includes(id)) {
        selectedQuestionBanks.value.push(id)
      }
    })
  }
}

const isAllSelectedOnPage = computed(() => {
  const currentPageIds = questionBanks.value.map(qb => String(qb.id))
  return currentPageIds.length > 0 && currentPageIds.every(id => selectedQuestionBanks.value.includes(id))
})

// ✅ Buka Modal Konfirmasi
const openConfirmModal = () => {
  if (selectedQuestionBanks.value.length === 0) {
    toast.add({
      title: 'Peringatan',
      description: 'Pilih minimal 1 question bank terlebih dahulu!',
      color: 'amber',
      icon: 'i-heroicons-exclamation-triangle'
    })
    return
  }
  isConfirmModalOpen.value = true
}

// ✅ Eksekusi Add Question Banks
const executeAdd = async () => {
  try {
    isSubmitting.value = true
    isConfirmModalOpen.value = false 

    const loadingToast = toast.add({
      title: 'Memproses...',
      description: `Sedang menambahkan ${selectedQuestionBanks.value.length} soal ke paket...`,
      icon: 'i-heroicons-arrow-path',
      color: 'blue',
      timeout: 0 
    })

    await $api('/api/v1/packet-items', {
      method: 'POST',
      body: {
        packetId: packetId, 
        questionBankId: selectedQuestionBanks.value // Mengirim [ "id1", "id2" ]
      },
    })

    toast.remove(loadingToast.id)
    toast.add({
      title: 'Berhasil!',
      description: `${selectedQuestionBanks.value.length} question bank(s) berhasil ditambahkan`,
      color: 'green',
      icon: 'i-heroicons-check-circle'
    })

    setTimeout(() => {
      router.push(`/admin/packets/${packetId}/detail`)
    }, 500)
    
  } catch (error) {
    console.error('Add error:', error)
    
    const errorMessage = error?.data?.message || error?.response?._data?.message || 'Gagal menambahkan question banks.'
    
    toast.add({
      title: 'Gagal Menambahkan',
      description: errorMessage,
      color: 'red',
      icon: 'i-heroicons-x-circle'
    })
  } finally {
    isSubmitting.value = false
  }
}

// ✅ Format rupiah
const formatPrice = (price) => {
  if (!price) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(price)
}
</script>

<template>
  <main class="min-h-screen bg-tryout-bg p-4 sm:p-6 lg:p-8 relative transition-colors duration-300">
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 mt-4 sm:mt-0">
      <div>
        <h2 class="text-xl sm:text-2xl font-bold text-tryout-text">Pilih Question Bank</h2>
        <p class="text-sm text-tryout-muted mt-1">Tambahkan question bank ke paket</p>
      </div>
      <NuxtLink 
        :to="`/admin/packets/${packetId}/detail`"
        :class="isSubmitting ? 'pointer-events-none opacity-50' : ''"
        class="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-tryout-surface hover:bg-tryout-hover border border-tryout-border text-tryout-text rounded-lg text-sm font-semibold transition-colors text-center active:scale-[0.98]"
      >
        ← Kembali
      </NuxtLink>
    </div>

    <div class="mb-6 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
      <div class="w-full lg:max-w-md">
        <div class="relative">
          <input 
            v-model="search" 
            type="text" 
            placeholder="Search title, position, or sub category..."
            class="w-full border border-tryout-border bg-tryout-surface text-tryout-text rounded-lg py-2.5 pl-10 pr-10 text-sm focus:ring-2 focus:ring-tryout-primary outline-none transition-shadow" 
          />
          <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-tryout-subtle">
            <i class="pi pi-search"></i>
          </span>
          <button 
            v-if="search" 
            @click="search = ''"
            class="absolute inset-y-0 right-0 flex items-center pr-3 text-tryout-subtle hover:text-tryout-muted transition-colors"
          >
            <i class="pi pi-times"></i>
          </button>
        </div>
        <p v-if="search" class="text-sm text-tryout-muted mt-2">
          Found {{ totalItems }} result(s) for "{{ search }}"
        </p>
      </div>

      <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto justify-end">
        <div class="flex items-center gap-2 self-start sm:self-auto">
          <label class="text-sm text-tryout-muted whitespace-nowrap">Show:</label>
          <select 
            v-model="itemsPerPage" 
            class="border border-tryout-border bg-tryout-surface text-tryout-text rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-tryout-primary outline-none cursor-pointer"
          >
            <option v-for="option in itemsPerPageOptions" :key="option" :value="option">
              {{ option }} items
            </option>
          </select>
        </div>

        <div class="flex items-center gap-3 w-full sm:w-auto">
          <div class="text-sm text-tryout-text whitespace-nowrap">
            <span class="font-bold text-tryout-primary">{{ selectedQuestionBanks.length }}</span> dipilih
          </div>
          <button 
            @click="openConfirmModal" 
            :disabled="selectedQuestionBanks.length === 0 || isSubmitting"
            class="w-full sm:w-auto px-5 py-2.5 bg-tryout-primary hover:opacity-90 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-sm active:scale-[0.98]"
          >
            <svg v-if="isSubmitting" class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span v-else>+ Tambah ke Paket</span>
          </button>
        </div>
      </div>
    </div>

    <div class="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-sm text-tryout-muted">
      <span>
        Showing {{ totalItems === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1 }} to {{ Math.min(currentPage * itemsPerPage, totalItems) }} of {{ totalItems }} entries
      </span>
      <button 
        v-if="questionBanks.length > 0"
        @click="selectAllOnPage"
        class="text-tryout-primary hover:opacity-80 font-bold transition-opacity"
      >
        {{ isAllSelectedOnPage ? 'Deselect' : 'Select' }} All on Page
      </button>
    </div>

    <div class="bg-tryout-surface shadow-sm border border-tryout-border rounded-xl overflow-hidden w-full transition-colors">
      <div class="overflow-x-auto custom-scrollbar w-full">
        <table class="w-full min-w-full border-collapse">
          <thead class="bg-tryout-hover border-b border-tryout-border">
            <tr>
              <th class="px-6 py-4 text-center text-sm font-bold text-tryout-text uppercase tracking-wider w-16">
                <input 
                  type="checkbox" 
                  :checked="isAllSelectedOnPage"
                  @change="selectAllOnPage"
                  class="w-4 h-4 text-tryout-primary bg-tryout-bg border-tryout-border rounded cursor-pointer focus:ring-tryout-primary"
                />
              </th>
              <th class="px-6 py-4 text-left text-xs font-bold text-tryout-text uppercase tracking-wider whitespace-nowrap">ID</th>
              <th class="px-6 py-4 text-left text-xs font-bold text-tryout-text uppercase tracking-wider w-full min-w-[250px]">Title</th>
              <th class="px-6 py-4 text-left text-xs font-bold text-tryout-text uppercase tracking-wider whitespace-nowrap">Position</th>
              <th class="px-6 py-4 text-left text-xs font-bold text-tryout-text uppercase tracking-wider whitespace-nowrap">Sub Category</th>
              <th class="px-6 py-4 text-left text-xs font-bold text-tryout-text uppercase tracking-wider whitespace-nowrap">Price</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-tryout-divider">
            <tr v-if="questionBanks.length === 0">
              <td colspan="6" class="text-center p-8 text-tryout-muted">
                <div class="flex flex-col items-center gap-2">
                  <svg class="w-12 h-12 text-tryout-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p class="font-medium">
                    {{ search ? `No results found for "${search}"` : 'Semua question bank yang tersedia sudah ditambahkan ke paket ini' }}
                  </p>
                </div>
              </td>
            </tr>

            <tr 
              v-else 
              v-for="questionBank in questionBanks" 
              :key="questionBank.id" 
              class="hover:bg-tryout-hover/50 transition-colors cursor-pointer"
              @click="handleSelectOrDeselect(questionBank.id)"
            >
              <td class="px-6 py-4 text-sm border-r border-transparent group-hover:border-tryout-divider text-center">
                <button
                  class="cursor-pointer border-2 h-6 w-6 rounded flex items-center justify-center transition-all mx-auto"
                  :class="selectedQuestionBanks.includes(String(questionBank.id))
                    ? 'border-tryout-primary bg-tryout-primary/10 text-tryout-primary dark:text-tryout-primary dark:border-tryout-primary'
                    : 'border-tryout-border bg-tryout-bg text-transparent hover:border-tryout-muted'"
                  @click.stop="handleSelectOrDeselect(questionBank.id)"
                >
                  <i class="pi pi-check text-xs" v-show="selectedQuestionBanks.includes(String(questionBank.id))"></i>
                </button>
              </td>
              <td class="px-6 py-4 text-sm text-tryout-muted font-mono whitespace-nowrap">{{ questionBank.id }}</td>
              <td class="px-6 py-4 text-sm text-tryout-text font-medium whitespace-normal">
                <div class="line-clamp-2">{{ questionBank.title }}</div>
              </td>
              <td class="px-6 py-4 text-sm">
                <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-tryout-hover border border-tryout-border text-tryout-text whitespace-nowrap">
                  {{ questionBank.position || '-' }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-tryout-text whitespace-nowrap">{{ questionBank.subCategoryTitle || '-' }}</td>
              <td class="px-6 py-4 text-sm text-tryout-text font-bold whitespace-nowrap">{{ formatPrice(questionBank.price) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="totalPages > 1" class="mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
      <div class="text-sm text-tryout-muted order-2 md:order-1">Page {{ currentPage }} of {{ totalPages }}</div>
      
      <div class="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 order-1 md:order-2">
        <button @click="goToPage(1)" :disabled="currentPage === 1" class="px-2 sm:px-3 py-1.5 sm:py-2 border border-tryout-border bg-tryout-surface text-tryout-text rounded-lg text-sm hover:bg-tryout-hover disabled:opacity-50 disabled:cursor-not-allowed transition"><i class="pi pi-angle-double-left"></i></button>
        <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1" class="px-2 sm:px-3 py-1.5 sm:py-2 border border-tryout-border bg-tryout-surface text-tryout-text rounded-lg text-sm hover:bg-tryout-hover disabled:opacity-50 disabled:cursor-not-allowed transition"><i class="pi pi-angle-left"></i></button>
        
        <button 
          v-for="page in pageNumbers" 
          :key="page" 
          @click="goToPage(page)" 
          :class="['px-3 sm:px-4 py-1.5 sm:py-2 border rounded-lg text-sm transition font-medium', page === currentPage ? 'bg-tryout-primary text-white border-tryout-primary' : 'bg-tryout-surface text-tryout-text border-tryout-border hover:bg-tryout-hover']"
        >
          {{ page }}
        </button>
        
        <button @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages" class="px-2 sm:px-3 py-1.5 sm:py-2 border border-tryout-border bg-tryout-surface text-tryout-text rounded-lg text-sm hover:bg-tryout-hover disabled:opacity-50 disabled:cursor-not-allowed transition"><i class="pi pi-angle-right"></i></button>
        <button @click="goToPage(totalPages)" :disabled="currentPage === totalPages" class="px-2 sm:px-3 py-1.5 sm:py-2 border border-tryout-border bg-tryout-surface text-tryout-text rounded-lg text-sm hover:bg-tryout-hover disabled:opacity-50 disabled:cursor-not-allowed transition"><i class="pi pi-angle-double-right"></i></button>
      </div>

      <div class="flex items-center gap-2 order-3">
        <label class="text-sm text-tryout-muted whitespace-nowrap">Go to:</label>
        <input 
          type="number" 
          :value="currentPage" 
          @change="goToPage(Number($event.target.value))" 
          min="1" 
          :max="totalPages" 
          class="w-16 rounded-lg py-1 px-2 text-sm text-center focus:ring-2 focus:ring-tryout-primary outline-none border border-tryout-border bg-tryout-surface text-tryout-text" 
        />
      </div>
    </div>

    <Teleport to="body">
      <Transition name="fade">
        <div v-if="isConfirmModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm" @click="!isSubmitting && (isConfirmModalOpen = false)"></div>
          
          <div class="bg-tryout-surface rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden border border-tryout-border transition-transform">
            <div class="bg-blue-50 dark:bg-blue-900/10 p-6 flex justify-center border-b border-blue-100 dark:border-blue-900/30">
              <div class="w-16 h-16 bg-blue-100 dark:bg-blue-800/30 rounded-full flex items-center justify-center">
                <svg class="w-8 h-8 text-blue-600 dark:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
              </div>
            </div>

            <div class="p-6 text-center">
              <h3 class="text-xl font-extrabold text-tryout-text mb-2">Tambahkan ke Paket?</h3>
              <p class="text-tryout-muted text-sm mb-3">Anda akan menambahkan <span class="font-bold text-tryout-text">{{ selectedQuestionBanks.length }}</span> question bank ke dalam paket ini.</p>
            </div>

            <div class="p-6 bg-tryout-hover/50 flex flex-col sm:flex-row gap-3 border-t border-tryout-divider">
              <button 
                @click="isConfirmModalOpen = false" 
                :disabled="isSubmitting"
                class="flex-1 px-4 py-2.5 bg-tryout-surface border border-tryout-border text-tryout-text font-bold rounded-xl hover:bg-tryout-hover transition disabled:opacity-50 active:scale-[0.98]"
              >
                Batal
              </button>
              <button 
                @click="executeAdd" 
                :disabled="isSubmitting"
                class="flex-1 px-4 py-2.5 bg-tryout-primary text-white font-bold rounded-xl hover:opacity-90 transition shadow-sm disabled:opacity-70 flex justify-center items-center gap-2 active:scale-[0.98]"
              >
                <svg v-if="isSubmitting" class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ isSubmitting ? 'Memproses...' : 'Ya, Tambahkan' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </main>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
.custom-scrollbar::-webkit-scrollbar-track { background: var(--color-tryout-hover); border-radius: 8px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: var(--color-tryout-border); border-radius: 8px; }
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