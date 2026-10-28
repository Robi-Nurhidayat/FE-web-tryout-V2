<script setup>
import { onMounted, ref } from 'vue'

definePageMeta({
  layout: 'landing'
})

const router = useRouter()
const route = useRoute()

const { isLoggedIn } = useAuthUser()
const toast = useToast()
const { $api } = useNuxtApp()

const transactions = ref([])
const isLoading = ref(true)

const isCancelling = ref(null)
const isContinuing = ref(null)

/*
 * =========================================================
 * FETCH RIWAYAT TRANSAKSI
 * =========================================================
 */
const fetchHistory = async () => {
  if (!isLoggedIn.value) {
    router.push({
      path: '/auth/sign-in',
      query: {
        redirect: route.fullPath
      }
    })

    return
  }

  isLoading.value = true

  try {
    const response = await $api(
      '/api/v1/transactions/history'
    )

    transactions.value = Array.isArray(response?.data)
      ? response.data
      : []
  } catch (error) {
    console.error(
      'Gagal mengambil riwayat transaksi:',
      error
    )

    toast.add({
      title: 'Gagal',
      description: 'Gagal memuat riwayat transaksi.',
      color: 'red'
    })
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchHistory()
})

/*
 * =========================================================
 * STATUS HELPERS
 * =========================================================
 */
const getStatus = (transaction) => {
  return String(
    transaction?.transactionStatus || ''
  ).toUpperCase()
}

const isPending = (transaction) => {
  return getStatus(transaction) === 'PENDING'
}

const isPaid = (transaction) => {
  const status = getStatus(transaction)

  return status === 'PAID'
    || status === 'SETTLEMENT'
}

const isExpired = (transaction) => {
  return getStatus(transaction) === 'EXPIRED'
}

const isCancelled = (transaction) => {
  const status = getStatus(transaction)

  return status === 'CANCELLED'
    || status === 'CANCELED'
    || status === 'CANCEL'
}

const isFailed = (transaction) => {
  return getStatus(transaction) === 'FAILED'
}

/*
 * =========================================================
 * LANJUTKAN PEMBAYARAN
 * =========================================================
 *
 * URL invoice diambil ulang dari backend agar:
 * - status transaksi diperiksa;
 * - hanya invoice milik user yang bisa dibuka;
 * - URL terbaru digunakan;
 * - invoice yang sudah tidak aktif ditolak.
 */
const continuePayment = async (transaction) => {
  if (!transaction?.packetHashId) {
    toast.add({
      title: 'Data paket tidak tersedia',
      description:
        'Paket untuk transaksi ini tidak ditemukan.',
      color: 'red'
    })

    return
  }

  isContinuing.value = transaction.orderId

  try {
    const response = await $api(
      `/api/v1/transactions/invoice/${transaction.packetHashId}`
    )

    const redirectUrl =
      response?.data?.redirectUrl
      || response?.data?.paymentUrl

    if (!redirectUrl) {
      throw new Error(
        'Link pembayaran tidak tersedia'
      )
    }

    window.location.href = redirectUrl
  } catch (error) {
    console.error(
      'Gagal melanjutkan pembayaran:',
      error
    )

    const message =
      error?.data?.message
      || error?.response?._data?.message
      || error?.message
      || 'Invoice sudah tidak aktif atau tidak tersedia.'

    toast.add({
      title: 'Pembayaran tidak dapat dilanjutkan',
      description: message,
      color: 'orange'
    })

    await fetchHistory()
  } finally {
    isContinuing.value = null
  }
}

/*
 * =========================================================
 * BATALKAN TRANSAKSI
 * =========================================================
 *
 * Paywuz mendukung cancel untuk transaksi PENDING.
 * Backend harus berhasil membatalkan di Paywuz terlebih dahulu,
 * baru status lokal berubah menjadi CANCELLED.
 */
