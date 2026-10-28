<script setup>
const route = useRoute()
const config = useRuntimeConfig()

const status = ref('loading') // 'loading', 'success', 'error'
const hasCalledApi = ref(false)

const verifyEmail = async () => {
  if (hasCalledApi.value) return

  const token = route.query.token

  if (!token) {
    status.value = 'error'
    return
  }

  try {
    hasCalledApi.value = true

    const response = await $fetch(`${config.public.apiBaseUrl}/api/v1/auth/verify-email`, {
      method: 'GET',
      params: { token },
      headers: {
        // ✅ Penting saat backend masih pakai ngrok free
        'ngrok-skip-browser-warning': 'true'
      }
    })

    if (response) {
      status.value = 'success'
    }
  } catch (error) {
    console.error('Verification error:', error)
    status.value = 'error'
  }
}

onMounted(() => {
  verifyEmail()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
      
      <div v-if="status === 'loading'">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <h2 class="text-xl font-semibold text-gray-700">Memverifikasi email...</h2>
      </div>

      <div v-if="status === 'success'" class="animate-scale-in">
        <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-gray-800 mb-2">Verifikasi Berhasil!</h2>
        <p class="text-gray-600 mb-6">Akun Anda telah aktif. Silakan login untuk melanjutkan.</p>
        <NuxtLink to="/auth/sign-in" 
          class="block w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition">
          Ke Halaman Login
        </NuxtLink>
      </div>

      <div v-if="status === 'error'" class="animate-scale-in">
        <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-gray-800 mb-2">Verification Failed</h2>
        <p class="text-gray-500 mb-8 text-sm text-balance">Link verifikasi tidak valid atau sudah kedaluwarsa.</p>
        
        <div class="space-y-3">
          <NuxtLink to="/auth/sign-in" 
            class="block w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition">
            Go to Login
          </NuxtLink>
          <NuxtLink to="/auth/register" 
            class="block w-full border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition">
            Register Again
          </NuxtLink>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.animate-scale-in {
  animation: scale-in 0.3s ease-out forwards;
}
@keyframes scale-in {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>