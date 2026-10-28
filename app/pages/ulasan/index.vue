<script setup>
import { ref, computed, watch } from 'vue'

definePageMeta({ layout: 'default' })

const { $api } = useNuxtApp()
const toast = useToast() // ✅ Menggunakan Nuxt UI Toast

// 1. Fetch daftar paket
const { data: response, pending, error, refresh } = await useAsyncData(
  'my-packets',
  () => $api('/api/v1/transactions/my', { method: 'GET' }),
  { server: false, lazy: true }
)

const search = ref('')
const myPackets = computed(() => response.value?.data || [])

const filteredPackets = computed(() => {
  if (!search.value) return myPackets.value
  const q = search.value.toLowerCase()
  return myPackets.value.filter(item => item.title?.toLowerCase().includes(q))
})

// ==========================================
// LOGIKA PENGECEKAN STATUS ULASAN (BACKGROUND)
// ==========================================
const reviewedStatuses = ref({}) 

const checkReviewStatuses = async (packets) => {
  for (const p of packets) {
    if (reviewedStatuses.value[p.id] === undefined) {
      try {
        const res = await $api(`/api/v1/reviews/me/packet/${p.id}`, { method: 'GET' })
        reviewedStatuses.value[p.id] = !!res.data 
      } catch (err) {
        reviewedStatuses.value[p.id] = false
      }
    }
  }
}

watch(myPackets, (newPackets) => {
  if (newPackets && newPackets.length > 0) {
    checkReviewStatuses(newPackets)
  }
}, { immediate: true })

// ==========================================
// LOGIKA MODAL REVIEW (FETCH & EDIT)
// ==========================================
const isReviewModalOpen = ref(false)
const isFetchingReview = ref(false)
const isSubmittingReview = ref(false)
const isEditing = ref(false)

const reviewForm = ref({
  packetId: '',
  packetTitle: '',
  rating: 0,
  comment: ''
})

const openReviewModal = async (packet) => {
  reviewForm.value = {
    packetId: packet.id,
    packetTitle: packet.title,
    rating: 0,
    comment: ''
  }
  isReviewModalOpen.value = true
  isFetchingReview.value = true
  isEditing.value = false

  try {
    const res = await $api(`/api/v1/reviews/me/packet/${packet.id}`, { method: 'GET' })
    if (res.data) {
      reviewForm.value.rating = res.data.rating
      reviewForm.value.comment = res.data.comment || ''
      isEditing.value = true
    }
  } catch (err) {
    console.error("Belum ada ulasan sebelumnya.")
  } finally {
    isFetchingReview.value = false
  }
}

const closeReviewModal = () => {
  isReviewModalOpen.value = false
}

const setRating = (num) => {
  reviewForm.value.rating = num
}

const submitReview = async () => {
  // Validasi Rating
  if (reviewForm.value.rating === 0) {
    toast.add({
      title: 'Validasi Gagal',
      description: 'Silakan pilih skala penilaian (Rating 1 - 5) terlebih dahulu.',
      color: 'amber'
    })
    return
  }

  isSubmittingReview.value = true
  try {
    await $api('/api/v1/reviews', {
      method: 'POST',
      body: {
        packetId: reviewForm.value.packetId,
        rating: reviewForm.value.rating,
        comment: reviewForm.value.comment
      }
    })
    
    reviewedStatuses.value[reviewForm.value.packetId] = true
    
    toast.add({
      title: 'Berhasil!',
      description: 'Ulasan Anda berhasil disimpan.',
      color: 'green'
    })
    
    closeReviewModal()
  } catch (error) {
    toast.add({
      title: 'Error',
      description: error?.data?.message || 'Gagal menyimpan ulasan.',
      color: 'red'
    })

    console.error(error)
  } finally {
    isSubmittingReview.value = false
  }
}
</script>

