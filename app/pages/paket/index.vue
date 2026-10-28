<script setup>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch
} from 'vue'

definePageMeta({
  layout: 'landing'
})

const search = ref('')

const selectedCategory = ref('all')
const selectedSubCategory = ref('all')
const selectedJabatan = ref('all')

const currentPage = ref(1)
const itemsPerPage = ref(9)

const { $api } = useNuxtApp()
const { isLoggedIn } = useAuthUser()

/*
 * =========================================================
 * DATA MASTER PAKET
 * =========================================================
 */
const {
  data: response,
  pending: loadingPackets
} = await useAsyncData(
  'packets',
  () => $api('/api/v1/packets')
)

const allPackets = computed(() =>
  Array.isArray(response.value?.data)
    ? response.value.data
    : []
)

const {
  data: positionsData
} = await useAsyncData(
  'master-positions',
  () => $api('/api/v1/positions')
)

const masterJabatans = computed(() =>
  Array.isArray(positionsData.value?.data)
    ? positionsData.value.data
    : []
)

/*
 * =========================================================
 * DATA TRANSAKSI USER
 * =========================================================
 *
 * Paket tidak ditampilkan bila:
 * - sudah PAID;
 * - masih PENDING dan belum melewati expiredAt.
 *
 * Paket kembali ditampilkan bila:
 * - CANCELLED;
 * - EXPIRED;
 * - FAILED;
 * - PENDING tetapi waktu lokal sudah melewati expiredAt.
 */
const purchasedPacketIds = ref([])
const activePendingPacketIds = ref([])

const isLoadingUserTransactions = ref(false)

const normalizeId = (value) => {
  if (
    value === null
    || value === undefined
    || value === ''
  ) {
    return null
  }

  return String(value)
}

const isPendingStillActive = (transaction) => {
  const status = String(
    transaction?.transactionStatus || ''
  ).toUpperCase()

  if (status !== 'PENDING') {
    return false
  }

  if (!transaction?.expiredAt) {
    return true
  }

  const expiredDate =
    new Date(transaction.expiredAt)

  /*
   * Bila format tanggal tidak valid,
   * anggap masih aktif agar tidak membuat
   * invoice ganda.
   */
  if (Number.isNaN(expiredDate.getTime())) {
    return true
  }

  return expiredDate.getTime() > Date.now()
}

const fetchUserTransactionData = async () => {
  if (!isLoggedIn.value) {
    purchasedPacketIds.value = []
    activePendingPacketIds.value = []

    return
  }

  isLoadingUserTransactions.value = true

  try {
    const [
      purchasedResponse,
      historyResponse
    ] = await Promise.all([
      $api('/api/v1/transactions/my'),
      $api('/api/v1/transactions/history')
    ])

    const purchasedList =
      Array.isArray(purchasedResponse?.data)
        ? purchasedResponse.data
        : []

    const historyList =
      Array.isArray(historyResponse?.data)
        ? historyResponse.data
        : []

    purchasedPacketIds.value = purchasedList
      .map(item =>
        normalizeId(
          item.id ?? item.packetId
        )
      )
      .filter(Boolean)

    activePendingPacketIds.value = historyList
      .filter(isPendingStillActive)
      .map(item =>
        normalizeId(
          item.packetHashId
          ?? item.packetId
        )
      )
      .filter(Boolean)
  } catch (error) {
    console.error(
      'Gagal mengambil data transaksi user:',
      error
    )

    /*
     * Saat gagal mengambil transaksi, kosongkan daftar.
     * Halaman paket tetap dapat digunakan.
     */
    purchasedPacketIds.value = []
    activePendingPacketIds.value = []
  } finally {
    isLoadingUserTransactions.value = false
  }
}

/*
 * Refresh saat status login berubah.
 */
watch(
  isLoggedIn,
  () => {
    fetchUserTransactionData()
  }
)

/*
 * =========================================================
 * AVAILABLE PACKETS
 * =========================================================
 */
const purchasedPacketSet = computed(() =>
  new Set(purchasedPacketIds.value)
)

const pendingPacketSet = computed(() =>
  new Set(activePendingPacketIds.value)
)

