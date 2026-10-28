<script setup>
import { computed } from 'vue'

definePageMeta({
  layout: 'default'
})

// Gunakan config untuk base URL (seperti di Profil)
const config = useRuntimeConfig()
const { user, authToken } = useAuthUser() 
const { $api } = useNuxtApp()

// Pastikan Anda sudah memanggil $api dari useNuxtApp() di bagian atas script Anda
// const { $api } = useNuxtApp()

const { data: response, pending, error, refresh } = await useAsyncData(
  'user-dashboard',
  () => $api('/api/v1/users/dashboard', { method: 'GET' }),
  { server: false, lazy: true }
)

// Computed properties (Lebih simpel untuk MVP)
const dashboardData = computed(() => response.value?.data || {})
const totalOwnedPackets = computed(() => dashboardData.value?.totalOwnedPackets || 0)
const totalCompletedTryouts = computed(() => dashboardData.value?.totalCompletedTryouts || 0)
const hasPendingTransaction = computed(() => dashboardData.value?.hasPendingTransaction || false)

</script>

<template>
  <!-- SKELETON LOADING -->
  <div v-if="pending" class="min-h-screen bg-tryout-bg flex items-center justify-center">
    <div class="flex flex-col items-center gap-3">
      <i class="pi pi-spin pi-spinner text-4xl text-tryout-primary"></i>
      <p class="text-tryout-muted font-medium">Memuat dashboard...</p>
    </div>
  </div>

  <!-- ERROR STATE -->
  <div v-else-if="error" class="min-h-screen bg-tryout-bg flex items-center justify-center">
    <div class="bg-tryout-surface p-8 rounded-2xl shadow-sm border border-tryout-border text-center max-w-md mx-4">
      <i class="pi pi-exclamation-triangle text-4xl text-red-500 mb-4"></i>
      <h2 class="text-xl font-bold text-tryout-text mb-2">Gagal Memuat Data</h2>
      <p class="text-tryout-muted text-sm">{{ error?.data?.message || error.message || 'Terjadi kesalahan jaringan.' }}</p>
    </div>
  </div>

  <!-- MAIN DASHBOARD CONTENT -->
  <main v-else class="min-h-screen bg-tryout-bg py-10 px-4 sm:px-6 lg:px-8 font-sans">
    <div class="max-w-4xl mx-auto"> <!-- Lebar diperkecil ke 4xl karena elemennya sedikit -->

      <!-- BANNERS NOTIFIKASI -->
      <div class="mb-6 space-y-3">
        <!-- Banner Transaksi Pending -->
        <div v-if="hasPendingTransaction" class="bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400 p-4 rounded-xl flex items-center gap-3 shadow-sm">
          <i class="pi pi-wallet text-lg"></i>
          <div class="flex-1">
            <p class="text-sm font-bold">Ada tagihan yang menunggu pembayaran.</p>
          </div>
          <NuxtLink to="/transaksi" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm whitespace-nowrap">
            Bayar Sekarang
          </NuxtLink>
        </div>
      </div>

      <!-- HEADER WELCOME -->
      <div class="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-tryout-text mb-1">
            Halo, {{ user?.username || 'Peserta' }}! 👋
          </h1>
          <p class="text-tryout-muted text-sm">
            Selamat datang kembali. Mari lanjutkan belajarmu hari ini!
          </p>
        </div>
        <NuxtLink 
          to="/paket" 
          class="inline-flex items-center gap-2 px-5 py-2.5 bg-tryout-surface border border-tryout-border text-tryout-text font-semibold rounded-lg hover:bg-tryout-hover transition shadow-sm text-sm active:scale-95"
        >
          <i class="pi pi-search text-tryout-primary"></i> Cari Paket Baru
        </NuxtLink>
      </div>

      <!-- KARTU STATISTIK (Hanya 2, menggunakan grid 2 kolom) -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        
        <div class="bg-tryout-surface rounded-2xl p-6 shadow-sm border border-tryout-border flex items-center gap-5 hover:shadow-md transition">
          <div class="w-14 h-14 rounded-full bg-tryout-primary/10 flex items-center justify-center text-tryout-primary text-2xl">
            <i class="pi pi-box"></i>
          </div>
          <div>
            <p class="text-sm text-tryout-muted font-medium mb-1">Paket Dimiliki</p>
            <h3 class="text-3xl font-bold text-tryout-text">{{ totalOwnedPackets }}</h3>
          </div>
        </div>

        <div class="bg-tryout-surface rounded-2xl p-6 shadow-sm border border-tryout-border flex items-center gap-5 hover:shadow-md transition">
          <div class="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-2xl">
            <i class="pi pi-check-square"></i>
          </div>
          <div>
            <p class="text-sm text-tryout-muted font-medium mb-1">Total Pengerjaan</p>
            <h3 class="text-3xl font-bold text-tryout-text">{{ totalCompletedTryouts }}</h3>
          </div>
        </div>

      </div>

      <!-- AKSES CEPAT & TRANSAKSI -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <!-- Akses Cepat -->
        <div class="bg-tryout-primary rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
          <div class="absolute -right-6 -top-6 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
          
          <h2 class="text-lg font-bold mb-4 flex items-center gap-2 relative z-10">
            <i class="pi pi-bolt text-yellow-400"></i> Akses Cepat
          </h2>
          <div class="space-y-3 relative z-10">
            <NuxtLink to="/my-packets" class="flex items-center justify-between p-3 rounded-xl bg-black/20 hover:bg-black/30 transition group">
              <span class="font-medium text-sm">Paket Ujian Saya</span>
              <i class="pi pi-arrow-right text-xs group-hover:translate-x-1 transition-transform"></i>
            </NuxtLink>
            <NuxtLink to="/transaksi" class="flex items-center justify-between p-3 rounded-xl bg-black/20 hover:bg-black/30 transition group">
              <span class="font-medium text-sm">Riwayat Transaksi</span>
              <i class="pi pi-arrow-right text-xs group-hover:translate-x-1 transition-transform"></i>
            </NuxtLink>
          </div>
        </div>

        <!-- Transaksi Sukses (Menggantikan Butuh Bantuan) -->
        <div class="bg-tryout-surface rounded-2xl p-6 shadow-sm border border-tryout-border flex items-center gap-5 hover:border-tryout-primary transition-colors h-full">
          <div class="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 text-2xl flex-shrink-0">
            <i class="pi pi-receipt"></i>
          </div>
          <div>
            <p class="text-sm text-tryout-muted font-medium mb-1">Transaksi Sukses</p>
            <!-- Menggunakan trik variabel totalOwnedPackets sesuai ide Anda -->
            <h3 class="text-3xl font-bold text-tryout-text">{{ totalOwnedPackets }}</h3>
          </div>
        </div>

      </div>

    </div>
  </main>
</template>