<script setup>
import { ref, computed } from 'vue'
const config = useRuntimeConfig()

// Fetch packets dari backend
const { data: response, pending: loading } = await useFetch('/api/v1/packets', {
  baseURL: config.public.apiBaseUrl,
  method: 'GET'
})

const packets = computed(() => response.value?.data || [])

// ✅ Hanya tampilkan 6 paket pertama di landing page
const previewPackets = computed(() => packets.value.slice(0, 6))

// Format rupiah
const formatRupiah = (amount) => {
  if (!amount) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount)
}

// Calculate discount
const calculateDiscount = (price) => {
  const originalPrice = price * 1.5
  return Math.round(((originalPrice - price) / originalPrice) * 100)
}

const getOriginalPrice = (price) => {
  return price * 1.5
}

// Get badge color based on category
const getBadgeColor = (category) => {
  const colors = {
    'CPNS': 'bg-blue-500',
    'PPPK': 'bg-purple-500',
    'Kedinasan': 'bg-green-500',
    'Default': 'bg-gray-500'
  }
  return colors[category] || colors['Default']
}
</script>

<template>
  <section id="katalog" class="relative py-20 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
    
    <!-- Background Decoration -->
    <div class="absolute top-0 left-0 w-full h-full opacity-5">
      <div class="absolute top-20 right-20 w-64 h-64 bg-blue-500 rounded-full filter blur-3xl"></div>
      <div class="absolute bottom-20 left-20 w-64 h-64 bg-purple-500 rounded-full filter blur-3xl"></div>
    </div>

    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <!-- Section Header -->
      <div class="text-center mb-16">
        <div class="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-4">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          Paket Pilihan Terbaik
        </div>
        <h2 class="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
          Pilih Paket yang Sesuai
        </h2>
        <p class="text-xl text-gray-600 max-w-2xl mx-auto">
          Investasi terbaik untuk masa depan karir Anda sebagai PNS. 
          Lihat katalog lengkap untuk semua pilihan paket!
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="text-center">
          <div class="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
          <p class="mt-6 text-gray-700 font-medium">Memuat paket...</p>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="packets.length === 0" class="text-center py-20">
        <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <p class="text-gray-500 text-lg">Belum ada paket tersedia</p>
      </div>

      <!-- Preview Cards (6 paket pertama) -->
      <div v-else class="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        <div 
          v-for="(packet, index) in previewPackets" 
          :key="packet.id"
          class="relative bg-white rounded-3xl shadow-xl border-2 border-gray-200 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
        >
          <div class="p-8">
            <!-- Category Badge -->
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-white text-xs font-bold mb-4" :class="getBadgeColor(packet.category)">
              {{ packet.category || 'PAKET' }}
            </div>

            <!-- Title -->
            <h3 class="text-2xl font-bold text-gray-900 mb-1">{{ packet.title }}</h3>
            <p class="text-gray-600 text-sm mb-6">{{ packet.subCategory || 'Paket Try Out' }}</p>

            <!-- Price -->
            <div class="mb-6">
              <div class="flex items-baseline gap-2 mb-2">
                <span class="text-4xl font-bold text-gray-900">{{ formatRupiah(packet.price) }}</span>
                <span class="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                  -{{ calculateDiscount(packet.price) }}%
                </span>
              </div>
              <div class="text-gray-500 text-sm line-through">{{ formatRupiah(getOriginalPrice(packet.price)) }}</div>
            </div>

            <!-- Description -->
            <div class="mb-6">
              <p class="text-gray-700 text-sm leading-relaxed line-clamp-3">
                {{ packet.description || 'Paket lengkap untuk persiapan optimal' }}
              </p>
            </div>

            <!-- Features -->
            <div class="space-y-3 mb-8">
              <div class="flex items-start gap-3">
                <svg class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <span class="text-gray-700 text-sm">Simulasi CAT Real</span>
              </div>
              <div class="flex items-start gap-3">
                <svg class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <span class="text-gray-700 text-sm">Pembahasan Lengkap</span>
              </div>
              <div class="flex items-start gap-3">
                <svg class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <span class="text-gray-700 text-sm">Ranking Nasional</span>
              </div>
            </div>

            <!-- CTA Button - Redirect ke katalog halaman -->
            <NuxtLink
              to="/katalog"
              class="block w-full py-4 rounded-xl font-bold text-lg text-center transition-all duration-200 shadow-lg hover:shadow-xl bg-blue-600 text-white hover:bg-blue-700"
            >
              Lihat Detail →
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- ✅ BUTTON "SHOW MORE / LIHAT SEMUA" - Redirect ke /katalog -->
      <div class="text-center">
        <NuxtLink
          to="/auth/sign-in"
          class="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold text-xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span>Lihat Semua Paket ({{ packets.length }})</span>
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </NuxtLink>
        <p class="mt-4 text-sm text-gray-600">
          Jelajahi katalog lengkap dengan filter pencarian dan kategori
        </p>
      </div>

      <!-- Bottom Info -->
      <div class="mt-16 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-8">
        <div class="text-center mb-6">
          <h4 class="text-xl font-bold text-gray-900 mb-2">Semua Paket Termasuk:</h4>
          <p class="text-gray-600">Fitur lengkap untuk persiapan optimal</p>
        </div>
        <div class="grid md:grid-cols-4 gap-6">
          <div class="flex items-center justify-center gap-3 text-gray-700">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="font-medium">Simulasi CAT</span>
          </div>
          <div class="flex items-center justify-center gap-3 text-gray-700">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span class="font-medium">Pembahasan Detail</span>
          </div>
          <div class="flex items-center justify-center gap-3 text-gray-700">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span class="font-medium">Ranking Real-time</span>
          </div>
          <div class="flex items-center justify-center gap-3 text-gray-700">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="font-medium">Akses 24/7</span>
          </div>
        </div>
      </div>

    </div>
  </section>
</template>