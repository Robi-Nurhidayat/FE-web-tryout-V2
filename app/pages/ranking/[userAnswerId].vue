<script setup>
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNuxtApp, useAsyncData } from '#imports'

definePageMeta({
  layout: 'default'
})

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()

const userAnswerId = route.params.userAnswerId

// ===============================
// 1. STATE (disimpan juga di URL: ?page=2&size=50&q=budi)
// ===============================
const PAGE_SIZE_OPTIONS = [25, 50, 100]
const DEFAULT_PAGE_SIZE = 50

const readPositiveNumber = (value, fallback) => {
  const raw = Array.isArray(value) ? value[0] : value
  const number = Number(raw)
  return Number.isInteger(number) && number > 0 ? number : fallback
}

const initialSize = readPositiveNumber(route.query.size, DEFAULT_PAGE_SIZE)

// page di frontend 1-based, backend 0-based
const page = ref(readPositiveNumber(route.query.page, 1))
const size = ref(PAGE_SIZE_OPTIONS.includes(initialSize) ? initialSize : DEFAULT_PAGE_SIZE)
const search = ref(typeof route.query.q === 'string' ? route.query.q.trim() : '')
const searchInput = ref(search.value)

// Debounce pencarian supaya tidak request di setiap ketikan
let searchTimer = null

watch(searchInput, (value) => {
  clearTimeout(searchTimer)

  if (value.trim() === search.value) return

  searchTimer = setTimeout(() => {
    search.value = value.trim()
    page.value = 1
  }, 400)
})

onBeforeUnmount(() => clearTimeout(searchTimer))

const clearSearch = () => {
  clearTimeout(searchTimer)
  search.value = ''
  searchInput.value = ''
  page.value = 1
}

const changeSize = (event) => {
  size.value = Number(event.target.value)
  page.value = 1
}

// Sinkronkan state ke URL (refresh / share link tetap di halaman yang sama)
watch([page, size, search], () => {
  router.replace({
    query: {
      ...route.query,
      page: page.value > 1 ? String(page.value) : undefined,
      size: size.value !== DEFAULT_PAGE_SIZE ? String(size.value) : undefined,
      q: search.value || undefined
    }
  })
})

// ===============================
// 2. FETCH RANKING
// ===============================
const { data: rankingResponse, pending, error, refresh } = await useAsyncData(
  `ranking-all-${userAnswerId}`,
  () => $api(`/api/v1/user-answers/${userAnswerId}/leaderboard/all`, {
    method: 'GET',
    query: {
      page: page.value - 1,
      size: size.value,
      search: search.value || undefined
    }
  }),
  {
    server: false,
    watch: [page, size, search]
  }
)

const ranking = computed(() => rankingResponse.value?.data || null)
const items = computed(() => ranking.value?.items || [])
const totalPages = computed(() => ranking.value?.totalPages || 0)
const totalElements = computed(() => ranking.value?.totalElements || 0)
const totalParticipants = computed(() => ranking.value?.totalParticipants || 0)
const userRank = computed(() => ranking.value?.userRank || null)
const userPage = computed(() => ranking.value?.userPage ?? null) // 0-based dari backend

const isCombined = computed(() => ranking.value?.isCombined || false)
const showSkdColumns = computed(() => ranking.value?.hasSkdScore || false)
const showPppkColumns = computed(() => ranking.value?.hasPppkScore || false)

const isFirstLoad = computed(() => pending.value && !ranking.value)

const errorMessage = computed(() => {
  if (!error.value) return ''
  return error.value?.data?.message || 'Gagal memuat ranking. Silakan coba lagi.'
})

// Kalau backend mengoreksi halaman (misal page di URL kebesaran), ikuti
watch(ranking, (value) => {
  if (!value || value.totalPages === 0) return
  const backendPage = value.page + 1
  if (backendPage !== page.value) page.value = backendPage
})

// ===============================
// 3. POSISI SAYA
// ===============================
const percentile = computed(() => {
  if (!userRank.value || totalParticipants.value <= 1) return null
  const below = totalParticipants.value - userRank.value.rank
  return Math.round((below / (totalParticipants.value - 1)) * 100)
})

