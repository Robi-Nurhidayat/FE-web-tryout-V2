<script setup>
definePageMeta({
  layout: false
})
</script>

<template>
  <main class="min-h-screen bg-gradient-to-br from-red-50 to-rose-50 flex items-center justify-center px-4 font-sans">
    <div class="bg-white rounded-3xl shadow-xl shadow-red-100/50 p-8 md:p-10 max-w-md w-full text-center border border-red-100">
      
      <div class="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6 shadow-inner border-4 border-white outline outline-red-50">
        <svg class="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>

      <h1 class="text-2xl font-black text-gray-900 mb-3 tracking-tight">
        Pembayaran Gagal
      </h1>
      <p class="text-gray-500 mb-8 font-medium leading-relaxed text-sm">
        Maaf, transaksi Anda tidak dapat diproses atau telah dibatalkan. Silakan periksa kembali metode pembayaran Anda atau coba beberapa saat lagi.
      </p>

      <div class="space-y-3">
        <NuxtLink
          to="/paket"
          class="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-red-200 hover:-translate-y-1 transform"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Coba Transaksi Lagi
        </NuxtLink>

        <NuxtLink
          to="/paket"
          class="w-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-bold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 active:scale-95"
        >
          Kembali ke Dashboard
        </NuxtLink>
      </div>

    </div>
  </main>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');

.font-sans {
  font-family: 'Plus Jakarta Sans', sans-serif;
}
</style>