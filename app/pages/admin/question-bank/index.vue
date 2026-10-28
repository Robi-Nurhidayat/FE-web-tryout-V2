<script setup>
import { ref, computed, watch } from 'vue'

definePageMeta({
  layout: 'admin'
})

const search = ref('')

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

// Pagination state
const currentPage = ref(1)
const itemsPerPage = ref(20)
const itemsPerPageOptions = [10, 20, 40, 50, 100]

// ✅ Fetch question banks dengan $api
const { data: response, refresh } = await useAsyncData('question-banks', () =>
  $api('/api/v1/question-banks')
)

// All question banks
const allQuestionBanks = computed(() => response.value?.data || [])

// Filter berdasarkan search
const filteredQuestionBanks = computed(() => {
  if (!search.value.trim()) {
    return allQuestionBanks.value
  }

  const searchLower = search.value.toLowerCase().trim()

  return allQuestionBanks.value.filter(item => {
    const title = item.title?.toLowerCase() || ''
    const position = item.position?.toLowerCase() || ''
    const subCategoryTitle = item.subCategoryTitle?.toLowerCase() || ''
    
    return title.includes(searchLower) || 
           position.includes(searchLower) || 
           subCategoryTitle.includes(searchLower)
  })
})

// Pagination calculations
const totalItems = computed(() => filteredQuestionBanks.value.length)
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value))

// Reset to page 1 when search changes
watch([search, itemsPerPage], () => {
  currentPage.value = 1
})

// Paginated data
const questionBanks = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredQuestionBanks.value.slice(start, end)
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

// ✅ Delete dengan Alert confirmation
const onDelete = async (questionBank) => {
  showAlert({
    title: '🗑️ Hapus Question Bank?',
    message: `Anda yakin ingin menghapus question bank:\n\n"${questionBank.title}"\n\nData yang sudah dihapus tidak dapat dikembalikan!`,
    type: 'warning',
    confirmText: 'Ya, Hapus',
    cancelText: 'Batal',
    showCancel: true,
    onConfirm: async () => {
      await performDelete(questionBank.id, questionBank.title)
    }
  })
}

// 🔥 PERBAIKAN: Sintaks Toast disesuaikan dengan standar PrimeVue
const performDelete = async (id, title) => {
  try {
    toast.add({ 
      severity: 'info', 
      summary: 'Proses', 
      detail: '🗑️ Menghapus question bank...', 
      life: 2000 
    })

    const deleteResponse = await $api(`/api/v1/question-banks/${id}`, {
      method: 'DELETE'
    })

    if (deleteResponse?.statusCode === 200) {
      toast.add({ 
        severity: 'success', 
        summary: 'Sukses', 
        detail: '✅ Question bank berhasil dihapus!', 
        life: 3000 
      })
      await refresh()
    } else {
      toast.add({ 
        severity: 'error', 
        summary: 'Gagal', 
        detail: '❌ Gagal menghapus question bank', 
        life: 3000 
      })
    }
  } catch (error) {
    console.error('Delete error:', error)
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: '❌ Terjadi kesalahan pada server', 
      life: 3000 
    })
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

// ✅ Format duration
const formatDuration = (minutes) => {
  if (!minutes) return '-'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (hours > 0 && mins > 0) {
    return `${hours}j ${mins}m`
  } else if (hours > 0) {
    return `${hours} jam`
  } else {
    return `${mins} menit`
  }
}
</script>

