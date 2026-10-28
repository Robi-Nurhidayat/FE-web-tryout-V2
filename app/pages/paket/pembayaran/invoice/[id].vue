<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'

definePageMeta({ layout: 'landing' })

const route = useRoute()
const router = useRouter()
const { authToken, isLoggedIn } = useAuthUser()
const config = useRuntimeConfig()
const toast = useToast()
const { savePaymentInfo, getPaymentInfo, clearVa, cleanExpired } = useVaCache()
const packetId = route.params.id

// ✅ Baca field RINGAN dari query params
const fromQuery = {
  paymentType: route.query.paymentType || '',
  vaNumber: route.query.va || '',
  bankName: route.query.bank || '',
  paymentCode: route.query.paymentCode || '',
}

const invoiceData = ref(null)
const isLoading = ref(true)
const isError = ref(false)
const errorMessage = ref('')
const isCopied = ref(false)
const isPolling = ref(false)
const isJustExpired = ref(false)

const totalSeconds = ref(0)
const remainingSeconds = ref(0)
let timerInterval = null
let pollingInterval = null
const MAX_POLL_ATTEMPTS = 10
let pollAttempts = 0

// =============================================
// COMPUTED
// =============================================
const paymentType = computed(() => invoiceData.value?.paymentType || '')
const isVaPayment = computed(() => ['bank_transfer', 'echannel'].includes(paymentType.value) || (!paymentType.value && !!invoiceData.value?.vaNumber))
const isQrisPayment = computed(() => paymentType.value === 'qris')
const isEwalletPayment = computed(() => ['gopay', 'shopeepay', 'other_qris', 'ewallet'].includes(paymentType.value))
const isCstorePayment = computed(() => paymentType.value === 'cstore')

const hasAnyPaymentInfo = computed(() => {
  if (!invoiceData.value) return false
  return !!(invoiceData.value.vaNumber || invoiceData.value.qrString || invoiceData.value.paymentCode || invoiceData.value.paymentUrl)
})