const isMyRowVisible = computed(() => items.value.some(item => item.isCurrentUser))

const scrollToMyRow = () => {
  nextTick(() => {
    const row = document.getElementById('my-rank-row')
    if (row) row.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
}

const pendingScrollToMe = ref(false)

const jumpToMyPosition = () => {
  if (userPage.value === null) return

  const targetPage = userPage.value + 1

  // Sudah di halaman yang benar & tanpa filter → langsung scroll
  if (!search.value && targetPage === page.value) {
    scrollToMyRow()
    return
  }

  pendingScrollToMe.value = true
  clearTimeout(searchTimer)
  search.value = ''
  searchInput.value = ''
  page.value = targetPage
}

watch(items, () => {
  if (pendingScrollToMe.value && isMyRowVisible.value) {
    pendingScrollToMe.value = false
    scrollToMyRow()
  }
})

// ===============================
// 4. PAGINATION
// ===============================
const pageNumbers = computed(() => {
  const total = totalPages.value
  const current = page.value

  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  if (start > 2) pages.push('…')
  for (let p = start; p <= end; p++) pages.push(p)
  if (end < total - 1) pages.push('…')

  pages.push(total)
  return pages
})

const rangeStart = computed(() => totalElements.value === 0 ? 0 : (page.value - 1) * size.value + 1)
const rangeEnd = computed(() => Math.min(page.value * size.value, totalElements.value))

const listTop = ref(null)

const goToPage = (target) => {
  if (typeof target !== 'number') return
  if (target < 1 || target > totalPages.value || target === page.value) return

  page.value = target
  listTop.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// ===============================
// 5. HELPER TAMPILAN
// ===============================
const formatNumber = (value) => Number(value || 0).toLocaleString('id-ID')

const formatDuration = (seconds) => {
  const total = Math.max(0, Number(seconds) || 0)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

const getRankColor = (rank) => {
  if (rank === 1) return 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white'
  if (rank === 2) return 'bg-gradient-to-br from-gray-300 to-gray-500 text-white'
  if (rank === 3) return 'bg-gradient-to-br from-orange-400 to-orange-600 text-white'
  return 'bg-tryout-hover text-tryout-primary border border-tryout-border'
}

const getRankBadge = (rank) => {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return ''
}

const bankTitle = computed(() => {
  const title = ranking.value?.questionBankTitle || ''
  return title.replace(/\b\w/g, char => char.toUpperCase())
})

// ✅ Tombol kembali selalu ke halaman hasil ujian
const nextUserAnswerId = computed(() => {
  const value = route.query.nextId
  if (Array.isArray(value)) return value[0] || null
  return value || null
})

const resultPageUrl = computed(() => ({
  path: `/pembahasan/${userAnswerId}`,
  query: nextUserAnswerId.value ? { nextId: nextUserAnswerId.value } : {}
}))

const goBack = () => {
  const previousPath = window.history.state?.back

  // Datang dari halaman hasil ujian → cukup mundur (posisi scroll tetap)
  if (typeof previousPath === 'string' && previousPath.startsWith(`/pembahasan/${userAnswerId}`)) {
    router.back()
    return
  }

  // Dibuka langsung / refresh / dari halaman lain → arahkan ke halaman hasil ujian
  router.push(resultPageUrl.value)
}
</script>

<template>
  <main class="min-h-screen py-8 bg-tryout-bg">

    <!-- Loading pertama -->
    <div v-if="isFirstLoad" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="animate-spin rounded-full h-16 w-16 border-4 mx-auto border-tryout-border border-t-tryout-primary"></div>
        <p class="mt-6 font-bold text-tryout-muted">Memuat ranking...</p>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="errorMessage && !ranking" class="max-w-xl mx-auto px-4 pt-24 text-center">
      <div class="rounded-3xl p-8 bg-tryout-surface border border-tryout-border shadow-xl">
        <p class="text-4xl mb-4">⚠️</p>
        <p class="font-bold text-tryout-text mb-2">{{ errorMessage }}</p>
        <div class="flex justify-center gap-3 mt-6">
          <button
            class="px-5 py-2.5 rounded-xl font-bold bg-tryout-hover border border-tryout-border text-tryout-text"
            @click="goBack"
          >
            Kembali
          </button>
          <button
            class="px-5 py-2.5 rounded-xl font-bold bg-tryout-primary text-white"
            @click="refresh()"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    </div>

    <div v-else class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

      <!-- Header -->
      <div class="mb-8">
        <button
          class="mb-6 flex items-center gap-2 text-sm font-bold transition-colors group text-tryout-muted hover:text-tryout-text"
          @click="goBack"
        >
          <span class="p-1.5 rounded-lg transition-all bg-tryout-surface border border-tryout-border group-hover:bg-tryout-hover">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </span>
          Kembali ke Hasil Ujian
        </button>

        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 class="text-3xl md:text-4xl font-extrabold mb-2 bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
              🏆 Ranking Lengkap
            </h1>
            <p class="font-bold text-lg text-tryout-text">{{ bankTitle }}</p>
            <div class="flex flex-wrap items-center gap-2 mt-2">
              <span class="text-xs font-bold px-3 py-1 rounded-full bg-tryout-hover text-tryout-muted border border-tryout-border">
                Percobaan ke-{{ ranking?.attemptNumber }}
              </span>
              <span class="text-xs font-bold px-3 py-1 rounded-full bg-tryout-hover text-tryout-muted border border-tryout-border">
                {{ formatNumber(totalParticipants) }} Peserta
              </span>
              <span
                v-if="isCombined"
                class="text-xs font-bold px-3 py-1 rounded-full bg-tryout-primary/10 text-tryout-primary border border-tryout-primary/20"
              >
                ⭐ Skor Total (Utama + Wawancara)
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Kartu Posisi Saya -->
      <div
        v-if="userRank"
        class="mb-8 rounded-3xl shadow-xl p-6 bg-tryout-primary/10 border border-tryout-primary/20 relative overflow-hidden"
      >
        <div class="absolute -top-10 -right-10 w-40 h-40 bg-tryout-primary/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div class="flex items-center gap-5">
            <div
              class="w-20 h-20 rounded-2xl flex flex-col items-center justify-center font-extrabold shadow-md shrink-0"
              :class="getRankColor(userRank.rank)"
            >
              <span class="text-[10px] uppercase tracking-wider opacity-80">Rank</span>
              <span class="text-2xl leading-none">#{{ formatNumber(userRank.rank) }}</span>
            </div>

            <div>
              <p class="text-xs font-bold uppercase tracking-wider text-tryout-muted">Posisi Anda Saat Ini</p>
              <p class="text-2xl font-extrabold text-tryout-text">
                Peringkat {{ formatNumber(userRank.rank) }}
                <span class="text-base font-bold text-tryout-muted">dari {{ formatNumber(totalParticipants) }}</span>
              </p>
              <p class="text-sm font-semibold text-tryout-primary mt-1">
                {{ formatNumber(userRank.totalPoint) }} poin
                <template v-if="percentile !== null">
                  · Lebih unggul dari {{ percentile }}% peserta
                </template>
              </p>
            </div>
          </div>

          <button
            class="px-5 py-3 rounded-2xl font-extrabold bg-tryout-primary text-white shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            @click="jumpToMyPosition"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Lompat ke Posisi Saya
          </button>
        </div>
      </div>

      <!-- Kontrol: cari & jumlah per halaman -->
      <div ref="listTop" class="mb-4 flex flex-col sm:flex-row gap-3 sm:items-center justify-between scroll-mt-6">
        <div class="relative flex-1 max-w-md">
          <svg class="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-tryout-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
          </svg>
          <input
            v-model="searchInput"
            type="text"
            placeholder="Cari nama peserta..."
            class="w-full pl-11 pr-10 py-3 rounded-2xl text-sm font-medium bg-tryout-surface border border-tryout-border text-tryout-text placeholder:text-tryout-muted focus:outline-none focus:ring-2 focus:ring-tryout-primary/40"
          >
          <button
            v-if="searchInput"
            class="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-tryout-muted hover:bg-tryout-hover"
            aria-label="Hapus pencarian"
            @click="clearSearch"
          >
            ✕
          </button>
        </div>

        <label class="flex items-center gap-2 text-sm font-bold text-tryout-muted">
          Tampilkan
          <select
            :value="size"
            class="px-3 py-2.5 rounded-xl bg-tryout-surface border border-tryout-border text-tryout-text font-bold focus:outline-none focus:ring-2 focus:ring-tryout-primary/40"
            @change="changeSize"
          >
            <option v-for="option in PAGE_SIZE_OPTIONS" :key="option" :value="option">{{ option }}</option>
          </select>
          per halaman
        </label>
      </div>

      <!-- Tabel Ranking -->
      <div class="rounded-3xl shadow-xl bg-tryout-surface border border-tryout-border overflow-hidden">
        <div class="overflow-x-auto transition-opacity" :class="pending ? 'opacity-50 pointer-events-none' : ''">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-[11px] uppercase tracking-wider text-tryout-muted border-b border-tryout-border bg-tryout-hover/60">
                <th class="py-3.5 pl-5 pr-3 font-extrabold w-20">Rank</th>
                <th class="py-3.5 px-3 font-extrabold">Peserta</th>

                <template v-if="showSkdColumns">
                  <th class="py-3.5 px-3 font-extrabold text-center hidden md:table-cell">TWK</th>
                  <th class="py-3.5 px-3 font-extrabold text-center hidden md:table-cell">TIU</th>
                  <th class="py-3.5 px-3 font-extrabold text-center hidden md:table-cell">TKP</th>
                </template>

                <template v-if="showPppkColumns">
                  <th class="py-3.5 px-3 font-extrabold text-center hidden md:table-cell">Teknis</th>
                  <th class="py-3.5 px-3 font-extrabold text-center hidden md:table-cell">Manajerial</th>
                  <th class="py-3.5 px-3 font-extrabold text-center hidden md:table-cell">Soskul</th>
                </template>

                <th class="py-3.5 px-3 font-extrabold text-center hidden sm:table-cell">Durasi</th>
                <th class="py-3.5 pl-3 pr-5 font-extrabold text-right">Total Poin</th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="item in items"
                :id="item.isCurrentUser ? 'my-rank-row' : undefined"
                :key="item.rank"
                class="border-b border-tryout-border last:border-b-0 transition-colors"
                :class="item.isCurrentUser
                  ? 'bg-tryout-primary/10'
                  : 'hover:bg-tryout-hover'"
              >
                <td class="py-3 pl-5 pr-3">
                  <div class="flex items-center gap-2">
                    <div
                      class="min-w-[2.5rem] h-10 px-2 rounded-full flex items-center justify-center font-extrabold text-xs shadow-sm"
                      :class="getRankColor(item.rank)"
                    >
                      {{ formatNumber(item.rank) }}
                    </div>
                    <span v-if="item.rank <= 3" class="text-xl">{{ getRankBadge(item.rank) }}</span>
                  </div>
                </td>

                <td class="py-3 px-3 max-w-[14rem]">
                  <p
                    class="font-bold truncate"
                    :class="item.isCurrentUser ? 'text-tryout-primary' : 'text-tryout-text'"
                  >
                    {{ item.userName }}
                    <span
                      v-if="item.isCurrentUser"
                      class="text-[10px] uppercase tracking-wider ml-1 px-1.5 py-0.5 rounded bg-tryout-primary/15 text-tryout-primary"
                    >
                      Anda
                    </span>
                  </p>
                  <!-- Durasi tampil di bawah nama untuk layar kecil -->
                  <p class="text-xs font-medium text-tryout-muted sm:hidden">
                    ⏱ {{ formatDuration(item.durationTaken) }}
                  </p>
                </td>

                <template v-if="showSkdColumns">
                  <td class="py-3 px-3 text-center font-semibold text-tryout-text hidden md:table-cell">{{ item.scoreTwk }}</td>
                  <td class="py-3 px-3 text-center font-semibold text-tryout-text hidden md:table-cell">{{ item.scoreTiu }}</td>
                  <td class="py-3 px-3 text-center font-semibold text-tryout-text hidden md:table-cell">{{ item.scoreTkp }}</td>
                </template>

                <template v-if="showPppkColumns">
                  <td class="py-3 px-3 text-center font-semibold text-tryout-text hidden md:table-cell">{{ item.scoreTeknis }}</td>
                  <td class="py-3 px-3 text-center font-semibold text-tryout-text hidden md:table-cell">{{ item.scoreManajerial }}</td>
                  <td class="py-3 px-3 text-center font-semibold text-tryout-text hidden md:table-cell">{{ item.scoreSoskul }}</td>
                </template>

                <td class="py-3 px-3 text-center font-medium text-tryout-muted hidden sm:table-cell tabular-nums">
                  {{ formatDuration(item.durationTaken) }}
                </td>

                <td class="py-3 pl-3 pr-5 text-right">
                  <span
                    class="font-extrabold text-base tabular-nums"
                    :class="item.isCurrentUser ? 'text-tryout-primary' : 'text-tryout-text'"
                  >
                    {{ formatNumber(item.totalPoint) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Kosong -->
          <div v-if="items.length === 0 && !pending" class="text-center py-16 px-4">
            <p class="text-3xl mb-3">🔍</p>
            <p v-if="search" class="font-bold text-tryout-text">
              Tidak ada peserta dengan nama "{{ search }}"
            </p>
            <p v-else class="font-bold text-tryout-text">Belum ada data ranking</p>
            <button
              v-if="search"
              class="mt-4 px-4 py-2 rounded-xl text-sm font-bold bg-tryout-hover border border-tryout-border text-tryout-text"
              @click="clearSearch"
            >
              Hapus pencarian
            </button>
          </div>
        </div>

        <!-- Pagination -->
        <div
          v-if="totalPages > 0"
          class="flex flex-col md:flex-row items-center justify-between gap-4 px-5 py-4 border-t border-tryout-border bg-tryout-hover/40"
        >
          <p class="text-xs font-bold text-tryout-muted">
            Menampilkan {{ formatNumber(rangeStart) }}–{{ formatNumber(rangeEnd) }}
            dari {{ formatNumber(totalElements) }} {{ search ? 'hasil pencarian' : 'peserta' }}
          </p>

          <nav class="flex items-center gap-1.5" aria-label="Pagination">
            <button
              class="h-9 px-3 rounded-xl text-sm font-bold border border-tryout-border bg-tryout-surface text-tryout-text disabled:opacity-40 disabled:cursor-not-allowed hover:bg-tryout-hover"
              :disabled="page <= 1 || pending"
              @click="goToPage(page - 1)"
            >
              ‹ <span class="hidden sm:inline">Sebelumnya</span>
            </button>

            <template v-for="(p, index) in pageNumbers" :key="`page-${index}-${p}`">
              <span v-if="p === '…'" class="px-1.5 text-tryout-muted font-bold">…</span>
              <button
                v-else
                class="h-9 min-w-[2.25rem] px-2 rounded-xl text-sm font-bold border transition-colors"
                :class="p === page
                  ? 'bg-tryout-primary text-white border-tryout-primary'
                  : 'bg-tryout-surface text-tryout-text border-tryout-border hover:bg-tryout-hover'"
                :disabled="pending"
                @click="goToPage(p)"
              >
                {{ p }}
              </button>
            </template>

            <button
              class="h-9 px-3 rounded-xl text-sm font-bold border border-tryout-border bg-tryout-surface text-tryout-text disabled:opacity-40 disabled:cursor-not-allowed hover:bg-tryout-hover"
              :disabled="page >= totalPages || pending"
              @click="goToPage(page + 1)"
            >
              <span class="hidden sm:inline">Berikutnya</span> ›
            </button>
          </nav>
        </div>
      </div>

      <!-- Aturan peringkat -->
      <div class="mt-6 p-4 rounded-2xl bg-tryout-surface border border-tryout-border flex gap-3 items-start">
        <svg class="w-4 h-4 text-tryout-primary shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-xs leading-relaxed text-tryout-muted font-medium">
          <strong class="text-tryout-text">Aturan Peringkat:</strong>
          diurutkan dari total poin tertinggi. Jika poin sama, ditentukan berdasarkan nilai per kategori,
          lalu durasi pengerjaan tercepat. Ranking hanya membandingkan peserta pada percobaan ke-{{ ranking?.attemptNumber }}.
        </p>
      </div>

    </div>
  </main>
</template>