const availablePackets = computed(() => {
  return allPackets.value.filter(packet => {
    const packetId =
      normalizeId(packet.id)

    if (!packetId) {
      return false
    }

    const alreadyPurchased =
      purchasedPacketSet.value.has(packetId)

    const hasActivePendingTransaction =
      pendingPacketSet.value.has(packetId)

    return !alreadyPurchased
      && !hasActivePendingTransaction
  })
})

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */
const generateSlug = (text) => {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/&/g, 'dan')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const formatPrice = (price) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(Number(price || 0))
}

/*
 * =========================================================
 * FILTERS
 * =========================================================
 */
const categories = computed(() => {
  return [
    'all',
    ...new Set(
      allPackets.value
        .map(packet => packet.category)
        .filter(Boolean)
    )
  ]
})

const subCategories = computed(() => {
  let packets = allPackets.value

  if (selectedCategory.value !== 'all') {
    packets = packets.filter(
      packet =>
        packet.category
        === selectedCategory.value
    )
  }

  return [
    'all',
    ...new Set(
      packets
        .map(packet => packet.subCategory)
        .filter(Boolean)
    )
  ]
})

const jabatans = computed(() => {
  return [
    'all',
    ...masterJabatans.value
      .map(position => position.title)
      .filter(Boolean)
  ]
})

const isJabatanDisabled = computed(() => {
  return String(
    selectedSubCategory.value || ''
  ).toLowerCase() === 'skd'
})

const filteredPackets = computed(() => {
  let result = availablePackets.value

  if (search.value) {
    const query =
      search.value.toLowerCase()

    result = result.filter(packet =>
      packet.title
        ?.toLowerCase()
        .includes(query)
      || packet.description
        ?.toLowerCase()
        .includes(query)
    )
  }

  if (selectedCategory.value !== 'all') {
    result = result.filter(
      packet =>
        packet.category
        === selectedCategory.value
    )
  }

  if (selectedSubCategory.value !== 'all') {
    result = result.filter(
      packet =>
        packet.subCategory
        === selectedSubCategory.value
    )
  }

  if (
    selectedJabatan.value !== 'all'
    && !isJabatanDisabled.value
  ) {
    result = result.filter(
      packet =>
        packet.position
        === selectedJabatan.value
    )
  }

  return result
})

/*
 * =========================================================
 * DROPDOWN JABATAN
 * =========================================================
 */
const jabatanDropdownRef = ref(null)
const isJabatanDropdownOpen = ref(false)
const jabatanSearchQuery = ref('')

const filteredJabatansList = computed(() => {
  if (!jabatanSearchQuery.value) {
    return jabatans.value
  }

  const query =
    jabatanSearchQuery.value.toLowerCase()

  return jabatans.value.filter(jabatan =>
    jabatan
      .toLowerCase()
      .includes(query)
  )
})

const selectJabatanItem = (jabatan) => {
  selectedJabatan.value = jabatan
  isJabatanDropdownOpen.value = false
  jabatanSearchQuery.value = ''
}

const closeJabatanDropdown = (event) => {
  if (
    jabatanDropdownRef.value
    && !jabatanDropdownRef.value.contains(
      event.target
    )
  ) {
    isJabatanDropdownOpen.value = false
  }
}

/*
 * =========================================================
 * PAGINATION
 * =========================================================
 */
const totalPages = computed(() => {
  return Math.ceil(
    filteredPackets.value.length
    / itemsPerPage.value
  )
})

const paginatedPackets = computed(() => {
  const start =
    (currentPage.value - 1)
    * itemsPerPage.value

  return filteredPackets.value.slice(
    start,
    start + itemsPerPage.value
  )
})

const pageNumbers = computed(() => {
  const pages = []

  const total = totalPages.value
  const current = currentPage.value

  if (total <= 7) {
    for (let page = 1; page <= total; page++) {
      pages.push(page)
    }

    return pages
  }

  pages.push(1)

  if (current > 3) {
    pages.push('...')
  }

  for (
    let page = Math.max(2, current - 1);
    page <= Math.min(total - 1, current + 1);
    page++
  ) {
    pages.push(page)
  }

  if (current < total - 2) {
    pages.push('...')
  }

  pages.push(total)

  return pages
})

