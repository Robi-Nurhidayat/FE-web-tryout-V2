<script setup>
import { computed, ref, watch } from 'vue'

definePageMeta({
  layout: 'admin'
})

const search = ref('')

// ✅ Get $api and toast dari Nuxt UI
const { $api } = useNuxtApp()
const toast = useToast()

// ✅ Fetch packets dengan $api
const { data: response, refresh } = await useAsyncData('packets', () =>
  $api('/api/v1/packets')
)

// Buat packets reactive
const packets = computed(() => response.value?.data || [])

// Filter packets berdasarkan search
const filteredPackets = computed(() => {
  if (!search.value) return packets.value
  
  const searchLower = search.value.toLowerCase()
  return packets.value.filter(packet => 
    packet.title?.toLowerCase().includes(searchLower) ||
    packet.category?.toLowerCase().includes(searchLower) ||
    packet.position?.toLowerCase().includes(searchLower)
  )
})

// ==========================================
// ✅ MODAL DELETE STATE LOGIC
// ==========================================
const isDeleteModalOpen = ref(false)
const packetToDelete = ref(null)
const isDeleting = ref(false)

const openDeleteModal = (packet) => {
  packetToDelete.value = packet
  isDeleteModalOpen.value = true
}

const closeDeleteModal = () => {
  isDeleteModalOpen.value = false
  setTimeout(() => {
    packetToDelete.value = null
  }, 300)
}

// ✅ FUNGSI EKSEKUSI DELETE DENGAN NUXT UI TOAST
const executeDelete = async () => {
  if (!packetToDelete.value) return

  let loadingToast = null;

  try {
    isDeleting.value = true
    
    // Munculkan toast loading menggunakan toast.add()
    loadingToast = toast.add({
      title: 'Menghapus packet...',
      description: 'Mohon tunggu sebentar.',
      icon: 'i-heroicons-arrow-path',
      color: 'blue',
      timeout: 0 // timeout 0 agar toast tidak hilang otomatis sampai dihapus manual
    })

    await $api(`/api/v1/packets/${packetToDelete.value.id}`, {
      method: 'DELETE'
    })

    // Hapus toast loading
    if (loadingToast) {
      toast.remove(loadingToast.id)
    }

    // Munculkan toast success menggunakan toast.add()
    toast.add({
      title: 'Berhasil',
      description: `Packet "${packetToDelete.value.title}" berhasil dihapus!`,
      icon: 'i-heroicons-check-circle',
      color: 'green'
    })
    
    await refresh()
    closeDeleteModal()

  } catch (error) {
    console.error('Delete error:', error)
    
    // Pastikan loading toast dihapus jika terjadi error
    if (loadingToast) {
      toast.remove(loadingToast.id)
    }

    // Munculkan toast error menggunakan toast.add()
    toast.add({
      title: 'Gagal Menghapus',
      description: error?.data?.message || 'Terjadi kesalahan saat menghapus packet.',
      icon: 'i-heroicons-x-circle',
      color: 'red'
    })
  } finally {
    isDeleting.value = false
  }
}

// Format harga ke Rupiah
const formatPrice = (price) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(price)
}
</script>