const cancelTransaction = async (transaction) => {
  if (!isPending(transaction)) {
    return
  }

  const approved = window.confirm(
    'Batalkan transaksi ini?\n\n'
    + 'Invoice Paywuz akan dinonaktifkan dan tidak dapat dibayar lagi.'
  )

  if (!approved) {
    return
  }

  isCancelling.value = transaction.orderId

  try {
    await $api(
      `/api/v1/transactions/${transaction.orderId}/cancel`,
      {
        method: 'POST'
      }
    )

    const index = transactions.value.findIndex(
      item => item.orderId === transaction.orderId
    )

    if (index !== -1) {
      transactions.value[index].transactionStatus =
        'CANCELLED'
    }

    toast.add({
      title: 'Transaksi dibatalkan',
      description:
        'Invoice pembayaran berhasil dibatalkan.',
      color: 'green'
    })
  } catch (error) {
    console.error(
      'Gagal membatalkan transaksi:',
      error
    )

    const message =
      error?.data?.message
      || error?.response?._data?.message
      || error?.message
      || 'Sistem gagal membatalkan transaksi.'

    toast.add({
      title: 'Gagal membatalkan',
      description: message,
      color: 'red'
    })

    await fetchHistory()
  } finally {
    isCancelling.value = null
  }
}

/*
 * =========================================================
 * FORMATTER
 * =========================================================
 */
const formatPrice = (price) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(Number(price || 0))
}

