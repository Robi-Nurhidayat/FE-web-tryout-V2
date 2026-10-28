<script setup>
import * as XLSX from 'xlsx' // ✅ Import pustaka excel

definePageMeta({
  layout: 'admin'
})

const search = ref('')
const { authToken } = useAuthUser();
const { $api } = useNuxtApp()
const toast = useToast()

// Pagination state
const currentPage = ref(1)
const itemsPerPage = ref(20)
const itemsPerPageOptions = [10, 20, 40, 50, 100]

// ✅ STATE IMPORT EXCEL
const fileInput = ref(null)
const isImporting = ref(false)

// ✅ Fetch dengan $api
const { data: response, refresh } = await useAsyncData('positions', () =>
  $api('/api/v1/positions')
)

// All positions
const allPositions = computed(() => response.value?.data || [])

// Filter berdasarkan search
const filteredPositions = computed(() => {
  if (!search.value.trim()) {
    return allPositions.value
  }

  const searchLower = search.value.toLowerCase().trim()

  return allPositions.value.filter(item => {
    const title = item.title?.toLowerCase() || ''
    const id = item.id?.toString() || ''
    
    return title.includes(searchLower) || id.includes(searchLower)
  })
})

// Pagination calculations
const totalItems = computed(() => filteredPositions.value.length)
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value))

// Reset to page 1 when search changes or items per page changes
watch([search, itemsPerPage], () => {
  currentPage.value = 1
})

// Paginated data
const positions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredPositions.value.slice(start, end)
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
    description: 'Mohon tunggu, sistem sedang membaca data.',
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
      const rawJsonData = XLSX.utils.sheet_to_json(worksheet)
      
      if (rawJsonData.length === 0) {
        toast.remove(loadingToast.id)
        toast.add({ title: 'File Kosong', description: 'Tidak ada data di dalam Excel.', color: 'amber', icon: 'i-heroicons-exclamation-triangle' })
        return
      }

      // Format data: pastikan kita mencari field 'title' atau 'Title'
      const formattedData = rawJsonData.map(row => ({
        title: row.title || row.Title || Object.values(row)[0] // Fallback ke kolom pertama jika header tidak presisi
      })).filter(item => item.title && item.title.toString().trim() !== '')

      if (formattedData.length === 0) {
        toast.remove(loadingToast.id)
        toast.add({ title: 'Format Salah', description: 'Pastikan file Excel memiliki kolom "title".', color: 'amber', icon: 'i-heroicons-exclamation-triangle' })
        return
      }

      // Tembak API Bulk
      const res = await $api('/api/v1/positions/bulk', {
        method: 'POST',
        body: formattedData
      })

      toast.remove(loadingToast.id)
      toast.add({
        title: 'Import Berhasil! 🎉',
        description: res?.message || `${formattedData.length} data diproses.`,
        color: 'green',
        icon: 'i-heroicons-check-circle'
      })
      
      // Refresh Data Tabel
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
      event.target.value = '' // Reset input file
    }
  }

  reader.readAsArrayBuffer(file)
}

// ✅ MODAL STATE LOGIC
const isDeleteModalOpen = ref(false)
const positionToDelete = ref(null)
const isDeleting = ref(false)

const openDeleteModal = (position) => {
  positionToDelete.value = position
  isDeleteModalOpen.value = true
}

const closeDeleteModal = () => {
  isDeleteModalOpen.value = false
  setTimeout(() => {
    positionToDelete.value = null
  }, 300)
}

