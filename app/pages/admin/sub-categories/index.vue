<script setup>
definePageMeta({
  layout: 'admin'
})

const search = ref('')
const { authToken } = useAuthUser();
const { $api } = useNuxtApp()
const toast = useToast() // ✅ Tambahkan Toast

// Pagination state
const currentPage = ref(1)
const itemsPerPage = ref(20)
const itemsPerPageOptions = [10, 20, 40, 50, 100]

const { data: response, refresh } = await useAsyncData('sub-categories', () =>
  $api('/api/v1/sub-categories')
)

// All sub categories
const allSubCategories = computed(() => response.value?.data || [])

// Filter berdasarkan search
const filteredSubCategories = computed(() => {
  if (!search.value.trim()) {
    return allSubCategories.value
  }

  const searchLower = search.value.toLowerCase().trim()

  return allSubCategories.value.filter(item => {
    const title = item.title?.toLowerCase() || ''
    const categoryTitle = item.categoryTitle?.toLowerCase() || ''
    const id = item.id?.toString() || ''
    
    return title.includes(searchLower) || 
           categoryTitle.includes(searchLower) || 
           id.includes(searchLower)
  })
})

// Pagination calculations
const totalItems = computed(() => filteredSubCategories.value.length)
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value))

// Reset to page 1 when search changes or items per page changes
watch([search, itemsPerPage], () => {
  currentPage.value = 1
})

// Paginated data
const subCategories = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredSubCategories.value.slice(start, end)
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

// ✅ MODAL STATE LOGIC
const isDeleteModalOpen = ref(false)
const subCategoryToDelete = ref(null)
const isDeleting = ref(false)

const openDeleteModal = (sub) => {
  subCategoryToDelete.value = sub
  isDeleteModalOpen.value = true
}

const closeDeleteModal = () => {
  isDeleteModalOpen.value = false
  setTimeout(() => {
    subCategoryToDelete.value = null
  }, 300)
}

// ✅ FUNGSI EKSEKUSI DELETE
const executeDelete = async () => {
  if (!subCategoryToDelete.value) return

  try {
    isDeleting.value = true
    await $api(`/api/v1/sub-categories/${subCategoryToDelete.value.id}`, {
      method: 'DELETE'
    })

    // Toast Success
    toast.add({
      title: 'Berhasil',
      description: `SubCategory "${subCategoryToDelete.value.title}" berhasil dihapus!`,
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
      description: error.data?.message || 'Terjadi kesalahan saat menghapus SubCategory.',
      color: 'red'
    })
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <main class="min-h-screen bg-tryout-bg p-4 sm:p-6 lg:p-8 relative transition-colors duration-300">
    
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <h2 class="text-xl sm:text-2xl font-bold text-tryout-text">SubCategory Management</h2>
      <NuxtLink to="/admin/sub-categories/create"
        class="bg-tryout-primary hover:opacity-90 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-md transition-all active:scale-95 w-full sm:w-auto text-center">
        + Create New SubCategory
      </NuxtLink>
    </div>

    <div class="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
      <div class="w-full md:max-w-md">
        <div class="relative">
          <input
            v-model="search"
            type="text"
            placeholder="Search subcategory, category title, or ID..."
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
              <th class="px-4 sm:px-6 py-3.5 text-left text-xs sm:text-sm font-semibold text-tryout-text uppercase tracking-wider whitespace-nowrap">ID</th>
              <th class="px-4 sm:px-6 py-3.5 text-left text-xs sm:text-sm font-semibold text-tryout-text uppercase tracking-wider min-w-[200px]">SubCategory Title</th>
              <th class="px-4 sm:px-6 py-3.5 text-left text-xs sm:text-sm font-semibold text-tryout-text uppercase tracking-wider min-w-[150px]">Category Title</th>
              <th class="px-4 sm:px-6 py-3.5 text-left text-xs sm:text-sm font-semibold text-tryout-text uppercase tracking-wider whitespace-nowrap">Actions</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-tryout-divider">
            <tr v-if="subCategories.length === 0">
              <td colspan="4" class="text-center p-8 text-tryout-muted">
                {{ search ? `No results found for "${search}"` : 'Belum ada data sub-kategori.' }}
              </td>
            </tr>

            <tr
              v-else
              v-for="sub in subCategories"
              :key="sub.id"
              class="hover:bg-tryout-hover/50 transition-colors"
            >
              <td class="px-4 sm:px-6 py-4 text-sm text-tryout-muted whitespace-nowrap">{{ sub.id }}</td>
              <td class="px-4 sm:px-6 py-4 text-sm text-tryout-text font-medium">{{ sub.title }}</td>
              <td class="px-4 sm:px-6 py-4 text-sm">
                <span class="bg-tryout-hover text-tryout-text px-2.5 py-1 rounded-md text-xs font-bold border border-tryout-border whitespace-nowrap inline-block">
                  {{ sub.categoryTitle }}
                </span>
              </td>
              <td class="px-4 sm:px-6 py-4 text-sm whitespace-nowrap">
                <div class="flex items-center gap-3">
                  <NuxtLink
                    :to="`/admin/sub-categories/${sub.id}/edit`"
                    class="text-tryout-primary hover:opacity-80 font-medium transition-opacity"
                  >
                    Edit
                  </NuxtLink>
                  <span class="text-tryout-border">|</span>
                  <button @click="openDeleteModal(sub)" class="text-red-500 dark:text-red-400 hover:opacity-80 font-medium cursor-pointer transition-opacity">
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
              <h3 class="text-xl font-extrabold text-tryout-text mb-2">Hapus SubCategory?</h3>
              <p class="text-tryout-muted text-sm mb-1">Apakah Anda yakin ingin menghapus sub-kategori ini?</p>
              <div class="mt-3 flex flex-col items-center gap-1">
                <p class="text-tryout-text font-bold bg-tryout-hover py-1.5 px-3 rounded-lg inline-block border border-tryout-border">
                  {{ subCategoryToDelete?.title }}
                </p>
                <p class="text-xs text-tryout-subtle font-medium mt-1">
                  Kategori Induk: {{ subCategoryToDelete?.categoryTitle }}
                </p>
              </div>
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