<template>
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

  <main class="min-h-screen bg-tryout-bg p-4 sm:p-6 lg:p-8 relative transition-colors duration-300">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <h2 class="text-xl sm:text-2xl font-bold text-tryout-text">Question Bank Management</h2>
      <NuxtLink 
        to="/admin/question-bank/create"
        class="bg-tryout-primary hover:opacity-90 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-md transition-all active:scale-95 w-full sm:w-auto text-center"
      >
        + Create New Question Bank
      </NuxtLink>
    </div>

    <div class="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
      <div class="w-full md:max-w-md">
        <div class="relative">
          <input
            v-model="search"
            type="text"
            placeholder="Search title, position, or sub category..."
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
              <th class="px-4 py-3.5 text-left text-xs font-semibold text-tryout-text uppercase tracking-wider whitespace-nowrap">ID</th>
              <th class="px-4 py-3.5 text-left text-xs font-semibold text-tryout-text uppercase tracking-wider min-w-[200px]">Title</th>
              <th class="px-4 py-3.5 text-left text-xs font-semibold text-tryout-text uppercase tracking-wider whitespace-nowrap">Position</th>
              <th class="px-4 py-3.5 text-left text-xs font-semibold text-tryout-text uppercase tracking-wider whitespace-nowrap">Sub Category</th>
              <th class="px-4 py-3.5 text-left text-xs font-semibold text-tryout-text uppercase tracking-wider whitespace-nowrap">Price</th>
              <th class="px-4 py-3.5 text-left text-xs font-semibold text-tryout-text uppercase tracking-wider whitespace-nowrap">Duration</th>
              <!-- <th class="px-4 py-3.5 text-center text-xs font-semibold text-tryout-text uppercase tracking-wider whitespace-nowrap">PG TWK</th>
              <th class="px-4 py-3.5 text-center text-xs font-semibold text-tryout-text uppercase tracking-wider whitespace-nowrap">PG TIU</th>
              <th class="px-4 py-3.5 text-center text-xs font-semibold text-tryout-text uppercase tracking-wider whitespace-nowrap">PG TKP</th>
              <th class="px-4 py-3.5 text-center text-xs font-semibold text-tryout-text uppercase tracking-wider whitespace-nowrap">PG Total</th>  -->
              <th class="px-4 py-3.5 text-left text-xs font-semibold text-tryout-text uppercase tracking-wider whitespace-nowrap">Actions</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-tryout-divider">
            <tr v-if="questionBanks.length === 0">
              <td colspan="11" class="text-center p-8 text-tryout-muted">
                {{ search ? `No results found for "${search}"` : 'Belum ada data question bank.' }}
              </td>
            </tr>

            <tr
              v-else
              v-for="questionBank in questionBanks"
              :key="questionBank.id"
              class="hover:bg-tryout-hover/50 transition-colors"
            >
              <td class="px-4 py-4 text-sm text-tryout-muted whitespace-nowrap">
                {{ questionBank.id }}
              </td>
              <td class="px-4 py-4 text-sm text-tryout-text font-medium min-w-[200px]">
                <div class="line-clamp-2">{{ questionBank.title }}</div>
              </td>
              <td class="px-4 py-4 text-sm whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-tryout-hover border border-tryout-border text-tryout-text">
                  {{ questionBank.position || '-' }}
                </span>
              </td>
              <td class="px-4 py-4 text-sm text-tryout-muted whitespace-nowrap">
                {{ questionBank.subCategoryTitle || '-' }}
              </td>
              <td class="px-4 py-4 text-sm text-tryout-text font-semibold whitespace-nowrap">
                {{ formatPrice(questionBank.price) }}
              </td>
              <td class="px-4 py-4 text-sm whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-tryout-primary/10 border border-tryout-primary/20 text-tryout-primary">
                  {{ formatDuration(questionBank.duration) }}
                </span>
              </td>
              
              <!-- <td class="px-4 py-4 text-sm text-center font-bold" :class="questionBank.passingGradeTwk ? 'text-emerald-500' : 'text-tryout-subtle'">
                {{ questionBank.passingGradeTwk || '-' }}
              </td>
              <td class="px-4 py-4 text-sm text-center font-bold" :class="questionBank.passingGradeTiu ? 'text-emerald-500' : 'text-tryout-subtle'">
                {{ questionBank.passingGradeTiu || '-' }}
              </td>
              <td class="px-4 py-4 text-sm text-center font-bold" :class="questionBank.passingGradeTkp ? 'text-emerald-500' : 'text-tryout-subtle'">
                {{ questionBank.passingGradeTkp || '-' }}
              </td>
              <td class="px-4 py-4 text-sm text-center font-bold" :class="questionBank.passingGradeTotal ? 'text-tryout-primary' : 'text-tryout-subtle'">
                {{ questionBank.passingGradeTotal || '-' }}
              </td> -->

              <td class="px-4 py-4 text-sm whitespace-nowrap">
                <div class="flex items-center gap-3">
                  <NuxtLink
                    :to="`/admin/question-bank/${questionBank.id}/detail`"
                    class="text-emerald-500 hover:opacity-80 font-medium transition-opacity"
                    title="View Details"
                  >
                    Detail
                  </NuxtLink>
                  
                  <span class="text-tryout-border">|</span>
                  
                  <NuxtLink
                    :to="`/admin/question-bank/${questionBank.id}/edit`"
                    class="text-tryout-primary hover:opacity-80 font-medium transition-opacity"
                    title="Edit Question Bank"
                  >
                    Edit
                  </NuxtLink>
                  
                  <span class="text-tryout-border">|</span>
                  
                  <button 
                    @click="onDelete(questionBank)"
                    class="text-red-500 dark:text-red-400 hover:opacity-80 font-medium transition-opacity"
                    title="Delete Question Bank"
                  >
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
      <div class="text-sm text-tryout-muted order-2 md:order-1">
        Page {{ currentPage }} of {{ totalPages }}
      </div>

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
        <input type="number" :value="currentPage" @change="goToPage(Number($event.target.value))" min="1" :max="totalPages" class="w-16 rounded-lg py-1 px-2 text-sm text-center focus:ring-2 focus:ring-tryout-primary outline-none border border-tryout-border bg-tryout-surface text-tryout-text" />
      </div>
    </div>

    <div v-if="allQuestionBanks.length > 0" class="mt-4 text-sm text-tryout-muted text-center md:text-left">
      Showing {{ filteredQuestionBanks.length }} of {{ allQuestionBanks.length }} question banks
    </div>
  </main>
</template>