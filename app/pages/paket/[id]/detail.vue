<script setup>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  onUnmounted,
  ref,
  watch
} from 'vue'

definePageMeta({
  layout: 'landing'
})

const route = useRoute()
const router = useRouter()

const { isLoggedIn } = useAuthUser()
const toast = useToast()
const { $api } = useNuxtApp()

const packetId = String(route.params.id)

const FREE_PACKAGE_SUCCESS_ROUTE = '/my-packets'
const OWNED_PACKAGE_ROUTE = '/my-packets'

/*
 * =========================================================
 * STATE
 * =========================================================
 */
const isProcessing = ref(false)

const transactionStatus = ref(null)
const isLoadingStatus = ref(true)
const expiredAt = ref(null)
const existingPaymentMethod = ref(null)

const showPaymentModal = ref(false)
const paymentMethods = ref([])
const selectedPaymentMethod = ref(null)

const isLoadingPaymentMethods = ref(false)
const paymentMethodsError = ref('')

let intervalId = null

/*
 * =========================================================
 * DATA PAKET
 * =========================================================
 */
const {
  data: response,
  error
} = await useAsyncData(
  `packet-${packetId}`,
  () => $api(
    `/api/v1/packets/${packetId}`
  )
)

const packet = computed(() =>
  response.value?.data || null
)

const isLoading = computed(() =>
  !packet.value && !error.value
)

const packetPrice = computed(() => {
  return Number(packet.value?.price || 0)
})

const isFreePacket = computed(() => {
  return Boolean(packet.value)
    && packetPrice.value === 0
})

const isPaidPacket = computed(() => {
  return Boolean(packet.value)
    && packetPrice.value > 0
})

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

/*
 * =========================================================
 * STATUS TRANSAKSI
 * =========================================================
 */
const checkTransactionStatus = async () => {
  if (!isLoggedIn.value) {
    isLoadingStatus.value = false
    return
  }

  try {
    const response = await $api(
      `/api/v1/transactions/check/${packetId}`
    )

    const newStatus = String(
      response?.data?.status || 'NONE'
    ).toUpperCase()

    transactionStatus.value = newStatus
    expiredAt.value = response?.data?.expiredAt || null

    existingPaymentMethod.value =
      response?.data?.paymentMethod || null

    if (
      newStatus === 'PAID'
      || newStatus === 'EXPIRED'
      || newStatus === 'FAILED'
      || newStatus === 'CANCELLED'
      || newStatus === 'CANCELED'
    ) {
      stopStatusPolling()
    }
  } catch (error) {
    console.error(
      'Gagal mengecek status transaksi:',
      error
    )
  } finally {
    isLoadingStatus.value = false
  }
}

const stopStatusPolling = () => {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}

onMounted(() => {
  checkTransactionStatus()

  intervalId = setInterval(
    checkTransactionStatus,
    10_000
  )
})

onUnmounted(() => {
  stopStatusPolling()
})

/*
 * =========================================================
 * PEMBAYARAN PENDING
 * =========================================================
 */
const continuePendingPayment = async () => {
  if (!isLoggedIn.value) {
    redirectToLogin()
    return
  }

  isProcessing.value = true

  try {
    const response = await $api(
      `/api/v1/transactions/invoice/${packetId}`
    )

    const redirectUrl =
      response?.data?.redirectUrl
      || response?.data?.paymentUrl

    if (!redirectUrl) {
      throw new Error(
        'Link pembayaran tidak ditemukan'
      )
    }

    /*
     * TUJUAN PENDING BERBAYAR:
     * kembali ke paymentUrl Paywuz yang sudah dibuat.
     */
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
      || 'Invoice pembayaran tidak tersedia.'

    toast.add({
      title: 'Pembayaran tidak dapat dilanjutkan',
      description: message,
      color: 'orange'
    })

    await checkTransactionStatus()
  } finally {
    isProcessing.value = false
  }
}

/*
 * =========================================================
 * PAKET GRATIS
 * =========================================================
 */
