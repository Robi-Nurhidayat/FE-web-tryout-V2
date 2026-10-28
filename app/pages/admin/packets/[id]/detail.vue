<script setup>
definePageMeta({
  layout: 'admin'
})

const route = useRoute()
const packetId = route.params.id
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

// ✅ Fetch packet items dengan $api
const { data: response, refresh } = await useAsyncData(`packet-items-${packetId}`, () =>
  $api(`/api/v1/packet-items/by-packet-id/${packetId}`)
)

// ✅ TRICK ANTI STALE-DATA: Paksa refresh data setiap kali halaman ini dibuka
// Ini akan mem-bypass cache memori Nuxt saat kamu redirect dari halaman Add
onMounted(() => {
  refresh()
})

// Buat packet items reactive
const packetItems = computed(() => response.value?.data || [])

// ✅ Filter berdasarkan search
const filteredItems = computed(() => {
  if (!search.value) return packetItems.value
  
  const searchLower = search.value.toLowerCase()
  return packetItems.value.filter(item => 
    item.title?.toLowerCase().includes(searchLower) ||
    item.position?.toLowerCase().includes(searchLower) ||
    item.subCategoryTitle?.toLowerCase().includes(searchLower)
  )
})

// ✅ FUNGSI DELETE (Ditaruh di atas onDelete agar tidak error Reference)
const performDelete = async (id, title) => {
  try {
    const loadingToastId = toast.add({
      title: 'Menghapus...',
      description: 'Sedang menghapus question bank...',
      icon: 'i-heroicons-arrow-path',
      color: 'blue',
      timeout: 0 
    })

    const deleteResponse = await $api(`/api/v1/packet-items/${id}`, {
      method: 'DELETE'
    })

    toast.remove(loadingToastId.id)

    if (deleteResponse?.statusCode === 200) {
      toast.add({
        title: 'Berhasil',
        description: 'Question bank berhasil dihapus dari paket!',
        color: 'green',
        icon: 'i-heroicons-check-circle'
      })

      // Refresh data tabel setelah hapus
      await refresh()
    } else {
      toast.add({
        title: 'Gagal',
        description: 'Gagal menghapus question bank',
        color: 'red',
        icon: 'i-heroicons-x-circle'
      })
    }
  } catch (error) {
    console.error('Delete error:', error)
    toast.add({
      title: 'Error',
      description: error?.data?.message || 'Terjadi kesalahan sistem',
      color: 'red',
      icon: 'i-heroicons-x-circle'
    })
  }
}