const formatDate = (dateString) => {
  if (!dateString) {
    return '-'
  }

  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const formatPaymentMethod = (transaction) => {
  const method = String(
    transaction?.paymentMethod || ''
  ).toUpperCase()

  if (!method) {
    return '-'
  }

  if (method === 'VA') {
    return 'Virtual Account — Pilih Bank'
  }

  if (method === 'QRIS') {
    return 'QRIS'
  }

  return transaction.paymentMethod
}

/*
 * Karena biaya Paywuz ditanggung merchant,
 * pengguna membayar sesuai totalPayment atau harga paket.
 */
const getCustomerPayment = (transaction) => {
  return transaction?.totalPayment
    ?? transaction?.priceAtPurchase
    ?? 0
}

/*
 * =========================================================
 * STATUS APPEARANCE
 * =========================================================
 */
const getStatusColor = (status) => {
  const normalizedStatus =
    String(status || '').toUpperCase()

  if (
    normalizedStatus === 'PAID'
    || normalizedStatus === 'SETTLEMENT'
  ) {
    return [
      'bg-emerald-100',
      'text-emerald-700',
      'border-emerald-200',
      'dark:bg-emerald-500/15',
      'dark:text-emerald-400',
      'dark:border-emerald-500/30'
    ].join(' ')
  }

  if (normalizedStatus === 'PENDING') {
    return [
      'bg-amber-100',
      'text-amber-700',
      'border-amber-200',
      'dark:bg-amber-500/15',
      'dark:text-amber-400',
      'dark:border-amber-500/30'
    ].join(' ')
  }

  if (normalizedStatus === 'EXPIRED') {
    return [
      'bg-slate-100',
      'text-slate-600',
      'border-slate-200',
      'dark:bg-slate-500/15',
      'dark:text-slate-400',
      'dark:border-slate-500/30'
    ].join(' ')
  }

  if (
    normalizedStatus === 'CANCELLED'
    || normalizedStatus === 'CANCELED'
    || normalizedStatus === 'CANCEL'
  ) {
    return [
      'bg-orange-100',
      'text-orange-700',
      'border-orange-200',
      'dark:bg-orange-500/15',
      'dark:text-orange-400',
      'dark:border-orange-500/30'
    ].join(' ')
  }

  return [
    'bg-red-100',
    'text-red-600',
    'border-red-200',
    'dark:bg-red-500/15',
    'dark:text-red-400',
    'dark:border-red-500/30'
  ].join(' ')
}

const getStatusText = (status) => {
  const normalizedStatus =
    String(status || '').toUpperCase()

  if (
    normalizedStatus === 'PAID'
    || normalizedStatus === 'SETTLEMENT'
  ) {
    return 'Berhasil'
  }

  if (normalizedStatus === 'PENDING') {
    return 'Menunggu Pembayaran'
  }

  if (normalizedStatus === 'EXPIRED') {
    return 'Kedaluwarsa'
  }

  if (
    normalizedStatus === 'CANCELLED'
    || normalizedStatus === 'CANCELED'
    || normalizedStatus === 'CANCEL'
  ) {
    return 'Dibatalkan'
  }

  if (normalizedStatus === 'FAILED') {
    return 'Gagal'
  }

  return normalizedStatus || '-'
}

const getStatusIcon = (status) => {
  const normalizedStatus =
    String(status || '').toUpperCase()

  if (
    normalizedStatus === 'PAID'
    || normalizedStatus === 'SETTLEMENT'
  ) {
    return 'check'
  }

  if (normalizedStatus === 'PENDING') {
    return 'clock'
  }

  return 'x'
}
</script>

<template>
  <main
    class="min-h-screen py-12 px-4 sm:px-6 lg:px-8 relative font-sans transition-colors duration-300 bg-tryout-bg"
  >
    <div
      class="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none blur-[100px] bg-tryout-primary/8"
    ></div>

    <div
      class="absolute bottom-0 left-0 w-80 h-80 rounded-full pointer-events-none blur-[100px] bg-tryout-accent/6"
    ></div>

    <div class="max-w-4xl mx-auto relative z-10 pt-10">
      <div class="mb-10 border-l-4 border-tryout-accent pl-6">
        <h1 class="text-3xl font-black text-tryout-text">
          Riwayat Transaksi
        </h1>

        <p class="mt-2 text-tryout-muted">
          Kelola seluruh pembelian paket Try Out Anda.
        </p>
      </div>

      <!-- Loading -->
      <div
        v-if="isLoading"
        class="flex flex-col items-center justify-center py-24 gap-4"
      >
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-tryout-accent"
        ></div>

        <p class="text-sm font-medium text-tryout-muted">
          Memuat transaksi...
        </p>
      </div>

      <!-- Empty -->
      <div
        v-else-if="transactions.length === 0"
        class="rounded-[2rem] p-12 text-center bg-tryout-surface border border-tryout-border shadow-sm"
      >
        <div
          class="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 bg-tryout-hover"
        >
          <svg
            class="w-10 h-10 text-tryout-subtle"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>

        <h3 class="text-xl font-bold text-tryout-text">
          Belum Ada Transaksi
        </h3>

        <p class="mt-2 mb-8 text-tryout-muted">
          Anda belum pernah melakukan pembelian paket.
        </p>

        <NuxtLink
          to="/paket"
          class="inline-block px-8 py-3 rounded-xl font-bold transition-all bg-tryout-accent hover:opacity-90 text-white"
        >
          Lihat Daftar Paket
        </NuxtLink>
      </div>

      <!-- List -->
      <div
        v-else
        class="space-y-5"
      >
        <article
          v-for="transaction in transactions"
          :key="transaction.orderId"
          class="rounded-[1.5rem] p-6 transition-all duration-300 bg-tryout-surface border border-tryout-border hover:border-tryout-muted hover:shadow-md"
        >
          <div
            class="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-5 pb-5 border-b border-tryout-divider"
          >
            <div class="flex-1 min-w-0">
              <p
                class="text-xs font-mono mb-1.5 text-tryout-subtle"
              >
                Order ID:

                <span class="text-tryout-muted">
                  {{ transaction.orderId }}
                </span>
              </p>

              <h3
                class="text-xl font-bold leading-tight text-tryout-text"
              >
                {{ transaction.packetTitle }}
              </h3>

              <p class="text-sm mt-1 text-tryout-muted">
                {{ transaction.packetCategory }}

                <template v-if="transaction.packetPosition">
                  — {{ transaction.packetPosition }}
                </template>
              </p>
            </div>

            <div class="shrink-0">
              <span
                :class="
                  getStatusColor(
                    transaction.transactionStatus
                  )
                "
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border"
              >
                <svg
                  v-if="
                    getStatusIcon(
                      transaction.transactionStatus
                    ) === 'check'
                  "
                  class="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="3"
                    d="M5 13l4 4L19 7"
                  />
                </svg>

                <svg
                  v-else-if="
                    getStatusIcon(
                      transaction.transactionStatus
                    ) === 'clock'
                  "
                  class="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>

                <svg
                  v-else
                  class="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2.5"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>

                {{
                  getStatusText(
                    transaction.transactionStatus
                  )
                }}
              </span>
            </div>
          </div>

          <div
            class="flex flex-col md:flex-row md:items-end justify-between gap-5"
          >
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-5">
              <div>
                <p
                  class="text-xs font-medium mb-1 text-tryout-subtle"
                >
                  Tanggal
                </p>

                <p class="text-sm text-tryout-muted">
                  {{ formatDate(transaction.createdAt) }}
                </p>
              </div>

              <div>
                <p
                  class="text-xs font-medium mb-1 text-tryout-subtle"
                >
                  Total Pembayaran
                </p>

                <p class="text-lg font-black text-tryout-text">
                  {{
                    formatPrice(
                      getCustomerPayment(transaction)
                    )
                  }}
                </p>
              </div>

              <div>
                <p
                  class="text-xs font-medium mb-1 text-tryout-subtle"
                >
                  Metode
                </p>

                <p class="text-sm font-semibold text-tryout-text">
                  {{ formatPaymentMethod(transaction) }}
                </p>
              </div>

              <div
                v-if="
                  isPending(transaction)
                  && transaction.expiredAt
                "
              >
                <p
                  class="text-xs font-medium mb-1 text-tryout-accent"
                >
                  Batas Pembayaran
                </p>

                <p
                  class="text-sm font-semibold text-tryout-accent"
                >
                  {{ formatDate(transaction.expiredAt) }}
                </p>
              </div>
            </div>

            <div
              class="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0"
            >
              <!-- Pending -->
              <template v-if="isPending(transaction)">
                <button
                  type="button"
                  :disabled="
                    isCancelling === transaction.orderId
                    || isContinuing === transaction.orderId
                  "
                  class="flex-1 md:flex-none px-5 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 border border-red-300 dark:border-red-500/30 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                  @click="cancelTransaction(transaction)"
                >
                  {{
                    isCancelling === transaction.orderId
                      ? 'Membatalkan...'
                      : 'Batalkan'
                  }}
                </button>

                <button
                  type="button"
                  :disabled="
                    isContinuing === transaction.orderId
                    || isCancelling === transaction.orderId
                  "
                  class="flex-1 md:flex-none px-5 py-2.5 rounded-xl font-bold text-sm transition-all bg-tryout-accent hover:opacity-90 text-white shadow-lg disabled:opacity-50"
                  @click="continuePayment(transaction)"
                >
                  {{
                    isContinuing === transaction.orderId
                      ? 'Membuka...'
                      : 'Lanjutkan Pembayaran'
                  }}
                </button>
              </template>

              <!-- Paid -->
              <template v-else-if="isPaid(transaction)">
                <NuxtLink
                  to="/my-packets"
                  class="flex-1 md:flex-none px-5 py-2.5 rounded-xl font-bold text-sm transition-all text-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20"
                >
                  Lihat Paket Saya
                </NuxtLink>
              </template>

              <!-- Cancelled, expired, failed -->
              <template
                v-else-if="
                  isCancelled(transaction)
                  || isExpired(transaction)
                  || isFailed(transaction)
                "
              >
                <NuxtLink
                  v-if="transaction.packetHashId"
                  :to="`/paket/${transaction.packetHashId}/detail`"
                  class="flex-1 md:flex-none px-5 py-2.5 rounded-xl font-bold text-sm transition-all text-center border border-tryout-accent/50 text-tryout-accent hover:bg-tryout-accent hover:text-white"
                >
                  Beli Kembali
                </NuxtLink>
              </template>

              <template v-else>
                <span
                  class="px-5 py-2.5 text-sm font-bold rounded-xl bg-tryout-hover border border-tryout-border text-tryout-subtle"
                >
                  Tidak Dapat Diproses
                </span>
              </template>
            </div>
          </div>

          <div
            v-if="isPending(transaction)"
            class="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3"
          >
            <p
              class="text-xs leading-relaxed text-amber-700 dark:text-amber-400"
            >
              Biaya layanan pembayaran ditanggung oleh
              Nyoba ASN. Anda hanya membayar sesuai harga
              paket yang tertera.
            </p>
          </div>
        </article>
      </div>
    </div>
  </main>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');

.font-sans {
  font-family: 'Plus Jakarta Sans', sans-serif;
}

.font-mono {
  font-family: 'DM Mono', monospace;
}
</style>