const claimFreePacket = async () => {
  if (!isLoggedIn.value) {
    redirectToLogin()
    return
  }

  if (!isFreePacket.value) {
    toast.add({
      title: 'Bukan paket gratis',
      description:
        'Paket ini membutuhkan pembayaran.',
      color: 'orange'
    })

    return
  }

  isProcessing.value = true

  try {
    await $api(
      '/api/v1/transactions/free',
      {
        method: 'POST',
        body: {
          packetId
        }
      }
    )

    transactionStatus.value = 'PAID'

    toast.add({
      title: 'Paket berhasil diambil',
      description:
        'Paket gratis sudah ditambahkan ke akun Anda.',
      color: 'green'
    })

    /*
     * TUJUAN PAKET GRATIS:
     * tidak ke Paywuz, langsung ke Paket Saya.
     */
    router.push(FREE_PACKAGE_SUCCESS_ROUTE)
  } catch (error) {
    console.error(
      'Gagal mengambil paket gratis:',
      error
    )

    const statusCode =
      error?.response?.status
      || error?.statusCode

    const message =
      error?.data?.message
      || error?.response?._data?.message
      || error?.message
      || 'Gagal mengambil paket gratis.'

    if (statusCode === 409) {
      transactionStatus.value = 'PAID'

      toast.add({
        title: 'Paket sudah dimiliki',
        description:
          'Paket ini sudah tersedia pada akun Anda.',
        color: 'orange'
      })

      router.push(OWNED_PACKAGE_ROUTE)
      return
    }

    toast.add({
      title: 'Gagal',
      description: message,
      color: 'red'
    })
  } finally {
    isProcessing.value = false
  }
}

/*
 * =========================================================
 * SATU PINTU TOMBOL UTAMA
 * =========================================================
 */
const handlePrimaryPurchaseAction = async () => {
  if (!isLoggedIn.value) {
    redirectToLogin()
    return
  }

  const status = String(
    transactionStatus.value || ''
  ).toUpperCase()

  if (status === 'PAID') {
    router.push(OWNED_PACKAGE_ROUTE)
    return
  }

  if (status === 'PENDING') {
    await continuePendingPayment()
    return
  }

  if (isFreePacket.value) {
    await claimFreePacket()
    return
  }

  if (isPaidPacket.value) {
    await openPaymentModal()
    return
  }

  toast.add({
    title: 'Paket tidak valid',
    description:
      'Harga paket tidak valid. Silakan hubungi admin.',
    color: 'red'
  })
}

/*
 * =========================================================
 * METODE PEMBAYARAN PAYWUZ
 * =========================================================
 */
const normalizeText = (value) => {
  return String(value || '')
    .trim()
    .toUpperCase()
}

const getMethodText = (method) => {
  return [
    normalizeText(method?.code),
    normalizeText(method?.name),
    normalizeText(method?.type)
  ].join(' ')
}

const isQrisMethod = (method) => {
  const text = getMethodText(method)

  return text.includes('QRIS')
}

const isVirtualAccountMethod = (method) => {
  const code = normalizeText(method?.code)
  const type = normalizeText(method?.type)
  const text = getMethodText(method)

  return type === 'VIRTUAL_ACCOUNT'
    || type === 'META'
    || code === 'VA'
    || code.endsWith('VA')
    || text.includes('VIRTUAL ACCOUNT')
}

const isEwalletMethod = (method) => {
  const type = normalizeText(method?.type)
  const text = getMethodText(method)

  return type === 'EWALLET'
    || type === 'E_WALLET'
    || text.includes('E-WALLET')
    || text.includes('EWALLET')
    || text.includes('DANA')
    || text.includes('GOPAY')
    || text.includes('SHOPEE')
    || text.includes('OVO')
    || text.includes('LINKAJA')
}

const isRetailMethod = (method) => {
  const type = normalizeText(method?.type)
  const text = getMethodText(method)

  return type === 'RETAIL'
    || text.includes('ALFAMART')
    || text.includes('INDOMARET')
    || text.includes('RETAIL')
}

