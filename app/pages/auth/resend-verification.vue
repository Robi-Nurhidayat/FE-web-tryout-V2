<script setup>
definePageMeta({
  layout: false
})

const email = ref('')
const isLoading = ref(false)
const toast = useToast()
const config = useRuntimeConfig()

const onResend = async () => {
  try {
    isLoading.value = true
    await $fetch(`${config.public.apiBaseUrl}/api/v1/auth/resend-verification`, {
      method: 'POST',
      query: { email: email.value.trim() }
    })

    toast.add({
      title: 'Berhasil!',
      description: 'Link verifikasi baru sudah dikirim. Cek inbox atau folder spam Anda.',
      color: 'success'
    })
  } catch (error) {
    toast.add({
      title: 'Gagal',
      description: error.data?.message || 'Terjadi kesalahan saat mengirim email.',
      color: 'error'
    })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <section class="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
      <div class="text-center mb-6">
        <div class="mx-auto h-12 w-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
          <UIcon name="i-heroicons-envelope-open" class="w-6 h-6" />
        </div>
        <h2 class="text-2xl font-bold text-gray-900">Kirim Ulang Verifikasi</h2>
        <p class="text-gray-600 text-sm mt-2">Link verifikasi expired? Masukkan email Anda untuk mendapatkan link baru.</p>
      </div>

      <form @submit.prevent="onResend" class="space-y-4">
        <UFormGroup label="Email Anda" name="email">
          <UInput v-model="email" type="email" placeholder="nama@email.com" icon="i-heroicons-envelope" required />
        </UFormGroup>

        <UButton type="submit" block color="primary" :loading="isLoading">
          Kirim Link Baru
        </UButton>

        <div class="text-center mt-4">
          <NuxtLink to="/auth/login" class="text-sm text-indigo-600 hover:underline">
            Kembali ke Login
          </NuxtLink>
        </div>
      </form>
    </div>
  </section>
</template>