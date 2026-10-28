<script setup>
const error = useError()

const handleGoHome = () => {
  clearError({
    redirect: '/'
  })
}
</script>

<template>
  <main class="min-h-screen bg-tryout-bg flex items-center justify-center px-4">
    <div class="max-w-md w-full bg-tryout-surface border border-tryout-border rounded-2xl shadow-sm p-8 text-center">
      <div class="w-16 h-16 mx-auto mb-5 rounded-full bg-tryout-primary/10 flex items-center justify-center">
        <span class="text-3xl font-bold text-tryout-primary">
          {{ error?.statusCode || 404 }}
        </span>
      </div>

      <h1 class="text-2xl font-bold text-tryout-text mb-3">
        {{ error?.statusCode === 404 ? 'Halaman Tidak Ditemukan' : 'Terjadi Kesalahan' }}
      </h1>

      <p class="text-tryout-muted text-sm leading-relaxed mb-6">
        Maaf, halaman yang Anda tuju tidak tersedia, sudah dipindahkan, atau URL yang dimasukkan tidak sesuai.
      </p>

      <button
        @click="handleGoHome"
        class="w-full bg-tryout-primary hover:opacity-90 text-white font-semibold py-3 px-4 rounded-xl transition active:scale-95"
      >
        Kembali ke Beranda
      </button>
    </div>
  </main>
</template>