const groupedPaymentMethods = computed(() => {
  const methods = paymentMethods.value

  const qris = methods.filter(
    isQrisMethod
  )

  const virtualAccounts = methods.filter(method =>
    !isQrisMethod(method)
    && isVirtualAccountMethod(method)
  )

  const ewallets = methods.filter(method =>
    !isQrisMethod(method)
    && !isVirtualAccountMethod(method)
    && isEwalletMethod(method)
  )

  const retail = methods.filter(method =>
    !isQrisMethod(method)
    && !isVirtualAccountMethod(method)
    && !isEwalletMethod(method)
    && isRetailMethod(method)
  )

  const others = methods.filter(method =>
    !isQrisMethod(method)
    && !isVirtualAccountMethod(method)
    && !isEwalletMethod(method)
    && !isRetailMethod(method)
  )

  return [
    {
      key: 'qris',
      title: 'QRIS',
      description:
        'Bayar menggunakan aplikasi yang mendukung QRIS.',
      methods: qris
    },
    {
      key: 'virtual-account',
      title: 'Virtual Account',
      description:
        'Gunakan VA untuk memilih bank di halaman Paywuz.',
      methods: virtualAccounts
    },
    {
      key: 'e-wallet',
      title: 'E-Wallet',
      description:
        'Pilihan dompet digital yang sedang aktif.',
      methods: ewallets
    },
    {
      key: 'retail',
      title: 'Gerai Retail',
      description:
        'Bayar melalui gerai retail yang tersedia.',
      methods: retail
    },
    {
      key: 'other',
      title: 'Metode Pembayaran Lain',
      description:
        'Metode tambahan yang tersedia dari Paywuz.',
      methods: others
    }
  ].filter(group =>
    group.methods.length > 0
  )
})

const getMethodName = (method) => {
  if (
    normalizeText(method?.code) === 'VA'
    || normalizeText(method?.type) === 'META'
  ) {
    return 'Virtual Account — Pilih Bank'
  }

  return method?.name
    || method?.code
    || 'Metode Pembayaran'
}

const getExpiryText = (method) => {
  const minutes = Number(
    method?.expiryMinutes || 0
  )

  if (!minutes) {
    return 'Waktu pembayaran mengikuti ketentuan Paywuz'
  }

  if (minutes % 1440 === 0) {
    const days = minutes / 1440

    return `Berlaku ${days} hari`
  }

  if (minutes % 60 === 0) {
    const hours = minutes / 60

    return `Berlaku ${hours} jam`
  }

  return `Berlaku ${minutes} menit`
}

const getFeeText = () => {
  return 'Tanpa biaya tambahan untuk pembeli'
}

const loadPaymentMethods = async () => {
  /*
   * PENGAMAN:
   * Paket gratis tidak boleh mengambil metode Paywuz.
   */
  if (isFreePacket.value) {
    return
  }

  if (!packet.value || packetPrice.value <= 0) {
    paymentMethodsError.value =
      'Harga paket tidak valid.'

    return
  }

  isLoadingPaymentMethods.value = true
  paymentMethodsError.value = ''

  try {
    const response = await $api(
      '/api/v1/payments/paywuz/methods',
      {
        query: {
          amount: packetPrice.value
        }
      }
    )

    paymentMethods.value =
      Array.isArray(response?.data)
        ? response.data
        : []

    if (paymentMethods.value.length === 0) {
      paymentMethodsError.value =
        'Tidak ada metode pembayaran yang tersedia '
        + 'untuk nominal paket ini.'
    }
  } catch (error) {
    console.error(
      'Gagal memuat metode pembayaran Paywuz:',
      error
    )

    paymentMethodsError.value =
      error?.data?.message
      || error?.response?._data?.message
      || 'Gagal memuat metode pembayaran.'
  } finally {
    isLoadingPaymentMethods.value = false
  }
}

const openPaymentModal = async () => {
  if (!isLoggedIn.value) {
    redirectToLogin()
    return
  }

  /*
   * PENGAMAN:
   * Paket gratis tidak boleh membuka Paywuz.
   */
  if (isFreePacket.value) {
    await claimFreePacket()
    return
  }

  if (!isPaidPacket.value) {
    toast.add({
      title: 'Harga paket tidak valid',
      description:
        'Paket ini tidak dapat diproses pembayaran.',
      color: 'red'
    })

    return
  }

  /*
   * TUJUAN PAKET BERBAYAR:
   * buka modal Paywuz.
   */
  showPaymentModal.value = true

  if (paymentMethods.value.length === 0) {
    await loadPaymentMethods()
  }
}

