<script setup>
import { computed } from 'vue'

definePageMeta({
  layout: 'admin',
  middleware: ['auth']
})

const { $api } = useNuxtApp()

const { data: dashboardResponse, pending: loading } = await useAsyncData(
  'admin-dashboard',
  () => $api('/api/v1/admin/dashboard')
)

const dashboard = computed(() => dashboardResponse.value?.data || {})
const stats = computed(() => dashboard.value.stats || {})
const packetSales = computed(() => dashboard.value.packetSales || [])

const formatRupiah = (amount) => {
  if (!amount) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount)
}

const formatNumber = (num) => {
  if (!num) return '0'
  return new Intl.NumberFormat('id-ID').format(num)
}
</script>

<template>
  <main class="min-h-screen bg-tryout-bg p-4 sm:p-6 transition-colors duration-300">
    
    <div v-if="loading" class="flex items-center justify-center min-h-[60vh]">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-tryout-border border-t-tryout-primary mx-auto"></div>
        <p class="mt-6 text-tryout-text font-medium text-sm sm:text-base">Memuat dashboard...</p>
      </div>
    </div>

    <div v-else class="max-w-7xl mx-auto">
      
      <div class="mb-6 sm:mb-8 text-center sm:text-left mt-4 sm:mt-0">
        <h1 class="text-2xl sm:text-3xl font-bold text-tryout-text mb-1 sm:mb-2">📊 Dashboard Admin</h1>
        <p class="text-sm sm:text-base text-tryout-muted">Ringkasan statistik platform</p>
      </div>

      <div class="mb-8">
        <h2 class="text-lg sm:text-xl font-semibold text-tryout-text mb-4">Statistik Umum</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          
          <div class="bg-tryout-surface rounded-2xl shadow-md p-5 sm:p-6 border border-tryout-border hover:shadow-lg transition-shadow">
            <div class="flex items-center justify-between mb-4">
              <div class="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-sm">
                <svg class="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
            <p class="text-2xl sm:text-3xl font-bold text-tryout-text mb-1">{{ formatNumber(stats.totalPackets || 0) }}</p>
            <p class="text-xs sm:text-sm font-medium text-tryout-muted">Total Paket</p>
          </div>

          <div class="bg-tryout-surface rounded-2xl shadow-md p-5 sm:p-6 border border-tryout-border hover:shadow-lg transition-shadow">
            <div class="flex items-center justify-between mb-4">
              <div class="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-sm">
                <svg class="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <p class="text-2xl sm:text-3xl font-bold text-tryout-text mb-1">{{ formatNumber(stats.totalQuestionBanks || 0) }}</p>
            <p class="text-xs sm:text-sm font-medium text-tryout-muted">Question Banks</p>
          </div>

          <div class="bg-tryout-surface rounded-2xl shadow-md p-5 sm:p-6 border border-tryout-border hover:shadow-lg transition-shadow">
            <div class="flex items-center justify-between mb-4">
              <div class="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-sm">
                <svg class="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <p class="text-2xl sm:text-3xl font-bold text-tryout-text mb-1">{{ formatNumber(stats.totalUsers || 0) }}</p>
            <p class="text-xs sm:text-sm font-medium text-tryout-muted">Total Users</p>
          </div>

          <div class="bg-tryout-surface rounded-2xl shadow-md p-5 sm:p-6 border border-tryout-border hover:shadow-lg transition-shadow">
            <div class="flex items-center justify-between mb-4">
              <div class="w-10 h-10 sm:w-12 sm:h-12 bg-amber-500 rounded-xl flex items-center justify-center shadow-sm">
                <svg class="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p class="text-xl sm:text-2xl font-bold text-tryout-text mb-1 truncate">{{ formatRupiah(stats.totalRevenue || 0) }}</p>
            <p class="text-xs sm:text-sm font-medium text-tryout-muted">Total Pendapatan</p>
          </div>

        </div>
      </div>

      <div>
        <h2 class="text-lg sm:text-xl font-semibold text-tryout-text mb-4">Penjualan Per Paket</h2>
        
        <div v-if="packetSales.length === 0" class="bg-tryout-surface rounded-2xl shadow-md p-8 sm:p-12 border border-tryout-border text-center">
          <div class="w-12 h-12 sm:w-16 sm:h-16 bg-tryout-hover rounded-full flex items-center justify-center mx-auto mb-4 border border-tryout-border">
            <svg class="w-6 h-6 sm:w-8 sm:h-8 text-tryout-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p class="text-sm sm:text-base text-tryout-muted font-medium">Belum ada data penjualan</p>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          <div 
            v-for="packet in packetSales" 
            :key="packet.packetId"
            class="bg-tryout-surface rounded-2xl shadow-md p-5 sm:p-6 border border-tryout-border hover:shadow-lg transition-all sm:hover:scale-105"
          >
            <div class="w-12 h-12 sm:w-14 sm:h-14 bg-tryout-primary rounded-xl flex items-center justify-center mb-4 shadow-sm">
              <svg class="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>

            <h3 class="font-bold text-tryout-text text-base sm:text-lg mb-2 line-clamp-2 min-h-[3rem] sm:min-h-[3.5rem]">
              {{ packet.packetTitle }}
            </h3>

            <div class="flex items-center justify-between pt-4 border-t border-tryout-divider">
              <span class="text-xs sm:text-sm font-medium text-tryout-muted">Terjual</span>
              <span class="text-xl sm:text-2xl font-bold text-tryout-primary">{{ formatNumber(packet.totalSold) }}</span>
            </div>

            <div class="mt-3">
              <span 
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold"
                :class="[
                  packet.totalSold > 100 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                  packet.totalSold > 50 ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' :
                  packet.totalSold > 10 ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
                  'bg-tryout-hover text-tryout-muted border border-tryout-border'
                ]"
              >
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {{ 
                  packet.totalSold > 100 ? 'Best Seller' :
                  packet.totalSold > 50 ? 'Popular' :
                  packet.totalSold > 10 ? 'Good' :
                  'New'
                }}
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  </main>
</template>