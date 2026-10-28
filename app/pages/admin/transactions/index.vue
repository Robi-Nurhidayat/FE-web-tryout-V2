<script setup>
definePageMeta({
  layout: 'admin',
})

const { $api } = useNuxtApp()

// State Data Transaksi
const search = ref('')
const statusFilter = ref('') // '' = All, 'PAID', 'PENDING', 'EXPIRED', 'FAILED'
const currentPage = ref(1)
const itemsPerPage = ref(10)

// ✅ State untuk Fitur Bypass
const showBypassModal = ref(false)
const isBypassing = ref(false)
const bypassForm = ref({
  userEmail: '',
  packetId: ''
})

// Fetch All Transactions
const { data: response, pending, refresh } = await useAsyncData('admin-transactions', () =>
  $api('/api/v1/transactions')
)

const transactions = computed(() => response.value?.data || [])

// Filter Logic
const filteredTransactions = computed(() => {
  let result = transactions.value

  // Filter by Status
  if (statusFilter.value) {
    result = result.filter(t => t.transactionStatus?.toUpperCase() === statusFilter.value)
  }

  // Filter by Search (Order ID)
  if (search.value.trim()) {
    const s = search.value.toLowerCase().trim()
    result = result.filter(t => t.orderId?.toLowerCase().includes(s))
  }

  // Sort by CreatedAt Descending (Terbaru di atas)
  return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
})

// Pagination Logic
const totalItems = computed(() => filteredTransactions.value.length)
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value))

const paginatedTransactions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredTransactions.value.slice(start, end)
})

watch([search, statusFilter], () => {
  currentPage.value = 1
})

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) currentPage.value = page
}

// Summary Stats
const totalRevenue = computed(() => {
  // Hanya hitung yang PAID
  const paidTrx = transactions.value.filter(t => t.transactionStatus?.toUpperCase() === 'PAID')
  return paidTrx.reduce((sum, t) => sum + (t.priceAtPurchase || 0), 0)
})

const totalPaidTransactions = computed(() => {
  return transactions.value.filter(t => t.transactionStatus?.toUpperCase() === 'PAID').length
})

// Helpers
const formatPrice = (price) => {
  if (!price) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(price)
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(date)
}

const getStatusBadge = (status) => {
  const s = (status || '').toUpperCase()
  if (s === 'PAID') return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
  if (s === 'PENDING') return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
  if (s === 'FAILED' || s === 'EXPIRED' || s === 'CANCEL') return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
  return 'bg-tryout-hover text-tryout-muted border-tryout-border'
}

// ✅ Fungsi Eksekusi Bypass Transaksi
const handleBypassTransaction = async () => {
  if (!bypassForm.value.userEmail || !bypassForm.value.packetId) {
    alert('Email User dan Packet ID wajib diisi!')
    return
  }

  isBypassing.value = true
  try {
    await $api('/api/v1/admin/transactions/bypass', {
      method: 'POST',
      body: bypassForm.value
    })
    
    // Reset form dan tutup modal
    bypassForm.value = { userEmail: '', packetId: '' }
    showBypassModal.value = false
    
    // Refresh tabel data transaksi
    refresh()
    alert('Bypass transaksi berhasil! User langsung mendapatkan akses paket.')
  } catch (err) {
    alert('Gagal bypass: ' + (err.response?.data?.message || err.message))
    console.error(err)
  } finally {
    isBypassing.value = false
  }
}
</script>