const closePaymentModal = () => {
  if (isProcessing.value) {
    return
  }

  showPaymentModal.value = false
}

/*
 * =========================================================
 * BUAT TRANSAKSI PAYWUZ
 * =========================================================
 */
const createPayment = async () => {
  if (isFreePacket.value) {
    await claimFreePacket()
    return
  }

  if (!selectedPaymentMethod.value) {
    toast.add({
      title: 'Pilih metode pembayaran',
      description:
        'Silakan pilih salah satu metode pembayaran.',
      color: 'orange'
    })

    return
  }

  isProcessing.value = true

  try {
    const response = await $api(
      '/api/v1/transactions',
      {
        method: 'POST',
        body: {
          packetId,
          paymentMethod:
            selectedPaymentMethod.value.code
        }
      }
    )

    const redirectUrl =
      response?.data?.redirectUrl
      || response?.data?.paymentUrl

    if (!redirectUrl) {
      throw new Error(
        'Link pembayaran tidak ditemukan'
      )
    }

    /*
     * TUJUAN PAKET BERBAYAR:
     * user diarahkan ke halaman Paywuz.
     */
    window.location.href = redirectUrl
  } catch (error) {
    console.error(
      'Gagal membuat transaksi Paywuz:',
      error
    )

    const statusCode =
      error?.response?.status
      || error?.statusCode

    const message =
      error?.data?.message
      || error?.response?._data?.message
      || error?.message
      || 'Gagal membuat halaman pembayaran.'

    if (statusCode === 409) {
      transactionStatus.value = 'PAID'

      toast.add({
        title: 'Paket sudah dimiliki',
        description:
          'Paket ini sudah tersedia pada akun Anda.',
        color: 'orange'
      })

      router.push(OWNED_PACKAGE_ROUTE)
      return
    }

    toast.add({
      title: 'Pembayaran gagal dibuat',
      description: message,
      color: 'red'
    })
  } finally {
    isProcessing.value = false
  }
}

/*
 * =========================================================
 * GENERAL
 * =========================================================
 */
const redirectToLogin = () => {
  toast.add({
    title: 'Silakan Login',
    description:
      'Anda harus login untuk membeli paket.',
    color: 'orange'
  })

  router.push({
    path: '/auth/sign-in',
    query: {
      redirect: route.fullPath
    }
  })
}

const goBack = () => {
  router.back()
}

const benefits = [
  {
    title: 'Akses Fleksibel',
    desc:
      'Kerjakan simulasi di mana saja dan kapan saja.'
  },
  {
    title: 'Pembahasan Setiap Soal',
    desc:
      'Evaluasi hasil tryout dengan penjelasan untuk setiap soal.'
  },
  {
    title: 'Simulasi Berbasis CAT',
    desc:
      'Latih kecepatan dan ketepatan menggunakan sistem ujian terkomputerisasi.'
  },
  {
    title: 'Ranking Nasional',
    desc:
      'Periksa posisi Anda secara nasional.'
  }
]

watch(
  showPaymentModal,
  (isOpen) => {
    if (process.client) {
      document.body.style.overflow =
        isOpen ? 'hidden' : ''
    }
  }
)

onBeforeUnmount(() => {
  if (process.client) {
    document.body.style.overflow = ''
  }
})
</script>

