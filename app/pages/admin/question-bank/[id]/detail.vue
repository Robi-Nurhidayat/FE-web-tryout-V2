<script setup>
import * as XLSX from 'xlsx'

definePageMeta({
  layout: 'admin'
})

const route = useRoute()
const questionBankId = route.params.id
const { authToken } = useAuthUser()
const { $api } = useNuxtApp()
const config = useRuntimeConfig()
const toast = useToast()

// Pagination state
const currentPage = ref(1)
const itemsPerPage = ref(20)
const itemsPerPageOptions = [10, 20, 40, 50, 100]

// State untuk search
const search = ref('')

// State untuk Import Excel
const fileInput = ref(null)
const isImporting = ref(false)

// ✅ Fetch question items
const { data: response, refresh } = await useAsyncData(`question-items-${questionBankId}`, () =>
  $api(`/api/v1/questions-banks/${questionBankId}/question-items`)
)

const allQuestionItems = computed(() => response.value?.data || [])

// Filter berdasarkan search
const filteredQuestionItems = computed(() => {
  if (!search.value.trim()) return allQuestionItems.value

  const searchLower = search.value.toLowerCase().trim()

  return allQuestionItems.value.filter(item => {
    const questionText = item.questionText?.toLowerCase() || ''
    const mainTopic = item.mainTopic?.toLowerCase() || ''
    const subTopic = item.subTopic?.toLowerCase() || ''
    const id = item.id?.toString() || ''
    const optionA = item.optionA?.toLowerCase() || ''
    const optionB = item.optionB?.toLowerCase() || ''
    const optionC = item.optionC?.toLowerCase() || ''
    const optionD = item.optionD?.toLowerCase() || ''
    const optionE = item.optionE?.toLowerCase() || ''
    
    return questionText.includes(searchLower) || 
           mainTopic.includes(searchLower) || 
           subTopic.includes(searchLower) ||
           id.includes(searchLower) ||
           optionA.includes(searchLower) ||
           optionB.includes(searchLower) ||
           optionC.includes(searchLower) ||
           optionD.includes(searchLower) ||
           optionE.includes(searchLower)
  })
})

const totalItems = computed(() => filteredQuestionItems.value.length)
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value))

watch([search, itemsPerPage], () => { currentPage.value = 1 })

const questionItems = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredQuestionItems.value.slice(start, end)
})

const pageNumbers = computed(() => {
  const pages = []
  const maxVisible = 5
  let startPage = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  let endPage = Math.min(totalPages.value, startPage + maxVisible - 1)
  
  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1)
  }
  for (let i = startPage; i <= endPage; i++) pages.push(i)
  return pages
})

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) currentPage.value = page
}

// ==========================================
// ✅ CUSTOM MODAL DELETE LOGIC
// ==========================================
const isDeleteModalOpen = ref(false)
const itemToDelete = ref(null)
const isDeleting = ref(false)

const openDeleteModal = (item) => {
  itemToDelete.value = item
  isDeleteModalOpen.value = true
}

const closeDeleteModal = () => {
  isDeleteModalOpen.value = false
  setTimeout(() => { itemToDelete.value = null }, 300)
}

const executeDelete = async () => {
  if (!itemToDelete.value) return

  try {
    isDeleting.value = true
    await $api(`/api/v1/question-items/${itemToDelete.value.id}`, {
      method: 'DELETE'
    })

    toast.add({
      title: 'Berhasil',
      description: `Soal ID ${itemToDelete.value.id} berhasil dihapus!`,
      icon: 'i-heroicons-check-circle',
      color: 'green'
    })
    
    await refresh()
    closeDeleteModal()

  } catch (error) {
    console.error('Delete error:', error)
    toast.add({
      title: 'Gagal Menghapus',
      description: error.data?.message || 'Terjadi kesalahan saat menghapus soal.',
      color: 'red'
    })
  } finally {
    isDeleting.value = false
  }
}

// ✅ Handle broken image links from BE
const handleImageError = (event) => {
  event.target.style.display = 'none'
}

// ✅ FUNGSI HELPER UNTUK MENDAPATKAN URL GAMBAR PENUH
const getImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  // Gabungkan base URL API dengan path gambar
  return `${config.public.apiBaseUrl}${url.startsWith('/') ? '' : '/'}${url}`
}

// ==========================================
// ✅ FUNGSI IMPORT EXCEL 
// ==========================================
const triggerFileInput = () => {
  fileInput.value.click()
}