// ✅ FUNGSI EKSEKUSI DELETE
const executeDelete = async () => {
  if (!positionToDelete.value) return

  try {
    isDeleting.value = true
    await $api(`/api/v1/positions/${positionToDelete.value.id}`, {
      method: 'DELETE'
    })

    // Toast Success
    toast.add({
      title: 'Berhasil',
      description: `Position "${positionToDelete.value.title}" berhasil dihapus!`,
      icon: 'i-heroicons-check-circle',
      color: 'green'
    })
    
    await refresh()
    closeDeleteModal()

  } catch (error) {
    console.error('Delete error:', error)
    
    // Toast Error
    toast.add({
      title: 'Gagal Menghapus',
      description: error.data?.message || 'Terjadi kesalahan saat menghapus position.',
      color: 'red'
    })
  } finally {
    isDeleting.value = false
  }
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

    <div class="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4 mb-6">
      <h2 class="text-xl sm:text-2xl font-bold text-tryout-text">Positions Management</h2>
      
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

        <NuxtLink to="/admin/positions/create"
          class="bg-tryout-primary hover:opacity-90 text-white px-4 py-2.5 sm:py-2 rounded-lg text-sm font-semibold shadow-md transition flex items-center justify-center gap-2 active:scale-95 w-full sm:w-auto">
          + Create New Position
        </NuxtLink>
      </div>
    </div>

    <div class="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
      <div class="w-full md:max-w-md">
        <div class="relative">
          <input
            v-model="search"
            type="text"
            placeholder="Search title or ID..."
            class="w-full rounded-lg py-2 pl-10 pr-10 text-sm focus:ring-2 focus:ring-tryout-primary outline-none transition-shadow border border-tryout-border bg-tryout-surface text-tryout-text"
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

      <div class="flex items-center gap-2 self-start md:self-auto">
        <label class="text-sm text-tryout-muted whitespace-nowrap">Show:</label>
        <select 
          v-model="itemsPerPage" 
          class="rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-tryout-primary outline-none cursor-pointer border border-tryout-border bg-tryout-surface text-tryout-text"
        >
          <option v-for="option in itemsPerPageOptions" :key="option" :value="option">
            {{ option }} items
          </option>
        </select>
      </div>
    </div>

    <div class="mb-4 text-sm text-tryout-muted">
      Showing {{ totalItems === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1 }} to {{ Math.min(currentPage * itemsPerPage, totalItems) }} of {{ totalItems }} entries
    </div>

    <div class="bg-tryout-surface shadow-sm border border-tryout-border rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full border-collapse">
          <thead class="bg-tryout-hover border-b border-tryout-border">
            <tr>
              <th class="px-4 sm:px-6 py-3.5 text-left text-xs sm:text-sm font-semibold text-tryout-text uppercase tracking-wider w-24 whitespace-nowrap">
                ID
              </th>
              <th class="px-4 sm:px-6 py-3.5 text-left text-xs sm:text-sm font-semibold text-tryout-text uppercase tracking-wider min-w-[200px]">
                Title
              </th>
              <th class="px-4 sm:px-6 py-3.5 text-left text-xs sm:text-sm font-semibold text-tryout-text uppercase tracking-wider w-48 whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>

          <tbody class="divide-y divide-tryout-divider">
            <tr v-if="positions.length === 0">
              <td colspan="3" class="text-center p-8 text-tryout-muted">
                <div class="flex flex-col items-center gap-2">
                  <i class="pi pi-folder-open text-3xl text-tryout-subtle"></i>
                  <p>{{ search ? `No results found for "${search}"` : 'Belum ada data posisi.' }}</p>
                </div>
              </td>
            </tr>

            <tr
              v-else
              v-for="position in positions"
              :key="position.id"
              class="hover:bg-tryout-hover/50 transition-colors"
            >
              <td class="px-4 sm:px-6 py-4 text-sm text-tryout-muted font-mono whitespace-nowrap">
                #{{ position.id }}
              </td>
              <td class="px-4 sm:px-6 py-4 text-sm font-semibold">
                <span class="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full capitalize whitespace-nowrap inline-block">
                  {{ position.title }}
                </span>
              </td>
              <td class="px-4 sm:px-6 py-4 text-sm whitespace-nowrap">
                <div class="flex items-center gap-3">
                  <NuxtLink
                    :to="`/admin/positions/${position.id}/edit`"
                    class="text-tryout-primary hover:opacity-80 font-medium transition-opacity"
                  >
                    Edit
                  </NuxtLink>
                  <span class="text-tryout-border">|</span>
                  <button @click="openDeleteModal(position)" class="text-red-500 dark:text-red-400 hover:opacity-80 font-medium cursor-pointer transition-opacity">
                    Delete
                  </button>
                </div>
              </td>
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
              <h3 class="text-xl font-extrabold text-tryout-text mb-2">Hapus Posisi?</h3>
              <p class="text-tryout-muted text-sm mb-1">Apakah Anda yakin ingin menghapus posisi ini?</p>
              <p class="text-tryout-text font-bold bg-tryout-hover py-2 px-4 rounded-lg inline-block mt-2 border border-tryout-border">
                {{ positionToDelete?.title }}
              </p>
              <p class="text-red-500 dark:text-red-400 text-xs mt-4 font-medium">Tindakan ini tidak dapat dibatalkan.</p>
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
                class="flex-1 px-4 py-2.5 bg-red-600 dark:bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition flex justify-center items-center gap-2 disabled:opacity-70 active:scale-[0.98]"
              >
                <svg v-if="isDeleting" class="animate-spin h-4 w-4 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24">
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