// QR image URL — jika qrString adalah URL langsung pakai, jika raw data generate via API
const qrImageUrl = computed(() => {
  const qr = invoiceData.value?.qrString
  if (!qr) return ''
  if (qr.startsWith('http')) return qr
  // Generate QR dari raw string menggunakan API publik
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encodeURIComponent(qr)}`
})

// =============================================
// COUNTDOWN — menggunakan expiredAt dari data
// =============================================
const countdownDisplay = computed(() => {
  if (remainingSeconds.value <= 0) return { hours: '00', minutes: '00', seconds: '00', expired: true }
  const h = Math.floor(remainingSeconds.value / 3600)
  const m = Math.floor((remainingSeconds.value % 3600) / 60)
  const s = remainingSeconds.value % 60
  const pad = (n) => String(n).padStart(2, '0')
  return { hours: pad(h), minutes: pad(m), seconds: pad(s), expired: false }
})

const progressPercent = computed(() => {
  if (!totalSeconds.value) return 0
  return Math.max(0, Math.min(100, (remainingSeconds.value / totalSeconds.value) * 100))
})

const progressColor = computed(() => {
  const p = progressPercent.value
  if (p > 50) return '#22c55e'
  if (p > 20) return '#f59e0b'
  return '#ef4444'
})

const startCountdown = (expiryDateString) => {
  if (!expiryDateString) return
  const expiryTime = new Date(expiryDateString).getTime()
  const diff = Math.floor((expiryTime - Date.now()) / 1000)
  totalSeconds.value = diff > 0 ? diff : 0
  remainingSeconds.value = totalSeconds.value
  if (timerInterval) clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    remainingSeconds.value = Math.max(0, remainingSeconds.value - 1)
    if (remainingSeconds.value <= 0) {
      clearInterval(timerInterval)
      isJustExpired.value = true
      clearVa(packetId)
    }
  }, 1000)
}

// =============================================
// POLLING — hanya untuk VA/cstore yang bisa masuk via webhook
// QRIS tidak perlu polling karena data sudah di sessionStorage
// =============================================
const stopPolling = () => {
  if (pollingInterval) { clearInterval(pollingInterval); pollingInterval = null }
  isPolling.value = false
  pollAttempts = 0
}

const startPolling = () => {
  if (pollingInterval) return
  isPolling.value = true
  pollAttempts = 0
  pollingInterval = setInterval(async () => {
    pollAttempts++
    if (hasAnyPaymentInfo.value || pollAttempts >= MAX_POLL_ATTEMPTS) { stopPolling(); return }
    try {
      const res = await $fetch(`/api/v1/transactions/invoice/${packetId}`, {
        baseURL: config.public.apiBaseUrl,
        method: 'GET',
        headers: { Authorization: authToken.value }
      })
      const data = res?.data || null
      if (data && (data.vaNumber || data.paymentCode)) {
        invoiceData.value = { ...invoiceData.value, ...data }
        savePaymentInfo(packetId, { ...invoiceData.value, ...data }, data.expiredAt || invoiceData.value?.expiredAt)
        stopPolling()
      }
    } catch {}
  }, 3000)
}

// =============================================
// FETCH INVOICE
// =============================================
const fetchInvoiceDetail = async (silent = false) => {
  if (!isLoggedIn.value) { router.push('/auth/sign-in'); return }
  if (!silent) isLoading.value = true
  isError.value = false

  try {
    const res = await $fetch(`/api/v1/transactions/invoice/${packetId}`, {
      baseURL: config.public.apiBaseUrl,
      method: 'GET',
      headers: { Authorization: authToken.value }
    })
    let data = { ...(res?.data || {}) }

    // ✅ PRIORITAS PENGISIAN DATA PEMBAYARAN:
    // 1. DB (paling akurat untuk VA/cstore)
    // 2. sessionStorage (untuk QRIS/e-wallet yang tidak masuk webhook)
    // 3. query params (fallback ringan)

    const dbHasPaymentInfo = !!(data.vaNumber || data.qrString || data.paymentCode || data.paymentUrl)

    if (!dbHasPaymentInfo) {
      // Coba dari cache (sessionStorage berisi QR string, localStorage berisi VA)
      const cached = getPaymentInfo(packetId)
      if (cached) {
        data = {
          ...data,
          paymentType: cached.paymentType || fromQuery.paymentType || data.paymentType,
          vaNumber: cached.vaNumber || fromQuery.vaNumber || data.vaNumber,
          bankName: cached.bankName || fromQuery.bankName || data.bankName,
          qrString: cached.qrString || data.qrString,
          paymentUrl: cached.paymentUrl || data.paymentUrl,
          paymentCode: cached.paymentCode || fromQuery.paymentCode || data.paymentCode,
        }
      } else {
        // Fallback ke query params
        data = {
          ...data,
          paymentType: fromQuery.paymentType || data.paymentType,
          vaNumber: fromQuery.vaNumber || data.vaNumber,
          bankName: fromQuery.bankName || data.bankName,
          paymentCode: fromQuery.paymentCode || data.paymentCode,
        }
      }
    }

    // Simpan kembali ke cache jika ada info baru
    if (data.vaNumber || data.qrString || data.paymentCode || data.paymentUrl) {
      savePaymentInfo(packetId, data, data.expiredAt)
    }

    invoiceData.value = data

    // ✅ Gunakan expiredAt dari data (sudah benar per metode)
    if (invoiceData.value?.expiredAt) startCountdown(invoiceData.value.expiredAt)

    // Polling hanya untuk VA/cstore yang bisa masuk via webhook
    // QRIS tidak perlu polling
    const needsPolling = !dbHasPaymentInfo &&
      !data.qrString && !data.paymentUrl &&
      ['bank_transfer', 'echannel', 'cstore', ''].includes(data.paymentType || '')
    if (needsPolling) startPolling()

  } catch (err) {
    if (!silent) {
      isError.value = true
      errorMessage.value = err.response?.status === 404
        ? 'Tagihan tidak ditemukan. Mungkin sudah kedaluwarsa atau telah dibatalkan.'
        : 'Gagal memuat rincian tagihan.'
    }
  } finally {
    if (!silent) isLoading.value = false
  }
}

const handleManualRefresh = async () => {
  stopPolling()
  isJustExpired.value = false
  await fetchInvoiceDetail()
}

onMounted(() => { cleanExpired(); fetchInvoiceDetail() })
onBeforeUnmount(() => { if (timerInterval) clearInterval(timerInterval); stopPolling() })

const formatPrice = (price) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price || 0)

const formatDateTime = (d) => {
  if (!d) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }).format(new Date(d)) + ' WIB'
}

const copyToClipboard = async (text) => {
  if (!text || isCopied.value) return
  try {
    await navigator.clipboard.writeText(text)
    isCopied.value = true
    toast.add({ title: 'Disalin!', description: 'Berhasil disalin.', color: 'green' })
    setTimeout(() => { isCopied.value = false }, 2000)
  } catch {
    toast.add({ title: 'Gagal', description: 'Silakan salin manual.', color: 'red' })
  }
}
</script>

<template>
  <main class="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 flex flex-col items-center font-sans pt-24">
    <div class="mb-8 text-center">
      <h1 class="text-2xl font-black text-slate-900 tracking-tight">Selesaikan Pembayaran</h1>
      <p class="text-slate-500 text-sm mt-1">Invoice Tryout Premium</p>
    </div>

    <div class="w-full max-w-md bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 overflow-hidden">

      <div v-if="isLoading" class="p-12 flex flex-col items-center justify-center min-h-[400px]">
        <div class="w-12 h-12 border-4 border-slate-100 border-t-orange-500 rounded-full animate-spin mb-4"></div>
        <p class="text-slate-500 font-medium text-sm">Mengambil data tagihan...</p>
      </div>

      <div v-else-if="isError" class="p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
        <div class="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </div>
        <h3 class="text-lg font-bold text-slate-900 mb-2">Tagihan Tidak Tersedia</h3>
        <p class="text-slate-500 text-sm mb-6">{{ errorMessage }}</p>
        <button @click="router.push('/paket')" class="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition">Lihat Daftar Paket</button>
      </div>

      <div v-else>
        <div v-if="isJustExpired" class="bg-red-500 text-white p-5 text-center">
          <p class="font-black text-lg tracking-wide">TAGIHAN KEDALUWARSA</p>
          <p class="text-red-100 text-sm mt-1">Waktu pembayaran telah habis. Silakan buat tagihan baru.</p>
          <button @click="router.push(`/paket/${packetId}/detail`)" class="mt-4 px-6 py-2 bg-white text-red-600 font-bold rounded-xl text-sm hover:bg-red-50 transition">Beli Ulang</button>
        </div>

        <div v-else class="bg-orange-500 text-white p-6 text-center relative overflow-hidden">
          <div class="absolute -right-10 -top-10 w-32 h-32 bg-white opacity-10 rounded-full"></div>
          <p class="text-orange-100 text-xs font-bold uppercase tracking-wider mb-3">Sisa Waktu Pembayaran</p>
          <div v-if="!countdownDisplay.expired" class="flex items-center justify-center gap-2">
            <div class="bg-white/20 px-3 py-2 rounded-lg min-w-[3.2rem] text-center">
              <span class="text-3xl font-black font-mono block leading-none">{{ countdownDisplay.hours }}</span>
              <span class="text-orange-200 text-[10px] font-bold uppercase tracking-widest mt-1 block">Jam</span>
            </div>
            <span class="text-2xl font-bold opacity-60 mb-4">:</span>
            <div class="bg-white/20 px-3 py-2 rounded-lg min-w-[3.2rem] text-center">
              <span class="text-3xl font-black font-mono block leading-none">{{ countdownDisplay.minutes }}</span>
              <span class="text-orange-200 text-[10px] font-bold uppercase tracking-widest mt-1 block">Menit</span>
            </div>
            <span class="text-2xl font-bold opacity-60 mb-4">:</span>
            <div class="bg-white/20 px-3 py-2 rounded-lg min-w-[3.2rem] text-center">
              <span class="text-3xl font-black font-mono block leading-none">{{ countdownDisplay.seconds }}</span>
              <span class="text-orange-200 text-[10px] font-bold uppercase tracking-widest mt-1 block">Detik</span>
            </div>
          </div>
          <div class="mt-4 w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
            <div class="h-full rounded-full transition-all duration-1000" :style="{ width: progressPercent + '%', background: progressColor }" />
          </div>
          <p class="text-orange-200 text-xs mt-3">Batas Akhir: {{ formatDateTime(invoiceData?.expiredAt) }}</p>
        </div>

        <div class="p-6 text-center border-b border-slate-100">
          <p class="text-slate-500 text-sm font-medium mb-1">Total Tagihan</p>
          <p class="text-4xl font-black text-slate-900 tracking-tight">{{ formatPrice(invoiceData?.grossAmount) }}</p>
          <div class="mt-3 flex items-center justify-center gap-2">
            <span class="text-xs text-slate-400">Order ID:</span>
            <span class="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md font-mono">{{ invoiceData?.orderId }}</span>
          </div>
        </div>

        <div class="relative flex items-center px-6">
          <div class="absolute -left-3 w-6 h-6 bg-slate-50 rounded-full border border-slate-100"></div>
          <div class="w-full border-t-2 border-dashed border-slate-200"></div>
          <div class="absolute -right-3 w-6 h-6 bg-slate-50 rounded-full border border-slate-100"></div>
        </div>

        <div class="p-6">
          <template v-if="!isJustExpired">

            <div v-if="hasAnyPaymentInfo && isVaPayment">
              <p class="text-slate-500 text-sm font-medium mb-4">Lakukan transfer ke:</p>
              <div class="flex items-center gap-3 mb-4">
                <div class="w-12 h-12 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center">
                  <span class="font-black text-slate-700 text-xs tracking-wider">{{ invoiceData?.bankName?.substring(0,3) || 'VA' }}</span>
                </div>
                <div>
                  <p class="font-bold text-slate-900 text-lg uppercase">{{ invoiceData?.bankName || 'Virtual Account' }}</p>
                  <p class="text-xs text-slate-400">Virtual Account</p>
                </div>
              </div>
              <div class="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <p class="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Nomor Virtual Account</p>
                <div class="flex items-center justify-between gap-3 flex-wrap">
                  <p class="text-2xl font-black font-mono text-orange-600 tracking-widest break-all">{{ invoiceData?.vaNumber }}</p>
                  <button @click="copyToClipboard(invoiceData?.vaNumber)"
                    class="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold border transition-all"
                    :class="isCopied ? 'bg-green-50 border-green-400 text-green-600' : 'bg-white border-slate-200 text-slate-600 hover:border-orange-400 hover:text-orange-600'">
                    {{ isCopied ? '✓ Disalin' : 'Salin' }}
                  </button>
                </div>
              </div>
              <p class="text-xs text-slate-400 mt-4 text-center">Pastikan nama penerima adalah <strong class="text-slate-600">Midtrans / Programmer Pagi</strong>.</p>
            </div>

            <div v-else-if="hasAnyPaymentInfo && isQrisPayment" class="text-center">
              <p class="text-slate-500 text-sm font-medium mb-4">Scan QR Code berikut untuk membayar:</p>
              <div class="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col items-center gap-4">
                <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <img
                    v-if="qrImageUrl"
                    :src="qrImageUrl"
                    alt="QR Code Pembayaran"
                    class="w-52 h-52 object-contain"
                    @error="(e) => e.target.style.display='none'"
                  />
                  <div v-else class="w-52 h-52 flex items-center justify-center text-slate-400">
                    <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h2m0-4H4m2 8H4M4 4h4v4H4V4zm12 0h4v4h-4V4zM4 16h4v4H4v-4z" />
                    </svg>
                  </div>
                </div>
                <div class="text-center">
                  <p class="text-xs text-slate-500 font-medium">Scan dengan aplikasi mobile banking atau e-wallet Anda</p>
                  <p class="text-xs text-orange-500 font-bold mt-1">QR berlaku 15 menit</p>
                </div>
              </div>
            </div>

            <div v-else-if="hasAnyPaymentInfo && isEwalletPayment" class="text-center">
              <p class="text-slate-500 text-sm font-medium mb-4">Selesaikan pembayaran via {{ invoiceData?.bankName }}:</p>
              <div class="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col items-center gap-4">
                <div v-if="invoiceData?.qrString" class="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <img
                    :src="invoiceData.qrString.startsWith('http')
                      ? invoiceData.qrString
                      : `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=${encodeURIComponent(invoiceData.qrString)}`"
                    alt="QR Code"
                    class="w-48 h-48 object-contain"
                  />
                </div>
                <a v-if="invoiceData?.paymentUrl"
                  :href="invoiceData.paymentUrl"
                  target="_blank"
                  class="w-full py-3 bg-orange-500 text-white font-bold rounded-xl text-center hover:bg-orange-600 transition-colors text-sm">
                  Buka Aplikasi {{ invoiceData?.bankName }}
                </a>
              </div>
            </div>

            <div v-else-if="hasAnyPaymentInfo && isCstorePayment">
              <p class="text-slate-500 text-sm font-medium mb-4">Bayar di {{ invoiceData?.bankName }}:</p>
              <div class="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <p class="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Kode Pembayaran</p>
                <div class="flex items-center justify-between gap-3 flex-wrap">
                  <p class="text-2xl font-black font-mono text-orange-600 tracking-widest break-all">{{ invoiceData?.paymentCode }}</p>
                  <button @click="copyToClipboard(invoiceData?.paymentCode)"
                    class="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold border transition-all"
                    :class="isCopied ? 'bg-green-50 border-green-400 text-green-600' : 'bg-white border-slate-200 text-slate-600 hover:border-orange-400 hover:text-orange-600'">
                    {{ isCopied ? '✓ Disalin' : 'Salin' }}
                  </button>
                </div>
              </div>
              <p class="text-xs text-slate-400 mt-4 text-center">Tunjukkan kode ini ke kasir {{ invoiceData?.bankName }}.</p>
            </div>

            <div v-else class="text-center py-6">
              <div class="inline-flex items-center justify-center w-16 h-16 bg-orange-50 rounded-full mb-4">
                <div v-if="isPolling" class="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
                <svg v-else class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p class="text-slate-800 font-bold mb-1">Menunggu Data Pembayaran</p>
              <p class="text-xs text-slate-400 mb-2">
                {{ isPolling ? `Mengambil data... (${pollAttempts}/${MAX_POLL_ATTEMPTS})` : 'Data pembayaran belum tersedia.' }}
              </p>
              <p class="text-xs text-slate-400">Silakan muat ulang halaman ini.</p>
            </div>

          </template>

          <template v-else>
            <div class="text-center py-4">
              <p class="text-slate-400 text-sm">Tagihan ini sudah tidak dapat dibayar.</p>
              <button @click="router.push('/transaksi')" class="mt-3 text-orange-500 text-sm font-bold hover:underline">Lihat Riwayat Transaksi</button>
            </div>
          </template>
        </div>

        <div class="bg-slate-50 p-6 flex flex-col gap-3 border-t border-slate-100">
          <button v-if="!isJustExpired" @click="handleManualRefresh"
            class="w-full py-3.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors shadow-[0_4px_14px_rgba(249,115,22,0.25)] flex items-center justify-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Cek Status Pembayaran
          </button>
          <button @click="router.push(`/paket/${packetId}/detail`)"
            class="w-full py-3.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors">
            Kembali ke Paket
          </button>
        </div>
      </div>
    </div>

    <div class="mt-8 flex items-center justify-center gap-2 text-slate-400">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
      <span class="text-xs font-semibold tracking-wide">Secure Payment by Midtrans</span>
    </div>
  </main>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
.font-sans { font-family: 'Plus Jakarta Sans', sans-serif; }
.font-mono { font-family: 'DM Mono', monospace; }
</style>