<template>
  <main class="min-h-screen bg-tryout-bg p-8 transition-colors duration-300 relative">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-tryout-text">Packet Management</h2>
      <NuxtLink 
        to="/admin/packets/create"
        class="bg-tryout-primary hover:opacity-90 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-md transition-all active:scale-95"
      >
        + Create New Packet
      </NuxtLink>
    </div>

    <div class="mb-6 max-w-sm">
      <div class="relative">
        <input
          v-model="search"
          type="text"
          placeholder="Search title, category, or position..."
          class="w-full border border-tryout-border bg-tryout-surface text-tryout-text rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-tryout-primary outline-none transition-shadow"
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
        Found {{ filteredPackets.length }} result(s) for "{{ search }}"
      </p>
    </div>

    <div class="overflow-x-auto bg-tryout-surface shadow-sm border border-tryout-border rounded-lg transition-colors">
      <table class="min-w-full border-collapse border border-tryout-border">
        <thead class="bg-tryout-hover">
          <tr>
            <th class="border border-tryout-border px-6 py-3 text-left text-sm font-semibold text-tryout-text uppercase tracking-wider">
              ID
            </th>
            <th class="border border-tryout-border px-6 py-3 text-left text-sm font-semibold text-tryout-text uppercase tracking-wider">
              Title
            </th>
            <th class="border border-tryout-border px-6 py-3 text-left text-sm font-semibold text-tryout-text uppercase tracking-wider">
              Category
            </th>
            <th class="border border-tryout-border px-6 py-3 text-left text-sm font-semibold text-tryout-text uppercase tracking-wider">
              Sub Category
            </th>
            <th class="border border-tryout-border px-6 py-3 text-left text-sm font-semibold text-tryout-text uppercase tracking-wider">
              Position
            </th>
            <th class="border border-tryout-border px-6 py-3 text-left text-sm font-semibold text-tryout-text uppercase tracking-wider">
              Price
            </th>
            <th class="border border-tryout-border px-6 py-3 text-left text-sm font-semibold text-tryout-text uppercase tracking-wider">
              URL Group
            </th>
            <th class="border border-tryout-border px-6 py-3 text-left text-sm font-semibold text-tryout-text uppercase tracking-wider">
              Description
            </th>
            <th class="border border-tryout-border px-6 py-3 text-left text-sm font-semibold text-tryout-text uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="filteredPackets.length === 0">
            <td colspan="9" class="text-center p-5 text-tryout-muted border border-tryout-border">
              {{ search ? `No results found for "${search}"` : 'Belum ada data packet.' }}
            </td>
          </tr>

          <tr
            v-else
            v-for="packet in filteredPackets"
            :key="packet.id"
            class="hover:bg-tryout-hover/50 transition-colors"
          >
            <td class="px-6 py-4 text-sm border border-tryout-border text-tryout-muted">
              {{ packet.id }}
            </td>
            <td class="px-6 py-4 text-sm border border-tryout-border text-tryout-text font-medium max-w-xs">
              <div class="line-clamp-2">{{ packet.title }}</div>
            </td>
            <td class="px-6 py-4 text-sm border border-tryout-border text-tryout-text">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-tryout-primary/10 border border-tryout-primary/20 text-tryout-primary">
                {{ packet.category }}
              </span>
            </td>
            <td class="px-6 py-4 text-sm border border-tryout-border text-tryout-text">
              {{ packet.subCategory || '-' }}
            </td>
            <td class="px-6 py-4 text-sm border border-tryout-border text-tryout-text">
              {{ packet.position || '-' }}
            </td>
            <td class="px-6 py-4 text-sm border border-tryout-border text-tryout-text font-bold">
              {{ formatPrice(packet.price) }}
            </td>
            
            <td class="px-6 py-4 text-sm border border-tryout-border max-w-xs truncate">
              <a 
                v-if="packet.urlGroup" 
                :href="packet.urlGroup" 
                target="_blank" 
                class="text-tryout-primary hover:opacity-80 hover:underline transition-opacity"
                title="Buka Link Grup"
              >
                {{ packet.urlGroup }}
              </a>
              <span v-else class="text-tryout-subtle">-</span>
            </td>

            <td class="px-6 py-4 text-sm border border-tryout-border text-tryout-text max-w-md opacity-90">
              <div class="line-clamp-2">{{ packet.description || '-' }}</div>
            </td>
            <td class="px-6 py-4 text-sm border border-tryout-border">
              <div class="flex items-center gap-3">
                <NuxtLink
                  :to="`/admin/packets/${packet.id}/detail`"
                  class="text-emerald-500 hover:opacity-80 font-bold transition-opacity"
                  title="View Details"
                >
                  Detail
                </NuxtLink>
                
                <span class="text-tryout-border">|</span>
                
                <NuxtLink
                  :to="`/admin/packets/${packet.id}/edit`"
                  class="text-tryout-primary hover:opacity-80 font-bold transition-opacity"
                  title="Edit Packet"
                >
                  Edit
                </NuxtLink>
                
                <span class="text-tryout-border">|</span>
                
                <button 
                  @click="openDeleteModal(packet)"
                  class="text-red-500 dark:text-red-400 hover:opacity-80 font-bold transition-opacity cursor-pointer"
                  title="Delete Packet"
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="packets.length > 0" class="mt-4 text-sm text-tryout-muted">
      Showing {{ filteredPackets.length }} of {{ packets.length }} packets
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
              <h3 class="text-xl font-extrabold text-tryout-text mb-2">Hapus Packet?</h3>
              <p class="text-tryout-muted text-sm mb-1">Apakah Anda yakin ingin menghapus packet ini?</p>
              <p class="text-tryout-text font-bold bg-tryout-hover py-2 px-4 rounded-lg inline-block mt-2 border border-tryout-border">
                {{ packetToDelete?.title }}
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

.fade-enter-active > div:nth-child(2),
.fade-leave-active > div:nth-child(2) {
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.fade-enter-from > div:nth-child(2),
.fade-leave-to > div:nth-child(2) {
  transform: scale(0.95) translateY(10px);
}
</style>