const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  isImporting.value = true
  
  const loadingToast = toast.add({
    title: 'Memproses Excel...',
    description: 'Mohon tunggu, jangan tutup halaman ini.',
    icon: 'i-heroicons-arrow-path',
    color: 'blue',
    timeout: 0 
  })

  const reader = new FileReader()

  reader.onload = async (e) => {
    try {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)
      
      if (jsonData.length === 0) {
        toast.remove(loadingToast.id)
        toast.add({ title: 'File Kosong', description: 'Tidak ada data soal di dalam Excel.', color: 'amber', icon: 'i-heroicons-exclamation-triangle' })
        return
      }

      await $fetch(`/api/v1/questions-banks/${questionBankId}/question-items/bulk`, {
        baseURL: config.public.apiBaseUrl,
        method: 'POST',
        headers: {
          'Authorization': authToken.value, 
          'Content-Type': 'application/json'
        },
        body: jsonData
      })

      toast.remove(loadingToast.id)
      toast.add({
        title: 'Import Berhasil! 🎉',
        description: `${jsonData.length} soal baru telah ditambahkan ke bank soal.`,
        color: 'green',
        icon: 'i-heroicons-check-circle'
      })
      
      await refresh()

    } catch (err) {
      console.error("Error Import:", err)
      toast.remove(loadingToast.id)
      toast.add({
        title: 'Import Gagal',
        description: err.data?.message || err.message || 'Terjadi kesalahan saat mengimpor Excel.',
        color: 'red',
        icon: 'i-heroicons-x-circle'
      })
    } finally {
      isImporting.value = false
      event.target.value = '' 
    }
  }

  reader.readAsArrayBuffer(file)
}
</script>

