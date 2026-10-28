<script setup>
definePageMeta({
  layout: 'admin',
})

const { authToken } = useAuthUser()
const config = useRuntimeConfig()
const toast = useToast()

// State untuk UI Input (yang diketik user)
const searchInput = ref('')

// State yang dikirim ke Backend
const searchQuery = ref('')
const currentPage = ref(1) // 1-based untuk UI
const itemsPerPage = ref(20)
const itemsPerPageOptions = [10, 20, 40, 50, 100]
const sortBy = ref('id')
const sortDir = ref('asc')

// ✅ Header khusus untuk request ke backend ngrok
// Penting: ngrok-skip-browser-warning wajib ada saat backend masih pakai ngrok free.
const requestHeaders = computed(() => ({
  Authorization: authToken.value || '',
  Accept: 'application/json',
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true'
}))

// Fetch data user secara reaktif
const { data, pending, error, refresh } = await useFetch('/api/v1/auth/users', {
  baseURL: config.public.apiBaseUrl,
  method: 'GET',
  headers: requestHeaders,
  query: {
    page: computed(() => currentPage.value - 1), // Backend pakai 0-based
    size: itemsPerPage,
    sortBy: sortBy,
    sortDir: sortDir,
    search: computed(() => searchQuery.value.trim() || undefined)
  },
  server: false,
  watch: [
    currentPage,
    itemsPerPage,
    sortBy,
    sortDir,
    searchQuery,
    authToken
  ]
})

const users = computed(() => data.value?.data?.content || [])
const totalItems = computed(() => data.value?.data?.totalElements || 0)
const totalPages = computed(() => data.value?.data?.totalPages || 1)

// Reset halaman ke 1 hanya ketika jumlah item per halaman diubah
watch(itemsPerPage, () => {
  currentPage.value = 1
})

// Helper untuk tombol angka Pagination (maksimal 5 angka terlihat)
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

// Aksi Pindah Halaman
const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

// Aksi ketika tombol Enter ditekan
const handleSearch = () => {
  searchQuery.value = searchInput.value
  currentPage.value = 1
}

// Aksi ketika tombol X ditekan
const clearSearch = () => {
  searchInput.value = ''
  searchQuery.value = ''
  currentPage.value = 1
}

// FUNGSI DELETE USER
const handleDelete = async (id) => {
  if (!confirm('Apakah Anda yakin ingin menghapus user ini? Semua data terkait (riwayat ujian & transaksi) akan ikut terhapus.')) {
    return
  }

  try {
    await $fetch(`/api/v1/admin/users/${id}`, {
      baseURL: config.public.apiBaseUrl,
      method: 'DELETE',
      headers: requestHeaders.value
    })

    toast.add({
      title: 'Berhasil',
      description: 'User berhasil dihapus',
      color: 'success'
    })

    refresh()
  } catch (err) {
    console.error(err)

    const errorMsg = err.data?.message || 'Gagal menghapus user.'

    toast.add({
      title: 'Gagal',
      description: errorMsg,
      color: 'red'
    })
  }
}
</script>