// ✅ Trigger Modal Delete
const onDelete = (item) => {
  showAlert({
    title: '🗑️ Hapus Question Bank?',
    message: `Anda yakin ingin menghapus question bank:\n\n"${item.title}"\n\nData yang sudah dihapus tidak dapat dikembalikan!`,
    type: 'warning',
    confirmText: 'Ya, Hapus',
    cancelText: 'Batal',
    showCancel: true,
    onConfirm: async () => {
      await performDelete(item.id, item.title)
    }
  })
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

  <main class="min-h-screen bg-tryout-bg p-4 sm:p-6 lg:p-8 transition-colors duration-300">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <div>
        <h2 class="text-xl sm:text-2xl font-bold text-tryout-text">Paket Detail</h2>
        <p class="text-sm text-tryout-muted mt-1">Daftar question bank dalam paket ini</p>
      </div>
      <div class="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
        <NuxtLink 
          :to="`/admin/packets`"
          class="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-tryout-surface hover:bg-tryout-hover border border-tryout-border text-tryout-text rounded-lg text-sm font-semibold transition-colors text-center active:scale-[0.98]"
        >
          ← Kembali
        </NuxtLink>
        <NuxtLink 
          :to="`/admin/packets/${packetId}/add/`"
          class="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-tryout-primary hover:opacity-90 text-white rounded-lg text-sm font-semibold shadow-md transition-opacity text-center active:scale-[0.98]"
        >
          + Tambah Question Bank
        </NuxtLink>
      </div>
    </div>

    <div class="mb-6 w-full md:max-w-md">
      <div class="relative">
        <input
          v-model="search"
          type="text"
          placeholder="Cari title, posisi, atau sub kategori..."
          class="w-full rounded-lg py-2.5 pl-10 pr-10 text-sm focus:ring-2 focus:ring-tryout-primary outline-none transition-shadow border border-tryout-border bg-tryout-surface text-tryout-text"
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
        Found {{ filteredItems.length }} result(s) for "{{ search }}"
      </p>
    </div>

    <div class="bg-tryout-surface shadow-sm border border-tryout-border rounded-xl overflow-hidden w-full transition-colors">
      <div class="overflow-x-auto custom-scrollbar w-full">
        <table class="min-w-full border-collapse">
          <thead class="bg-tryout-hover border-b border-tryout-border">
            <tr>
              <th class="px-6 py-4 text-left text-xs font-bold text-tryout-text uppercase tracking-wider whitespace-nowrap">ID</th>
              <th class="px-6 py-4 text-left text-xs font-bold text-tryout-text uppercase tracking-wider whitespace-nowrap">Question Bank ID</th>
              <th class="px-6 py-4 text-left text-xs font-bold text-tryout-text uppercase tracking-wider min-w-[250px]">Title</th>
              <th class="px-6 py-4 text-left text-xs font-bold text-tryout-text uppercase tracking-wider whitespace-nowrap">Posisi</th>
              <th class="px-6 py-4 text-left text-xs font-bold text-tryout-text uppercase tracking-wider whitespace-nowrap">Sub Kategori</th>
              <th class="px-6 py-4 text-left text-xs font-bold text-tryout-text uppercase tracking-wider whitespace-nowrap">Harga</th>
              <th class="px-6 py-4 text-left text-xs font-bold text-tryout-text uppercase tracking-wider whitespace-nowrap">Actions</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-tryout-divider">
            <tr v-if="filteredItems.length === 0">
              <td colspan="7" class="text-center p-8 text-tryout-muted">
                {{ search ? `No results found for "${search}"` : 'Belum ada question bank dalam paket ini' }}
              </td>
            </tr>

            <tr
              v-else
              v-for="item in filteredItems"
              :key="item.id"
              class="hover:bg-tryout-hover/50 transition-colors"
            >
              <td class="px-6 py-4 text-sm text-tryout-muted">{{ item.id }}</td>
              <td class="px-6 py-4 text-sm text-tryout-muted font-mono">
                #{{ item.questionBankId }}
              </td>
              <td class="px-6 py-4 text-sm text-tryout-text font-medium whitespace-normal max-w-xs">
                <div class="line-clamp-2">{{ item.title }}</div>
              </td>
              <td class="px-6 py-4 text-sm">
                <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-tryout-hover border border-tryout-border text-tryout-text whitespace-nowrap">
                  {{ item.position || '-' }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-tryout-text whitespace-nowrap">
                {{ item.subCategoryTitle || '-' }}
              </td>
              <td class="px-6 py-4 text-sm text-tryout-text font-bold whitespace-nowrap">
                {{ formatPrice(item.price) }}
              </td>
              <td class="px-6 py-4 text-sm whitespace-nowrap">
                <div class="flex items-center gap-3">
                  <NuxtLink
                    :to="`/admin/question-bank/${item.questionBankId}/detail`"
                    class="text-emerald-500 hover:opacity-80 font-bold transition-opacity"
                    title="View Question Bank"
                  >
                    Detail
                  </NuxtLink>
                  
                  <span class="text-tryout-border">|</span>
                  
                  <button 
                    @click="onDelete(item)"
                    class="text-red-500 dark:text-red-400 hover:opacity-80 font-bold cursor-pointer transition-opacity"
                    title="Remove from Packet"
                  >
                    Hapus
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="packetItems.length > 0" class="mt-4 flex flex-col sm:flex-row justify-between items-center gap-2">
      <p class="text-sm text-tryout-muted">
        Showing {{ filteredItems.length }} of {{ packetItems.length }} question banks
      </p>
      <p class="text-sm text-tryout-muted">
        Total items: <span class="font-semibold text-tryout-text">{{ packetItems.length }}</span>
      </p>
    </div>
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
</style>