const goToPage = (page) => {
  if (page === '...') {
    return
  }

  currentPage.value = page

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

/*
 * =========================================================
 * RESET & WATCHERS
 * =========================================================
 */
const resetFilters = () => {
  search.value = ''
  selectedCategory.value = 'all'
  selectedSubCategory.value = 'all'
  selectedJabatan.value = 'all'

  jabatanSearchQuery.value = ''
  currentPage.value = 1
}

watch(selectedCategory, () => {
  selectedSubCategory.value = 'all'
  selectedJabatan.value = 'all'
  currentPage.value = 1
})

watch(selectedSubCategory, value => {
  if (
    String(value || '').toLowerCase()
    === 'skd'
  ) {
    selectedJabatan.value = 'all'
  }

  currentPage.value = 1
})

watch(
  [
    search,
    selectedJabatan
  ],
  () => {
    currentPage.value = 1
  }
)

watch(
  filteredPackets,
  () => {
    if (
      totalPages.value > 0
      && currentPage.value > totalPages.value
    ) {
      currentPage.value =
        totalPages.value
    }

    if (totalPages.value === 0) {
      currentPage.value = 1
    }
  }
)

/*
 * =========================================================
 * LIFECYCLE
 * =========================================================
 */
onMounted(() => {
  fetchUserTransactionData()

  document.addEventListener(
    'click',
    closeJabatanDropdown
  )
})

onBeforeUnmount(() => {
  document.removeEventListener(
    'click',
    closeJabatanDropdown
  )
})

const isPageLoading = computed(() => {
  return loadingPackets.value
    || (
      isLoggedIn.value
      && isLoadingUserTransactions.value
    )
})
</script>

<template>
  <section
    class="min-h-screen py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans transition-colors duration-300 bg-tryout-bg selection:bg-tryout-accent/30"
  >
    <div
      class="absolute -top-24 -right-24 w-96 h-96 rounded-full pointer-events-none blur-[100px] bg-tryout-primary/8"
    ></div>

    <div
      class="absolute -bottom-24 -left-24 w-96 h-96 rounded-full pointer-events-none blur-[100px] bg-tryout-accent/8"
    ></div>

    <div class="max-w-6xl mx-auto relative z-10">
      <header
        class="mb-16 text-left border-l-4 border-tryout-accent pl-6"
      >
        <h1
          class="text-4xl md:text-5xl font-black tracking-tighter mb-2 text-tryout-text"
        >
          PAKET
          <span class="text-tryout-accent">
            TRYOUT.
          </span>
        </h1>

        <p class="font-medium text-lg text-tryout-muted">
          Silakan cari sesuai kebutuhan Anda
        </p>
      </header>

      <!-- Filters -->
      <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 mb-12 items-start relative z-50"
      >
        <div class="lg:col-span-4 relative">
          <input
            v-model="search"
            type="text"
            placeholder="Cari nama paket..."
            class="w-full rounded-2xl py-4 pl-12 pr-4 text-sm font-medium outline-none transition-all shadow-sm bg-tryout-input border border-tryout-border text-tryout-text placeholder:text-tryout-subtle focus:border-tryout-accent"
          >

          <svg
            class="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-tryout-subtle"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <div class="lg:col-span-2 relative">
          <select
            v-model="selectedCategory"
            class="w-full rounded-2xl py-4 px-4 text-sm font-bold outline-none appearance-none cursor-pointer capitalize transition-all shadow-sm bg-tryout-input border border-tryout-border text-tryout-text focus:border-tryout-accent"
          >
            <option
              value="all"
              class="bg-tryout-surface text-tryout-text"
            >
              Semua Kategori
            </option>

            <option
              v-for="category in categories.filter(
                item => item !== 'all'
              )"
              :key="category"
              :value="category"
              class="bg-tryout-surface text-tryout-text"
            >
              {{ category }}
            </option>
          </select>
        </div>

        <div class="lg:col-span-2 relative">
          <select
            v-model="selectedSubCategory"
            class="w-full rounded-2xl py-4 px-4 text-sm font-bold outline-none appearance-none cursor-pointer capitalize transition-all shadow-sm bg-tryout-input border border-tryout-border text-tryout-text focus:border-tryout-accent"
          >
            <option
              value="all"
              class="bg-tryout-surface text-tryout-text"
            >
              Semua Jenis Tes
            </option>

            <option
              v-for="subCategory in subCategories.filter(
                item => item !== 'all'
              )"
              :key="subCategory"
              :value="subCategory"
              class="bg-tryout-surface text-tryout-text"
            >
              {{ subCategory }}
            </option>
          </select>
        </div>

        <div
          ref="jabatanDropdownRef"
          class="lg:col-span-2 relative"
        >
          <button
            type="button"
            :disabled="isJabatanDisabled"
            :class="[
              'w-full rounded-2xl py-4 px-4 text-left text-sm font-bold transition-all flex justify-between items-center border shadow-sm',
              isJabatanDisabled
                ? 'opacity-40 cursor-not-allowed bg-tryout-hover border-tryout-border text-tryout-subtle'
                : 'cursor-pointer bg-tryout-input border-tryout-border text-tryout-text hover:bg-tryout-hover',
              isJabatanDropdownOpen && !isJabatanDisabled
                ? 'border-tryout-accent ring-2 ring-tryout-accent/20'
                : ''
            ]"
            @click="
              !isJabatanDisabled
              && (
                isJabatanDropdownOpen
                = !isJabatanDropdownOpen
              )
            "
          >
            <span class="truncate capitalize">
              {{
                selectedJabatan === 'all'
                  ? 'Semua Jabatan'
                  : selectedJabatan
              }}
            </span>

            <svg
              class="w-4 h-4 flex-shrink-0 text-tryout-subtle transition-transform duration-200"
              :class="{
                'rotate-180':
                  isJabatanDropdownOpen
              }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          <Transition name="dropdown">
            <div
              v-if="isJabatanDropdownOpen"
              class="absolute top-full left-0 right-0 mt-2 rounded-xl shadow-2xl z-[99] overflow-hidden bg-tryout-surface border border-tryout-border"
            >
              <div
                class="p-2 border-b bg-tryout-hover border-tryout-divider"
              >
                <div class="relative">
                  <input
                    v-model="jabatanSearchQuery"
                    type="text"
                    placeholder="Cari posisi..."
                    class="w-full rounded-lg py-2 pl-9 pr-3 text-sm outline-none transition-all bg-tryout-input border border-tryout-border text-tryout-text placeholder:text-tryout-subtle focus:border-tryout-accent"
                  >

                  <svg
                    class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-tryout-subtle"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              <ul
                class="max-h-60 overflow-y-auto custom-scrollbar"
              >
                <li
                  v-if="
                    filteredJabatansList.length === 0
                  "
                  class="p-4 text-sm text-center text-tryout-muted"
                >
                  Posisi tidak ditemukan
                </li>

                <li
                  v-for="jabatan in filteredJabatansList"
                  v-else
                  :key="jabatan"
                >
                  <button
                    v-if="jabatan === 'all'"
                    type="button"
                    class="w-full text-left px-4 py-3 text-sm capitalize transition-colors"
                    :class="
                      selectedJabatan === 'all'
                        ? 'bg-tryout-accent/10 text-tryout-accent font-semibold'
                        : 'text-tryout-text hover:bg-tryout-hover hover:text-tryout-primary'
                    "
                    @click="selectJabatanItem(jabatan)"
                  >
                    Semua Jabatan
                  </button>

                  <NuxtLink
                    v-else
                    :to="`/formasi/${generateSlug(jabatan)}`"
                    class="block w-full text-left px-4 py-3 text-sm capitalize transition-colors"
                    :class="
                      selectedJabatan === jabatan
                        ? 'bg-tryout-accent/10 text-tryout-accent font-semibold'
                        : 'text-tryout-text hover:bg-tryout-hover hover:text-tryout-primary'
                    "
                    @click="
                      isJabatanDropdownOpen = false;
                      jabatanSearchQuery = ''
                    "
                  >
                    {{ jabatan }}
                  </NuxtLink>
                </li>
              </ul>
            </div>
          </Transition>
        </div>

        <div class="lg:col-span-2">
          <button
            type="button"
            class="w-full py-4 rounded-2xl font-bold text-sm transition-all shadow-sm border border-tryout-accent/50 text-tryout-accent bg-tryout-surface hover:bg-tryout-accent hover:border-tryout-accent hover:text-white"
            @click="resetFilters"
          >
            Reset Filter
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div
        v-if="isPageLoading"
        class="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10"
      >
        <div
          v-for="index in 3"
          :key="index"
          class="h-80 rounded-3xl animate-pulse bg-tryout-skeleton"
        ></div>
      </div>

      <!-- Empty -->
      <div
        v-else-if="filteredPackets.length === 0"
        class="text-center py-20 rounded-3xl relative z-10 bg-tryout-surface border border-tryout-border shadow-sm"
      >
        <div
          class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-tryout-hover"
        >
          <svg
            class="w-8 h-8 text-tryout-subtle"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <p
          class="font-bold uppercase tracking-widest text-sm text-tryout-muted"
        >
          Tidak ada paket yang tersedia
        </p>

        <p class="mt-2 text-sm text-tryout-subtle">
          Paket mungkin sudah dimiliki atau masih memiliki
          pembayaran aktif.
        </p>

        <button
          type="button"
          class="mt-4 text-sm font-semibold underline underline-offset-2 transition-colors text-tryout-accent hover:opacity-80"
          @click="resetFilters"
        >
          Reset filter
        </button>
      </div>

      <!-- Cards -->
      <div
        v-else
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10"
      >
        <article
          v-for="packet in paginatedPackets"
          :key="packet.id"
          class="group rounded-[2rem] p-6 flex flex-col justify-between transition-all duration-500 bg-tryout-surface border border-tryout-border hover:border-tryout-accent/60 hover:shadow-xl"
        >
          <div>
            <div
              class="flex justify-between items-start mb-6 gap-2"
            >
              <div class="flex gap-2 flex-wrap">
                <span
                  class="text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full bg-tryout-accent text-white"
                >
                  {{ packet.category }}
                </span>

                <span
                  v-if="packet.subCategory"
                  class="text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full bg-tryout-primary/10 text-tryout-primary border border-tryout-primary/20"
                >
                  {{ packet.subCategory }}
                </span>
              </div>

              <span
                class="text-[10px] font-bold tracking-widest uppercase text-right max-w-[110px] truncate shrink-0 text-tryout-subtle"
                :title="packet.position"
              >
                {{ packet.position || 'Umum' }}
              </span>
            </div>

            <h3
              class="text-xl font-bold mb-3 leading-tight capitalize transition-colors text-tryout-text group-hover:text-tryout-accent"
            >
              {{ packet.title }}
            </h3>
          </div>

          <div class="pt-6 border-t border-tryout-divider">
            <div
              class="flex items-center justify-between mb-5"
            >
              <div>
                <span
                  class="text-2xl font-black tracking-tighter text-tryout-text"
                >
                  {{ formatPrice(packet.price) }}
                </span>

                <!-- <p
                  class="mt-1 text-[11px] font-semibold text-emerald-500"
                >
                  Tanpa biaya pembayaran tambahan
                </p> -->
              </div>

              <div
                class="w-10 h-10 rounded-full flex items-center justify-center transition-all border border-tryout-border text-tryout-subtle group-hover:bg-tryout-accent group-hover:border-tryout-accent group-hover:text-white"
              >
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="3"
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </div>
            </div>

            <NuxtLink
              :to="`/paket/${packet.id}/detail`"
              class="block w-full text-center py-3.5 rounded-xl text-xs uppercase tracking-widest font-black transition-all bg-tryout-hover text-tryout-text hover:bg-tryout-accent hover:text-white"
            >
              Lihat &amp; Beli Paket
            </NuxtLink>
          </div>
        </article>
      </div>

      <!-- Pagination -->
      <div
        v-if="totalPages > 1"
        class="mt-16 flex justify-center items-center gap-6 relative z-10"
      >
        <button
          type="button"
          :disabled="currentPage === 1"
          class="font-black text-xs tracking-tighter transition-all disabled:opacity-20 text-tryout-muted hover:text-tryout-text"
          @click="currentPage--"
        >
          PREV
        </button>

        <div class="flex gap-4">
          <button
            v-for="page in pageNumbers"
            :key="page"
            type="button"
            :class="[
              'text-xs font-black transition-all',
              page === currentPage
                ? 'text-tryout-accent scale-125'
                : page === '...'
                  ? 'text-tryout-subtle cursor-default'
                  : 'text-tryout-muted hover:text-tryout-text'
            ]"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
        </div>

        <button
          type="button"
          :disabled="currentPage === totalPages"
          class="font-black text-xs tracking-tighter transition-all disabled:opacity-20 text-tryout-muted hover:text-tryout-text"
          @click="currentPage++"
        >
          NEXT
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');

.font-sans {
  font-family: 'Plus Jakarta Sans', sans-serif;
}

select {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-position: right 1rem center;
  background-repeat: no-repeat;
  background-size: 1.2em;
}

.dark select {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
}

select:disabled {
  opacity: 0.4;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: var(--color-tryout-hover);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--color-tryout-border);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--color-tryout-muted);
}
</style>