<template>
  <main class="min-h-screen bg-tryout-bg p-4 sm:p-6 lg:p-8 relative transition-colors duration-300">
    
    <input 
      type="file" 
      ref="fileInput" 
      @change="handleFileUpload" 
      class="hidden" 
      accept=".xlsx, .xls, .csv" 
    />

    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 mt-4 sm:mt-0">
      <h2 class="text-xl sm:text-2xl font-bold text-tryout-text">Question Bank Detail</h2>
      
      <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <button 
          @click="triggerFileInput"
          :disabled="isImporting"
          class="bg-emerald-600 dark:bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2.5 sm:py-2 rounded-lg text-sm font-semibold shadow-md transition flex items-center justify-center gap-2 active:scale-95 w-full sm:w-auto"
        >
          <svg v-if="isImporting" class="animate-spin h-4 w-4 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <i v-else class="pi pi-file-excel flex-shrink-0"></i>
          {{ isImporting ? 'Importing...' : 'Import Excel' }}
        </button>

        <NuxtLink :to="`/admin/question-bank/${questionBankId}/create-question-item`"
          class="bg-tryout-primary hover:opacity-90 text-white px-4 py-2.5 sm:py-2 rounded-lg text-sm font-semibold shadow-md transition flex items-center justify-center gap-2 active:scale-95 w-full sm:w-auto text-center">
          + Create New Question Item
        </NuxtLink>
      </div>
    </div>

    <div class="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
      <div class="w-full md:max-w-md">
        <div class="relative">
          <input
            v-model="search"
            type="text"
            placeholder="Search question, topic, options..."
            class="w-full rounded-lg py-2 pl-10 pr-10 text-sm focus:ring-2 focus:ring-tryout-primary outline-none transition-shadow border border-tryout-border bg-tryout-surface text-tryout-text"
          />
          <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-tryout-subtle">
            <i class="pi pi-search"></i>
          </span>
          <button v-if="search" @click="search = ''" class="absolute inset-y-0 right-0 flex items-center pr-3 text-tryout-subtle hover:text-tryout-muted transition-colors">
            <i class="pi pi-times"></i>
          </button>
        </div>
      </div>

      <div class="flex items-center gap-2 self-start md:self-auto">
        <label class="text-sm text-tryout-muted whitespace-nowrap">Show:</label>
        <select v-model="itemsPerPage" class="rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-tryout-primary outline-none cursor-pointer border border-tryout-border bg-tryout-surface text-tryout-text">
          <option v-for="option in itemsPerPageOptions" :key="option" :value="option">{{ option }} items</option>
        </select>
      </div>
    </div>

    <div class="mb-4 text-sm text-tryout-muted">
      Showing {{ totalItems === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1 }} to {{ Math.min(currentPage * itemsPerPage, totalItems) }} of {{ totalItems }} entries
    </div>

    <div class="bg-tryout-surface shadow-sm border border-tryout-border rounded-lg transition-colors">
      <table class="w-full text-left border-collapse">
        <thead class="bg-tryout-hover border-b border-tryout-border">
          <tr>
            <th class="p-4 text-sm font-bold text-tryout-text border-r border-tryout-border">ID</th>
            <th class="p-4 text-sm font-bold text-tryout-text border-r border-tryout-border">Question Text</th>
            <th class="p-4 text-sm font-bold text-tryout-text border-r border-tryout-border">Options</th>
            <th class="p-4 text-sm font-bold text-tryout-text border-r border-tryout-border">Correct Answer</th>
            <th class="p-4 text-sm font-bold text-tryout-text border-r border-tryout-border">Explanation</th>
            <th class="p-4 text-sm font-bold text-tryout-text border-r border-tryout-border">Explanation Image</th>
            <th class="p-4 text-sm font-bold text-tryout-text border-r border-tryout-border">Question Image</th>
            <th class="p-4 text-sm font-bold text-tryout-text border-r border-tryout-border">Options Image</th>
            <th class="p-4 text-sm font-bold text-tryout-text border-r border-tryout-border">Correct Answer Image</th>
            <th class="p-4 text-sm font-bold text-tryout-text border-r border-tryout-border">Sub Topic</th>
            <th class="p-4 text-sm font-bold text-tryout-text border-r border-tryout-border">Main Topic</th>
            <th class="p-4 text-sm font-bold text-tryout-text text-center">Actions</th>
          </tr>
        </thead>

        <tbody class="divide-y divide-tryout-divider">
          <tr v-if="questionItems.length === 0">
            <td colspan="12" class="text-center p-8 text-tryout-muted">
              {{ search ? `No results found for "${search}"` : 'Belum ada data soal.' }}
            </td>
          </tr>

          <tr v-else v-for="item in questionItems" :key="item.id" class="hover:bg-tryout-hover/50 transition-colors">
            <td class="p-4 text-sm text-tryout-muted border-r border-tryout-divider">{{ item.id }}</td>
            
            <td class="p-4 text-sm text-tryout-text whitespace-pre-wrap border-r border-tryout-divider">
              {{ item.questionText || '' }}
            </td>
            
            <td class="p-4 text-sm text-tryout-text border-r border-tryout-divider">
              <div class="text-xs space-y-1 bg-tryout-bg p-3 rounded-lg border border-tryout-border shadow-sm">
                <div v-if="item.optionA"><span class="font-bold">A:</span> {{ item.optionA }} ({{ item.scoreOptionA }})</div>
                <div v-if="item.optionB"><span class="font-bold">B:</span> {{ item.optionB }} ({{ item.scoreOptionB }})</div>
                <div v-if="item.optionC"><span class="font-bold">C:</span> {{ item.optionC }} ({{ item.scoreOptionC }})</div>
                <div v-if="item.optionD"><span class="font-bold">D:</span> {{ item.optionD }} ({{ item.scoreOptionD }})</div>
                <div v-if="item.optionE"><span class="font-bold">E:</span> {{ item.optionE }} ({{ item.scoreOptionE }})</div>
              </div>
            </td>
            
            <td class="p-4 text-sm border-r border-tryout-divider text-center">
              <span v-if="item.correctAnswerText" class="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-md text-xs font-bold inline-block">
                {{ item.correctAnswerText }}
              </span>
            </td>
            
            <td class="p-4 text-sm text-tryout-text whitespace-pre-wrap opacity-90 border-r border-tryout-divider">
              {{ item.explanation || '' }}
            </td>

            <td class="p-4 text-sm border-r border-tryout-divider text-center">
              <img v-if="item.explanationImage" :src="getImageUrl(item.explanationImage)" class="max-h-20 object-contain rounded border border-tryout-border bg-tryout-bg p-1 shadow-sm mx-auto" loading="lazy" @error="handleImageError"/>
            </td>
            
            <td class="p-4 text-sm border-r border-tryout-divider text-center">
              <img v-if="item.questionImage" :src="getImageUrl(item.questionImage)" class="max-h-20 object-contain rounded border border-tryout-border bg-tryout-bg p-1 shadow-sm mx-auto" loading="lazy" @error="handleImageError"/>
            </td>
            
            <td class="p-4 text-sm border-r border-tryout-divider">
              <div class="flex flex-col gap-2 items-center">
                <img v-if="item.imageOptionA" :src="getImageUrl(item.imageOptionA)" class="max-h-16 object-contain rounded border border-tryout-border bg-tryout-bg p-1" @error="handleImageError"/>
                <img v-if="item.imageOptionB" :src="getImageUrl(item.imageOptionB)" class="max-h-16 object-contain rounded border border-tryout-border bg-tryout-bg p-1" @error="handleImageError"/>
                <img v-if="item.imageOptionC" :src="getImageUrl(item.imageOptionC)" class="max-h-16 object-contain rounded border border-tryout-border bg-tryout-bg p-1" @error="handleImageError"/>
                <img v-if="item.imageOptionD" :src="getImageUrl(item.imageOptionD)" class="max-h-16 object-contain rounded border border-tryout-border bg-tryout-bg p-1" @error="handleImageError"/>
                <img v-if="item.imageOptionE" :src="getImageUrl(item.imageOptionE)" class="max-h-16 object-contain rounded border border-tryout-border bg-tryout-bg p-1" @error="handleImageError"/>
              </div>
            </td>

            <td class="p-4 text-sm border-r border-tryout-divider text-center">
              <img v-if="item.correctAnswerImage" :src="getImageUrl(item.correctAnswerImage)" class="max-h-20 object-contain rounded border border-tryout-border bg-tryout-bg p-1 shadow-sm mx-auto" loading="lazy" @error="handleImageError"/>
            </td>

            <td class="p-4 text-sm text-tryout-text border-r border-tryout-divider">{{ item.subTopic || '-' }}</td>
            <td class="p-4 text-sm text-tryout-text border-r border-tryout-divider text-center">
              <span v-if="item.mainTopic" class="bg-tryout-hover text-tryout-text border border-tryout-border px-2.5 py-1.5 rounded text-xs font-bold inline-block">{{ item.mainTopic }}</span>
              <span v-else>-</span>
            </td>
            
            <td class="p-4 text-sm text-center">
              <div class="flex flex-col gap-2 items-center justify-center">
                <NuxtLink :to="`/admin/question-bank/${questionBankId}/question-item/${item.id}/edit`" class="text-tryout-primary hover:opacity-80 font-bold transition-opacity">
                  Edit
                </NuxtLink>
                <button @click="openDeleteModal(item)" class="text-red-500 dark:text-red-400 hover:opacity-80 font-bold cursor-pointer transition-opacity">
                  Delete
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
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
    </div>

    <Teleport to="body">
      <Transition name="fade">
        <div v-if="isDeleteModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm" @click="!isDeleting && closeDeleteModal()"></div>
          
          <div class="bg-tryout-surface rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden border border-tryout-border">
            <div class="bg-red-50 dark:bg-red-900/10 p-6 flex justify-center border-b border-red-100 dark:border-red-900/30">
              <div class="w-16 h-16 bg-red-100 dark:bg-red-800/30 rounded-full flex items-center justify-center">
                <svg class="w-8 h-8 text-red-600 dark:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              </div>
            </div>

            <div class="p-6 text-center">
              <h3 class="text-xl font-extrabold text-tryout-text mb-2">Hapus Soal?</h3>
              <p class="text-tryout-muted text-sm mb-3">Apakah Anda yakin ingin menghapus soal ini?</p>
              
              <div class="bg-tryout-hover border border-tryout-border p-3 rounded-lg text-left inline-block max-w-full">
                <p class="text-xs text-tryout-subtle mb-1">ID Soal: <span class="font-bold text-tryout-text">{{ itemToDelete?.id }}</span></p>
                <p class="text-sm text-tryout-text font-medium line-clamp-2">{{ itemToDelete?.questionText || 'Soal Gambar' }}</p>
              </div>

              <p class="text-red-500 dark:text-red-400 text-xs mt-4 font-bold">Tindakan ini tidak dapat dibatalkan.</p>
            </div>

            <div class="p-6 bg-tryout-hover/50 flex flex-col sm:flex-row gap-3 border-t border-tryout-divider">
              <button 
                @click="closeDeleteModal" 
                :disabled="isDeleting"
                class="flex-1 px-4 py-2.5 bg-tryout-surface border border-tryout-border text-tryout-text font-bold rounded-xl hover:bg-tryout-hover transition disabled:opacity-50 active:scale-[0.98]"
              >
                Batal
              </button>
              <button 
                @click="executeDelete" 
                :disabled="isDeleting"
                class="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition flex justify-center items-center gap-2 disabled:opacity-70 shadow-md shadow-red-600/20 active:scale-[0.98]"
              >
                <svg v-if="isDeleting" class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ isDeleting ? 'Menghapus...' : 'Ya, Hapus' }}
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