<template>
  <div class="w-full min-h-screen pb-12 bg-tryout-bg text-tryout-text relative">

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

      <!-- ── Page Header ── -->
      <div class="mb-10 pt-8 border-l-4 border-tryout-accent pl-6">
        <h1 class="text-2xl md:text-3xl font-extrabold mb-2 text-tryout-text">
          Ruang Evaluasi & Ulasan
        </h1>
        <p class="text-sm text-tryout-muted max-w-2xl leading-relaxed">
          Tempat bagi Anda untuk memberikan rating, saran, dan evaluasi terkait paket tryout yang telah Anda kerjakan. Ulasan Anda bisa diedit kapan saja.
        </p>
      </div>

      <!-- ── Search Bar ── -->
      <div class="mb-8 max-w-md">
        <div class="relative">
          <input
            v-model="search"
            type="text"
            placeholder="Cari nama paket Anda..."
            class="w-full rounded-xl py-3 pl-11 pr-4 text-sm outline-none transition-all
                   bg-tryout-input border border-tryout-border text-tryout-text
                   placeholder:text-tryout-subtle focus:border-tryout-primary shadow-sm"
          />
          <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-tryout-subtle"
               fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <!-- ── Loading & Error States ── -->
      <div v-if="pending" class="text-center py-20 rounded-2xl bg-tryout-surface border border-tryout-border shadow-sm">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-tryout-primary mx-auto"></div>
      </div>

      <div v-else-if="error" class="text-center py-16 rounded-2xl bg-tryout-surface border border-tryout-border shadow-sm">
        <h3 class="text-lg font-bold text-tryout-text">Gagal memuat data</h3>
        <button @click="refresh" class="mt-4 px-6 py-2.5 rounded-xl font-medium transition-all bg-tryout-primary text-white hover:opacity-90">Coba Lagi</button>
      </div>

      <!-- ── Empty State ── -->
      <div v-else-if="filteredPackets.length === 0" class="text-center py-20 rounded-2xl bg-tryout-surface border border-tryout-border shadow-sm">
        <h3 class="text-xl font-bold text-tryout-text mb-2">{{ search ? 'Paket tidak ditemukan' : 'Belum ada paket' }}</h3>
        <p class="text-sm text-tryout-muted">{{ search ? 'Gunakan kata kunci lain.' : 'Anda belum memiliki paket untuk diulas.' }}</p>
      </div>

      <!-- ── Packet Grid ── -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="item in filteredPackets"
          :key="item.id"
          class="group relative rounded-2xl overflow-hidden flex flex-col transition-all duration-300
                 bg-tryout-surface border border-tryout-border hover:border-tryout-primary hover:-translate-y-1 hover:shadow-lg"
        >
          <div class="relative p-6 border-b bg-tryout-navbar border-tryout-divider">
            <div class="absolute top-0 left-0 right-0 h-[3px] bg-tryout-accent"></div>
            <h3 class="text-lg font-bold leading-snug text-tryout-navbar-text line-clamp-2 mt-4">{{ item.title }}</h3>
          </div>

          <div class="flex flex-col flex-1 p-5 gap-4">
            <!-- <p class="text-sm leading-relaxed line-clamp-2 flex-1 text-tryout-muted">{{ item.description || 'Paket latihan soal terpadu.' }}</p> -->
            <!-- <div class="h-px bg-tryout-divider"></div> -->
            
            <button
              @click="openReviewModal(item)"
              class="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all border"
              :class="reviewedStatuses[item.id] 
                ? 'bg-green-50/50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300 dark:bg-green-900/20 dark:border-green-900/50 dark:text-green-500' 
                : 'bg-tryout-bg border-tryout-border text-tryout-text hover:bg-tryout-hover hover:border-tryout-primary hover:text-tryout-primary'"
            >
              {{ reviewedStatuses[item.id] ? 'Lihat / Edit Ulasan' : '✍️ Tulis Ulasan' }}
            </button>

          </div>
        </div>
      </div>

    </div>

    <!-- ── MODAL ULASAN (POPUP) ── -->
    <div v-if="isReviewModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div class="bg-tryout-surface border border-tryout-border rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-slide-up relative">
        
        <div v-if="isFetchingReview" class="absolute inset-0 z-10 bg-tryout-surface/80 backdrop-blur-sm flex flex-col items-center justify-center">
           <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-tryout-primary mb-3"></div>
           <p class="text-sm font-semibold text-tryout-text">Menyiapkan data...</p>
        </div>

        <div class="px-8 py-6 border-b border-tryout-divider bg-tryout-bg flex justify-between items-start">
          <div>
            <h3 class="text-xl font-bold text-tryout-text mb-1">Evaluasi Pembelajaran</h3>
            <p class="text-sm text-tryout-muted line-clamp-1 pr-4">Paket: <span class="font-semibold">{{ reviewForm.packetTitle }}</span></p>
          </div>
          <button @click="closeReviewModal" class="p-2 text-tryout-subtle hover:text-tryout-text bg-tryout-surface hover:bg-tryout-hover rounded-full transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div class="px-8 py-8">
          <div class="mb-10">
            <label class="block text-center text-sm font-bold text-tryout-text mb-6 uppercase tracking-wider">
              Seberapa puas Anda? <span class="text-red-500">* (Wajib)</span>
            </label>
            
            <div class="flex justify-center items-center gap-4">
              <button 
                v-for="num in 5" :key="num"
                @click="setRating(num)"
                class="w-14 h-14 sm:w-16 sm:h-16 rounded-[1.25rem] font-black text-xl sm:text-2xl flex items-center justify-center transition-all duration-300 border-2 outline-none"
                :class="[
                  reviewForm.rating === num 
                  ? 'bg-tryout-primary border-tryout-primary text-white scale-110 shadow-lg' 
                  : 'bg-tryout-input border-tryout-border text-tryout-subtle hover:border-tryout-primary hover:text-tryout-primary hover:-translate-y-1 hover:bg-tryout-hover'
                ]"
              >
                {{ num }}
              </button>
            </div>
            <div class="flex justify-between max-w-[21rem] mx-auto mt-4 text-xs font-bold text-tryout-subtle uppercase tracking-widest">
                <span>Kurang</span>
                <span>Sangat Baik</span>
            </div>
          </div>

          <div class="mb-2">
            <label class="block text-sm font-bold text-tryout-text mb-3">
              Kritik, Saran, & Pengalaman Anda <span class="text-tryout-muted font-normal">(Opsional)</span>
            </label>
            <textarea
              v-model="reviewForm.comment"
              rows="5"
              placeholder="Bagaimana kualitas soalnya? Adakah fitur yang perlu kami tingkatkan untuk tryout selanjutnya?"
              class="w-full rounded-2xl py-4 px-5 text-base outline-none transition-all resize-none
                     bg-tryout-input border border-tryout-border text-tryout-text
                     placeholder:text-tryout-subtle focus:border-tryout-primary focus:ring-1 focus:ring-tryout-primary"
            ></textarea>
          </div>
        </div>

        <div class="px-8 py-5 border-t border-tryout-divider bg-tryout-bg flex gap-4">
          <button 
            @click="closeReviewModal"
            class="flex-1 py-3.5 px-4 rounded-xl font-bold text-sm bg-tryout-surface text-tryout-text border border-tryout-border hover:bg-tryout-hover transition-colors"
          >
            Batal
          </button>
          
          <button 
            @click="submitReview"
            :disabled="isSubmittingReview"
            class="flex-1 py-3.5 px-4 rounded-xl font-bold text-sm text-white transition-all bg-tryout-primary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            <svg v-if="isSubmittingReview" class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            {{ isSubmittingReview ? (isEditing ? 'Mengupdate...' : 'Menyimpan...') : (isEditing ? 'Update Ulasan' : 'Simpan Ulasan') }}
          </button>
        </div>

      </div>
    </div>

  </div>
</template>

<style scoped>
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(10px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
.animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
.animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
</style>