<template>
  <main class="min-h-screen bg-tryout-bg p-4 sm:p-6 lg:p-8 relative transition-colors duration-300">
    
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 mt-4 sm:mt-0">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-tryout-text">Kelola Transaksi</h1>
        <p class="text-sm text-tryout-muted mt-1">Pantau semua transaksi masuk dari user</p>
      </div>
      
      <!-- GABUNGAN TOMBOL BYPASS & REFRESH -->
      <div class="flex gap-3">
        <button @click="showBypassModal = true" class="px-4 py-2.5 sm:py-2 bg-tryout-primary text-white rounded-lg shadow-sm hover:bg-tryout-primary/90 flex items-center gap-2 text-sm font-semibold transition-colors active:scale-[0.98]">
          <i class="pi pi-bolt"></i> Bypass Transaksi
        </button>

        <button @click="refresh()" class="px-4 py-2.5 sm:py-2 bg-tryout-surface border border-tryout-border rounded-lg shadow-sm hover:bg-tryout-hover flex items-center gap-2 text-sm font-semibold transition-colors text-tryout-text active:scale-[0.98]">
          <i class="pi pi-refresh" :class="{'animate-spin': pending}"></i> Refresh Data
        </button>
      </div>
    </div>

    <!-- STATS CARDS -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
      <div class="bg-tryout-surface rounded-xl shadow-sm border border-tryout-border p-5 sm:p-6 flex items-center gap-4 transition-colors">
        <div class="w-12 h-12 rounded-full bg-tryout-primary/10 text-tryout-primary flex items-center justify-center text-xl">
          <i class="pi pi-wallet"></i>
        </div>
        <div>
          <p class="text-sm text-tryout-muted font-medium">Total Transaksi (All)</p>
          <p class="text-xl sm:text-2xl font-bold text-tryout-text">{{ transactions.length }}</p>
        </div>
      </div>
      
      <div class="bg-tryout-surface rounded-xl shadow-sm border border-tryout-border p-5 sm:p-6 flex items-center gap-4 transition-colors">
        <div class="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl">
          <i class="pi pi-check-circle"></i>
        </div>
        <div>
          <p class="text-sm text-tryout-muted font-medium">Transaksi Lunas (PAID)</p>
          <p class="text-xl sm:text-2xl font-bold text-tryout-text">{{ totalPaidTransactions }}</p>
        </div>
      </div>

      <div class="bg-tryout-surface rounded-xl shadow-sm border border-tryout-border p-5 sm:p-6 flex items-center gap-4 transition-colors">
        <div class="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl">
          <i class="pi pi-money-bill"></i>
        </div>
        <div>
          <p class="text-sm text-tryout-muted font-medium">Total Pendapatan Kotor</p>
          <p class="text-xl sm:text-2xl font-bold text-tryout-text">{{ formatPrice(totalRevenue) }}</p>
        </div>
      </div>
    </div>

    <!-- FILTER BAR -->
    <div class="bg-tryout-surface rounded-xl shadow-sm border border-tryout-border p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between transition-colors">
      <div class="flex-1 w-full relative">
        <input 
          v-model="search" 
          type="text" 
          placeholder="Cari berdasarkan Order ID (Contoh: TRX-1234)..."
          class="w-full pl-10 pr-4 py-2.5 sm:py-2 border border-tryout-border rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none bg-tryout-surface text-tryout-text transition-shadow text-sm sm:text-base"
        />
        <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-tryout-subtle"></i>
      </div>
      
      <div class="flex gap-4 w-full md:w-auto">
        <select v-model="statusFilter" class="w-full md:w-48 px-4 py-2.5 sm:py-2 border border-tryout-border rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none bg-tryout-surface text-tryout-text cursor-pointer text-sm sm:text-base">
          <option value="">Semua Status</option>
          <option value="PAID">Lunas (PAID)</option>
          <option value="PENDING">Tertunda (PENDING)</option>
          <option value="EXPIRED">Kedaluwarsa (EXPIRED)</option>
          <option value="FAILED">Gagal (FAILED)</option>
        </select>
      </div>
    </div>

    <!-- TABLE -->
    <div class="bg-tryout-surface shadow-sm border border-tryout-border rounded-xl overflow-hidden w-full transition-colors">
      <div class="overflow-x-auto custom-scrollbar w-full">
        <table class="w-full min-w-full divide-y divide-tryout-divider">
          <thead class="bg-tryout-hover">
            <tr>
              <th class="px-6 py-3.5 text-left text-xs font-bold text-tryout-text uppercase tracking-wider whitespace-nowrap">Tgl Transaksi</th>
              <th class="px-6 py-3.5 text-left text-xs font-bold text-tryout-text uppercase tracking-wider whitespace-nowrap">Order ID</th>
              <th class="px-6 py-3.5 text-left text-xs font-bold text-tryout-text uppercase tracking-wider min-w-[180px] whitespace-nowrap">User ID / Paket ID</th>
              <th class="px-6 py-3.5 text-left text-xs font-bold text-tryout-text uppercase tracking-wider whitespace-nowrap">Metode</th>
              <th class="px-6 py-3.5 text-right text-xs font-bold text-tryout-text uppercase tracking-wider whitespace-nowrap">Nominal</th>
              <th class="px-6 py-3.5 text-center text-xs font-bold text-tryout-text uppercase tracking-wider whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-tryout-divider bg-tryout-surface">
            <tr v-if="pending">
              <td colspan="6" class="px-6 py-12 text-center text-tryout-primary">
                <i class="pi pi-spinner animate-spin text-2xl mb-2"></i>
                <p class="text-sm font-medium text-tryout-muted">Memuat data transaksi...</p>
              </td>
            </tr>
            <tr v-else-if="filteredTransactions.length === 0">
              <td colspan="6" class="px-6 py-12 text-center text-tryout-muted">
                <i class="pi pi-inbox text-3xl mb-2 text-tryout-subtle"></i>
                <p class="text-sm font-medium">Tidak ada transaksi ditemukan.</p>
              </td>
            </tr>
            <tr v-else v-for="trx in paginatedTransactions" :key="trx.id" class="hover:bg-tryout-hover/50 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-tryout-muted">
                {{ formatDate(trx.createdAt) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="font-mono text-sm font-bold text-tryout-text">{{ trx.orderId }}</span>
              </td>
              <td class="px-6 py-4 text-sm text-tryout-text">
                <div>User ID: <span class="font-bold text-tryout-primary">#{{ trx.userId }}</span></div>
                <div class="text-xs text-tryout-subtle mt-0.5">Paket ID: {{ trx.packetId }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-tryout-muted">
                <span v-if="trx.paymentMethod" class="px-2 py-0.5 bg-tryout-hover border border-tryout-border rounded text-xs font-bold text-tryout-text">{{ trx.paymentMethod }}</span>
                <span v-else class="text-tryout-subtle italic text-xs font-medium">Midtrans</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-tryout-text text-right">
                {{ formatPrice(trx.priceAtPurchase) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-center">
                <span :class="getStatusBadge(trx.transactionStatus)" class="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border">
                  {{ trx.transactionStatus || 'UNKNOWN' }}
                </span>
                <div v-if="trx.transactionStatus === 'PAID' && trx.paidAt" class="text-[10px] text-tryout-subtle mt-1">
                  Paid: {{ formatDate(trx.paidAt) }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PAGINATION -->
      <div v-if="totalPages > 1" class="bg-tryout-hover/30 px-6 py-3.5 border-t border-tryout-divider flex items-center justify-between transition-colors">
        <span class="text-sm text-tryout-muted">
          Menampilkan {{ (currentPage - 1) * itemsPerPage + 1 }} - {{ Math.min(currentPage * itemsPerPage, totalItems) }} dari {{ totalItems }}
        </span>
        <div class="flex gap-1">
          <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1" class="px-3 py-1.5 border border-tryout-border rounded bg-tryout-surface text-tryout-text hover:bg-tryout-hover disabled:opacity-40 transition-colors disabled:cursor-not-allowed"><i class="pi pi-angle-left"></i></button>
          <span class="px-3 py-1.5 text-sm font-bold text-tryout-text">Hal {{ currentPage }} / {{ totalPages }}</span>
          <button @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages" class="px-3 py-1.5 border border-tryout-border rounded bg-tryout-surface text-tryout-text hover:bg-tryout-hover disabled:opacity-40 transition-colors disabled:cursor-not-allowed"><i class="pi pi-angle-right"></i></button>
        </div>
      </div>
    </div>

    <!-- ✅ MODAL BYPASS TRANSAKSI -->
    <div v-if="showBypassModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div class="bg-tryout-surface w-full max-w-md rounded-2xl shadow-xl border border-tryout-border overflow-hidden transform transition-all">
        
        <div class="px-6 py-4 border-b border-tryout-divider flex justify-between items-center bg-tryout-hover">
          <h3 class="text-lg font-bold text-tryout-text flex items-center gap-2">
            <i class="pi pi-bolt text-amber-500"></i> Bypass Transaksi
          </h3>
          <button @click="showBypassModal = false" class="text-tryout-muted hover:text-red-500 transition-colors">
            <i class="pi pi-times text-xl"></i>
          </button>
        </div>

        <div class="p-6 space-y-4">
          <div class="bg-amber-500/10 text-amber-600 p-3 rounded-lg text-xs font-medium border border-amber-500/20 mb-4">
            Fitur ini digunakan untuk testing internal. Transaksi akan langsung berstatus <b>PAID</b> tanpa memanggil payment gateway.
          </div>

          <div>
            <label class="block text-sm font-bold text-tryout-text mb-1">Email User</label>
            <input v-model="bypassForm.userEmail" type="email" placeholder="contoh: user@gmail.com" 
                   class="w-full px-4 py-2 border border-tryout-border rounded-lg focus:ring-2 focus:ring-tryout-primary bg-tryout-bg text-tryout-text outline-none">
          </div>

          <div>
            <label class="block text-sm font-bold text-tryout-text mb-1">Packet Hash ID</label>
            <input v-model="bypassForm.packetId" type="text" placeholder="contoh: aB3xYz" 
                   class="w-full px-4 py-2 border border-tryout-border rounded-lg focus:ring-2 focus:ring-tryout-primary bg-tryout-bg text-tryout-text outline-none">
            <p class="text-[10px] text-tryout-muted mt-1">Masukkan Hash ID paket (bisa dilihat dari URL halaman paket).</p>
          </div>
        </div>

        <div class="px-6 py-4 border-t border-tryout-divider flex justify-end gap-3 bg-tryout-hover/50">
          <button @click="showBypassModal = false" class="px-4 py-2 rounded-lg text-sm font-bold text-tryout-muted hover:bg-tryout-border transition-colors">
            Batal
          </button>
          <button @click="handleBypassTransaction" :disabled="isBypassing" class="px-4 py-2 rounded-lg text-sm font-bold text-white bg-tryout-primary hover:bg-tryout-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50">
            <i v-if="isBypassing" class="pi pi-spinner animate-spin"></i>
            {{ isBypassing ? 'Memproses...' : 'Proses Bypass' }}
          </button>
        </div>

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