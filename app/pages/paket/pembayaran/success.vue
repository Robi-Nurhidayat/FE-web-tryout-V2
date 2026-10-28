<!-- pages/user/payment/success.vue -->
<script setup>
definePageMeta({
  layout: false
})

</script>

<template>
  <main class="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center px-4">
    <div class="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
      
      <!-- Success Icon -->
      <div class="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
        <svg class="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <!-- Message -->
      <h1 class="text-2xl font-bold text-gray-900 mb-3">
        Pembelian Berhasil! 🎉
      </h1>
      <p class="text-gray-500 mb-8">
        Selamat! Pembelian paket Anda telah berhasil. Silakan akses paket Anda sekarang dan mulai berlatih.
      </p>

      <!-- Button -->
      <NuxtLink
        to="/my-packets"
        class="cursor-pointer  w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-md hover:shadow-lg transform hover:scale-105"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        Lihat Paket Saya
      </NuxtLink>
    </div>
  </main>
</template>