<template>
  <main
    class="min-h-screen py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans transition-colors duration-300 bg-tryout-bg"
  >
    <div
      class="absolute -top-24 -right-24 w-96 h-96 rounded-full pointer-events-none blur-[100px] bg-tryout-primary/8"
    ></div>

    <div
      class="absolute -bottom-24 -left-24 w-96 h-96 rounded-full pointer-events-none blur-[100px] bg-tryout-accent/8"
    ></div>

    <div class="max-w-6xl mx-auto relative z-10">
      <NuxtLink
        to="/paket"
        class="mb-8 flex items-center gap-2 font-medium w-fit transition-colors text-tryout-muted hover:text-tryout-text"
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
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>

        Kembali ke Daftar Paket
      </NuxtLink>

      <!-- Loading -->
      <div
        v-if="isLoading"
        class="rounded-[2rem] p-12 text-center shadow-sm bg-tryout-surface border border-tryout-border"
      >
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-tryout-accent mx-auto"
        ></div>

        <p class="mt-4 font-medium text-tryout-muted">
          Memuat detail paket...
        </p>
      </div>

      <!-- Error -->
      <div
        v-else-if="error"
        class="rounded-[2rem] p-12 text-center shadow-sm bg-tryout-surface border border-tryout-border"
      >
        <div
          class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-red-500/10"
        >
          <svg
            class="w-8 h-8 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h3 class="text-xl font-bold text-tryout-text">
          Paket tidak ditemukan
        </h3>

        <p class="text-sm mt-2 text-tryout-muted">
          Paket mungkin sudah tidak tersedia atau terjadi kesalahan.
        </p>

        <button
          type="button"
          class="mt-8 px-8 py-3 rounded-xl font-bold transition-all border border-tryout-accent/60 text-tryout-accent hover:bg-tryout-accent hover:border-tryout-accent hover:text-white"
          @click="goBack"
        >
          Kembali
        </button>
      </div>

      <!-- Main -->
      <div
        v-else
        class="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        <!-- Left -->
        <div class="lg:col-span-2 space-y-6">
          <div
            class="rounded-[2rem] p-8 md:p-10 relative overflow-hidden shadow-sm bg-tryout-surface border border-tryout-border"
          >
            <div
              class="absolute top-0 right-0 w-32 h-32 rounded-bl-full blur-2xl pointer-events-none bg-tryout-accent/10"
            ></div>

            <div class="flex flex-wrap gap-3 mb-6 relative z-10">
              <span
                class="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase bg-tryout-accent text-white shadow-lg"
              >
                {{ packet.category }}
              </span>

              <span
                v-if="packet.position"
                class="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase bg-tryout-hover border border-tryout-border text-tryout-muted"
              >
                {{ packet.position }}
              </span>
            </div>

            <h1
              class="text-3xl md:text-5xl font-black leading-tight mb-4 relative z-10 text-tryout-text"
            >
              {{ packet.title }}
            </h1>

            <p
              v-if="packet.subCategory"
              class="text-lg font-medium relative z-10 text-tryout-muted"
            >
              {{ packet.subCategory }}
            </p>
          </div>

          <div
            class="rounded-[2rem] p-8 shadow-sm bg-tryout-surface border border-tryout-border"
          >
            <h2
              class="text-2xl font-bold mb-6 flex items-center gap-3 text-tryout-text"
            >
              <span
                class="w-8 h-8 rounded-full flex items-center justify-center bg-tryout-primary/10"
              >
                <svg
                  class="w-4 h-4 text-tryout-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </span>

              Deskripsi Paket
            </h2>

            <p
              class="text-lg leading-relaxed whitespace-pre-line text-tryout-muted"
            >
              {{
                packet.description
                || 'Tidak ada deskripsi spesifik.'
              }}
            </p>
          </div>

          <div
            class="rounded-[2rem] p-8 shadow-sm bg-tryout-hover border border-tryout-border transition-colors"
          >
            <div class="flex items-start gap-4">
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-tryout-primary/10"
              >
                <svg
                  class="w-5 h-5 text-tryout-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>

              <div>
                <h3 class="font-bold text-lg text-tryout-text mb-2">
                  Didukung Teknologi AI
                </h3>

                <p class="text-sm leading-relaxed text-tryout-muted text-justify">
                  Bank soal kami disusun dengan bantuan teknologi AI yang disesuaikan dengan kisi-kisi. Jika Anda
                  menemukan ketidaksesuaian, silakan Laporkan Soal atau diskusikan di grup komunitas Telegram kami.
                </p>
              </div>
            </div>
          </div>

          <div
            class="rounded-[2rem] p-8 shadow-sm bg-tryout-surface border border-tryout-border"
          >
            <h2
              class="text-2xl font-bold mb-8 flex items-center gap-3 text-tryout-text"
            >
              <span
                class="w-8 h-8 rounded-full flex items-center justify-center bg-emerald-500/10"
              >
                <svg
                  class="w-4 h-4 text-emerald-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </span>

              Apa yang Anda Dapatkan
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                v-for="item in benefits"
                :key="item.title"
                class="flex items-start gap-4 p-4 rounded-2xl transition-colors bg-tryout-hover border border-tryout-border hover:border-tryout-accent/40"
              >
                <div
                  class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-tryout-accent/10"
                >
                  <svg
                    class="w-5 h-5 text-tryout-accent"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </div>

                <div>
                  <p class="font-bold text-lg text-tryout-text">
                    {{ item.title }}
                  </p>

                  <p class="text-sm mt-1 text-tryout-muted">
                    {{ item.desc }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right sidebar -->
        <div class="lg:col-span-1">
          <div
            class="rounded-[2rem] p-8 sticky top-24 shadow-sm bg-tryout-surface border border-tryout-border"
          >
            <div class="mb-8">
              <p
                class="text-xs font-bold uppercase tracking-widest mb-3 text-tryout-subtle"
              >
                Investasi Belajar
              </p>

              <p
                class="text-4xl lg:text-5xl font-black tracking-tighter text-tryout-text"
              >
                {{
                  isFreePacket
                    ? 'Gratis'
                    : formatPrice(packet.price)
                }}
              </p>

              <p
                v-if="isFreePacket"
                class="text-xs text-emerald-500 font-semibold mt-3"
              >
                Paket gratis, bisa langsung diambil setelah login
              </p>

              <p
                v-else
                class="text-xs text-emerald-500 font-semibold mt-3"
              >
                Biaya pembayaran ditanggung Nyoba ASN
              </p>
            </div>

            <div class="h-px bg-tryout-divider my-8"></div>

            <div class="space-y-4 mb-8">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-tryout-muted">
                  Kategori
                </span>

                <strong class="text-tryout-text text-right">
                  {{ packet.category }}
                </strong>
              </div>

              <div
                v-if="packet.position"
                class="flex items-center justify-between"
              >
                <span class="text-sm font-medium text-tryout-muted">
                  Posisi Target
                </span>

                <strong class="capitalize text-right text-tryout-text">
                  {{ packet.position }}
                </strong>
              </div>

              <div
                v-if="packet.subCategory"
                class="flex items-center justify-between"
              >
                <span class="text-sm font-medium text-tryout-muted">
                  Fokus Materi
                </span>

                <strong class="text-right text-tryout-text">
                  {{ packet.subCategory }}
                </strong>
              </div>
            </div>

            <div class="mb-4">
              <div
                v-if="isLoadingStatus"
                class="w-full py-4 rounded-2xl flex items-center justify-center animate-pulse bg-tryout-skeleton border border-tryout-border"
              >
                <span
                  class="text-sm font-bold tracking-widest uppercase text-tryout-subtle"
                >
                  Mengecek status...
                </span>
              </div>

              <template v-else>
                <!-- Paid -->
                <button
                  v-if="transactionStatus === 'PAID'"
                  type="button"
                  class="w-full font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-3 text-sm uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
                  @click="router.push(OWNED_PACKAGE_ROUTE)"
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>

                  Paket Sudah Dimiliki
                </button>

                <!-- Pending -->
                <div
                  v-else-if="transactionStatus === 'PENDING'"
                  class="space-y-3"
                >
                  <button
                    type="button"
                    :disabled="isProcessing"
                    class="w-full font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-3 text-sm uppercase tracking-widest transition-all disabled:opacity-70 bg-tryout-accent hover:opacity-90 text-white"
                    @click="handlePrimaryPurchaseAction"
                  >
                    <div
                      v-if="isProcessing"
                      class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"
                    ></div>

                    <span>
                      {{
                        isProcessing
                          ? 'Membuka...'
                          : 'Lanjutkan Pembayaran'
                      }}
                    </span>
                  </button>

                  <div
                    class="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3"
                  >
                    <p
                      class="text-xs leading-relaxed text-amber-700 dark:text-amber-400"
                    >
                      Metode:
                      <strong>
                        {{ existingPaymentMethod || '-' }}
                      </strong>
                    </p>

                    <p
                      v-if="expiredAt"
                      class="text-xs leading-relaxed text-amber-700 dark:text-amber-400 mt-1"
                    >
                      Batas pembayaran:
                      <strong>
                        {{ formatDate(expiredAt) }}
                      </strong>
                    </p>
                  </div>
                </div>

                <!-- Available -->
                <button
                  v-else
                  type="button"
                  :disabled="isProcessing"
                  class="w-full font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-3 text-sm uppercase tracking-widest transition-all disabled:opacity-70 text-white"
                  :class="
                    isFreePacket
                      ? 'bg-emerald-500 hover:bg-emerald-600'
                      : 'bg-tryout-accent hover:opacity-90'
                  "
                  @click="handlePrimaryPurchaseAction"
                >
                  <div
                    v-if="isProcessing"
                    class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"
                  ></div>

                  <span>
                    {{
                      isProcessing
                        ? (
                          isFreePacket
                            ? 'Mengambil Paket...'
                            : 'Memproses...'
                        )
                        : (
                          isFreePacket
                            ? 'Ambil Gratis'
                            : 'Pilih Metode Pembayaran'
                        )
                    }}
                  </span>
                </button>
              </template>
            </div>

            <div class="pt-8 mt-4 border-t border-tryout-divider">
              <div class="flex items-start gap-4">
                <div
                  class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-tryout-hover"
                >
                  <svg
                    class="w-5 h-5 text-tryout-accent"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>

                <div>
                  <p class="font-bold text-sm text-tryout-text mb-2">
                    Informasi Hak Akses &amp; Masa Aktif
                  </p>

                  <div
                    class="text-xs leading-relaxed space-y-2 text-justify text-tryout-muted"
                  >
                    <p>
                      1. Pembayaran atau klaim gratis memberikan
                      <strong class="text-tryout-text">
                        hak akses layanan tryout online
                      </strong>,
                      bukan kepemilikan soal atau materi PDF.
                    </p>

                    <p>
                      2.
                      <strong class="text-tryout-text">
                        Masa Aktif:
                      </strong>
                      akses berlaku selama periode seleksi
                      CASN yang sedang berlangsung.
                    </p>

                    <p v-if="!isFreePacket">
                      <!-- 3. Pengguna membayar sesuai harga paket.
                      Biaya layanan pembayaran ditanggung Nyoba ASN. -->
                    </p>

                    <p v-else>
                      <!-- 3. Paket ini gratis dan dapat langsung digunakan setelah berhasil diklaim. -->
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- =====================================================
         MODAL PAYMENT METHOD PAYWUZ
         ===================================================== -->
    <Teleport to="body">
      <Transition name="payment-modal">
        <div
          v-if="showPaymentModal"
          class="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            class="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            aria-label="Tutup pilihan pembayaran"
            @click="closePaymentModal"
          ></button>

          <div
            class="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-tryout-border bg-tryout-surface shadow-2xl"
          >
            <header
              class="flex items-start justify-between gap-4 border-b border-tryout-border px-5 py-5 sm:px-7"
            >
              <div>
                <p
                  class="text-xs font-black uppercase tracking-[0.2em] text-tryout-accent"
                >
                  Pembayaran Paywuz
                </p>

                <h2
                  class="mt-1 text-xl font-black text-tryout-text sm:text-2xl"
                >
                  Pilih Metode Pembayaran
                </h2>

                <p class="mt-1 text-sm text-tryout-muted">
                  Total yang Anda bayar:

                  <strong class="text-tryout-text">
                    {{ formatPrice(packet?.price) }}
                  </strong>
                </p>

                <p class="mt-1 text-xs font-semibold text-emerald-500">
                  Tidak ada tambahan biaya pembayaran untuk pembeli
                </p>
              </div>

              <button
                type="button"
                :disabled="isProcessing"
                class="grid h-10 w-10 flex-none place-items-center rounded-xl border border-tryout-border text-tryout-muted transition hover:bg-tryout-hover hover:text-tryout-text disabled:opacity-50"
                aria-label="Tutup"
                @click="closePaymentModal"
              >
                <svg
                  class="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </header>

            <div class="overflow-y-auto px-5 py-5 sm:px-7">
              <div
                v-if="isLoadingPaymentMethods"
                class="flex flex-col items-center justify-center py-16"
              >
                <div
                  class="h-10 w-10 animate-spin rounded-full border-4 border-tryout-border border-t-tryout-accent"
                ></div>

                <p class="mt-4 text-sm font-semibold text-tryout-muted">
                  Memuat metode pembayaran...
                </p>
              </div>

              <div
                v-else-if="paymentMethodsError"
                class="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-center"
              >
                <p class="font-bold text-red-500">
                  {{ paymentMethodsError }}
                </p>

                <button
                  type="button"
                  class="mt-4 rounded-xl bg-tryout-accent px-5 py-2.5 text-sm font-bold text-white"
                  @click="loadPaymentMethods"
                >
                  Muat Ulang
                </button>
              </div>

              <div
                v-else
                class="space-y-8"
              >
                <section
                  v-for="group in groupedPaymentMethods"
                  :key="group.key"
                >
                  <div class="mb-3">
                    <h3 class="font-black text-tryout-text">
                      {{ group.title }}
                    </h3>

                    <p class="mt-1 text-xs text-tryout-muted">
                      {{ group.description }}
                    </p>
                  </div>

                  <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      v-for="method in group.methods"
                      :key="method.code"
                      type="button"
                      class="flex min-h-[108px] items-center gap-4 rounded-2xl border p-4 text-left transition"
                      :class="
                        selectedPaymentMethod?.code === method.code
                          ? 'border-tryout-accent bg-tryout-accent/10 ring-2 ring-tryout-accent/20'
                          : 'border-tryout-border bg-tryout-bg hover:border-tryout-accent/60 hover:bg-tryout-hover'
                      "
                      @click="selectedPaymentMethod = method"
                    >
                      <div
                        class="grid h-14 w-14 flex-none place-items-center rounded-xl border border-tryout-border bg-white px-2"
                      >
                        <span
                          class="text-xs font-black text-slate-700 text-center break-all"
                        >
                          {{ method.code }}
                        </span>
                      </div>

                      <div class="min-w-0 flex-1">
                        <p class="font-extrabold text-tryout-text">
                          {{ getMethodName(method) }}
                        </p>

                        <p class="mt-1 text-xs font-semibold text-emerald-500">
                          {{ getFeeText(method) }}
                        </p>

                        <p class="mt-1 text-[11px] text-tryout-muted">
                          {{ getExpiryText(method) }}
                        </p>
                      </div>

                      <div
                        class="grid h-5 w-5 flex-none place-items-center rounded-full border"
                        :class="
                          selectedPaymentMethod?.code === method.code
                            ? 'border-tryout-accent bg-tryout-accent text-white'
                            : 'border-tryout-border'
                        "
                      >
                        <svg
                          v-if="
                            selectedPaymentMethod?.code
                            === method.code
                          "
                          class="h-3.5 w-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="3"
                            d="m5 12 4 4L19 6"
                          />
                        </svg>
                      </div>
                    </button>
                  </div>
                </section>
              </div>
            </div>

            <footer
              class="border-t border-tryout-border bg-tryout-bg/80 px-5 py-4 sm:px-7"
            >
              <button
                type="button"
                :disabled="
                  isProcessing
                  || isLoadingPaymentMethods
                  || !selectedPaymentMethod
                "
                class="flex w-full items-center justify-center gap-3 rounded-2xl bg-tryout-accent px-6 py-4 text-sm font-black uppercase tracking-widest text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                @click="createPayment"
              >
                <span
                  v-if="isProcessing"
                  class="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white"
                ></span>

                {{
                  isProcessing
                    ? 'Membuat Pembayaran...'
                    : 'Lanjutkan ke Paywuz'
                }}
              </button>

              <p
                class="mt-3 text-center text-[11px] leading-relaxed text-tryout-muted"
              >
                Setelah melanjutkan, Anda akan diarahkan
                ke halaman aman Paywuz untuk menyelesaikan
                pembayaran.
              </p>
            </footer>
          </div>
        </div>
      </Transition>
    </Teleport>
  </main>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');

.font-sans {
  font-family: 'Plus Jakarta Sans', sans-serif;
}

.payment-modal-enter-active,
.payment-modal-leave-active {
  transition: opacity 0.2s ease;
}

.payment-modal-enter-from,
.payment-modal-leave-to {
  opacity: 0;
}
</style>