<template>
  <main class="min-h-screen bg-tryout-bg p-4 sm:p-6 lg:p-8 relative transition-colors duration-300">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 mt-4 sm:mt-0">
      <h2 class="text-xl sm:text-2xl font-bold text-tryout-text">User Management</h2>
      <NuxtLink to="/admin/users/create"
        class="w-full sm:w-auto bg-tryout-primary hover:opacity-90 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-md transition-all text-center active:scale-95">
        + Create New User
      </NuxtLink>
    </div>

    <div class="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
      <div class="w-full md:max-w-md">
        <div class="relative">
          <input
            v-model="searchInput"
            @keyup.enter="handleSearch"
            type="text"
            placeholder="Ketik username / email lalu tekan Enter..."
            class="w-full rounded-lg py-2.5 pl-10 pr-10 text-sm focus:ring-2 focus:ring-tryout-primary outline-none transition-shadow border border-tryout-border bg-tryout-surface text-tryout-text"
          />
          <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-tryout-subtle">
            <i class="pi pi-search"></i>
          </span>
          <button 
            v-if="searchInput" 
            @click="clearSearch"
            class="absolute inset-y-0 right-0 flex items-center pr-3 text-tryout-subtle hover:text-tryout-muted transition-colors"
          >
            <i class="pi pi-times"></i>
          </button>
        </div>
        <p v-if="searchQuery" class="text-sm text-tryout-muted mt-2">
          Ditemukan {{ totalItems }} hasil untuk "{{ searchQuery }}"
        </p>
      </div>

      <div class="flex items-center gap-2 self-start md:self-auto">
        <label class="text-sm text-tryout-muted whitespace-nowrap font-medium">Tampilkan:</label>
        <select 
          v-model="itemsPerPage" 
          class="rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-tryout-primary outline-none cursor-pointer border border-tryout-border bg-tryout-surface text-tryout-text"
        >
          <option v-for="option in itemsPerPageOptions" :key="option" :value="option">
            {{ option }} baris
          </option>
        </select>
      </div>
    </div>

    <div class="mb-4 text-sm text-tryout-muted text-center sm:text-left">
      Menampilkan {{ totalItems === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1 }} - {{ Math.min(currentPage * itemsPerPage, totalItems) }} dari total {{ totalItems }} user
    </div>

    <div class="bg-tryout-surface shadow-sm border border-tryout-border rounded-xl overflow-hidden w-full transition-colors">
      <div class="overflow-x-auto custom-scrollbar w-full">
        <table class="w-full min-w-full border-collapse">
          <thead class="bg-tryout-hover border-b border-tryout-border">
            <tr>
              <th class="px-6 py-3.5 text-left text-xs font-bold text-tryout-text uppercase tracking-wider whitespace-nowrap">ID</th>
              <th class="px-6 py-3.5 text-left text-xs font-bold text-tryout-text uppercase tracking-wider min-w-[150px]">Username</th>
              <th class="px-6 py-3.5 text-left text-xs font-bold text-tryout-text uppercase tracking-wider min-w-[200px]">Email</th>
              <th class="px-6 py-3.5 text-left text-xs font-bold text-tryout-text uppercase tracking-wider whitespace-nowrap">Role</th>
              <th class="px-6 py-3.5 text-center text-xs font-bold text-tryout-text uppercase tracking-wider whitespace-nowrap">Aksi</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-tryout-divider">
            <tr v-if="pending">
              <td colspan="5" class="text-center p-8 text-tryout-primary">
                <div class="flex items-center justify-center gap-3">
                  <i class="pi pi-spin pi-spinner text-xl"></i>
                  <span class="font-medium">Memuat data...</span>
                </div>
              </td>
            </tr>

            <tr v-else-if="users.length === 0">
              <td colspan="5" class="text-center p-8 text-tryout-muted">
                {{ searchQuery ? `Pencarian "${searchQuery}" tidak ditemukan.` : 'Belum ada data user.' }}
              </td>
            </tr>

            <tr v-else v-for="user in users" :key="user.id" class="hover:bg-tryout-hover/50 transition-colors">
              <td class="px-6 py-4 text-sm text-tryout-muted font-mono">{{ user.id }}</td>
              <td class="px-6 py-4 text-sm text-tryout-text font-bold whitespace-nowrap">{{ user.username }}</td>
              <td class="px-6 py-4 text-sm text-tryout-text opacity-90 whitespace-nowrap">{{ user.email }}</td>
              <td class="px-6 py-4 text-sm whitespace-nowrap">
                <span :class="[
                  'px-2.5 py-1 text-xs rounded-md font-bold tracking-wide shadow-sm border',
                  user.role === 'ADMIN' 
                    ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' 
                    : 'bg-tryout-primary/10 text-tryout-primary border-tryout-primary/20'
                ]">
                  {{ user.role }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm whitespace-nowrap text-center">
                <div class="flex items-center justify-center gap-3">
                  <NuxtLink
                    :to="`/admin/users/${user.id}/edit`"
                    class="inline-flex items-center gap-1 text-tryout-primary hover:opacity-80 font-bold transition-opacity"
                  >
                    <i class="pi pi-pencil text-xs"></i> Edit
                  </NuxtLink>
                  
                  <span class="text-tryout-border">|</span>

                  <button @click="handleDelete(user.id)" class="inline-flex items-center gap-1 text-red-500 dark:text-red-400 hover:opacity-80 font-bold transition-opacity cursor-pointer">
                    <i class="pi pi-trash text-xs"></i> Hapus
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="totalPages > 1" class="mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
      <div class="text-sm text-tryout-muted font-medium order-2 md:order-1">
        Halaman {{ currentPage }} dari {{ totalPages }}
      </div>

      <div class="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 order-1 md:order-2">
        <button @click="goToPage(1)" :disabled="currentPage === 1" class="px-2 sm:px-3 py-1.5 sm:py-2 border border-tryout-border bg-tryout-surface text-tryout-text rounded-lg text-sm hover:bg-tryout-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><i class="pi pi-angle-double-left"></i></button>
        <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1" class="px-2 sm:px-3 py-1.5 sm:py-2 border border-tryout-border bg-tryout-surface text-tryout-text rounded-lg text-sm hover:bg-tryout-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><i class="pi pi-angle-left"></i></button>
        
        <button
          v-for="page in pageNumbers"
          :key="page"
          @click="goToPage(page)"
          :class="['px-3 sm:px-4 py-1.5 sm:py-2 border rounded-lg text-sm transition font-medium', page === currentPage ? 'bg-tryout-primary text-white border-tryout-primary shadow-sm' : 'bg-tryout-surface text-tryout-text border-tryout-border hover:bg-tryout-hover']"
        >
          {{ page }}
        </button>

        <button @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages" class="px-2 sm:px-3 py-1.5 sm:py-2 border border-tryout-border bg-tryout-surface text-tryout-text rounded-lg text-sm hover:bg-tryout-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><i class="pi pi-angle-right"></i></button>
        <button @click="goToPage(totalPages)" :disabled="currentPage === totalPages" class="px-2 sm:px-3 py-1.5 sm:py-2 border border-tryout-border bg-tryout-surface text-tryout-text rounded-lg text-sm hover:bg-tryout-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><i class="pi pi-angle-double-right"></i></button>
      </div>

      <div class="flex items-center gap-2 order-3">
        <label class="text-sm text-tryout-muted whitespace-nowrap font-medium">Lompat ke:</label>
        <input
          type="number"
          :value="currentPage"
          @change="goToPage(Number($event.target.value))"
          min="1"
          :max="totalPages"
          class="w-16 rounded-lg py-1.5 px-2 text-sm text-center focus:ring-2 focus:ring-tryout-primary outline-none border border-tryout-border bg-tryout-surface text-tryout-text"
        />
      </div>
    </div>
  </main>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
.custom-scrollbar::-webkit-scrollbar-track { background: var(--color-tryout-hover); border-radius: 8px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: var(--color-tryout-border); border-radius: 8px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--color-tryout-muted); }
</style>