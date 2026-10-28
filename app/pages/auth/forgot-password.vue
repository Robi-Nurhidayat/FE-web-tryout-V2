<script setup>

definePageMeta({
  layout: false
})

const email = ref('')
const isLoading = ref(false)
const config = useRuntimeConfig()
const toast = useToast()

const onForgotPassword = async () => {
  try {
    isLoading.value = true
    await $fetch(`${config.public.apiBaseUrl}/api/v1/auth/forgot-password`, {
      method: 'POST',
      body: { email: email.value.trim() }
    })

    toast.add({
      title: 'Email Terkirim',
      description: 'Silakan cek inbox Anda untuk instruksi reset password.',
      color: 'success'
    })
  } catch (error) {
    toast.add({
      title: 'Gagal',
      description: error.data?.message || 'Email tidak ditemukan.',
      color: 'error'
    })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <section class="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
    <main class="max-w-md w-full px-4">
      <article class="bg-white rounded-xl shadow-lg p-8">

        <header class="text-center mb-8">
          <h1 class="text-2xl font-bold text-gray-900">
            Lupa Password?
          </h1>
          <p class="text-gray-600 mt-2 text-sm">
            Masukkan email Anda untuk menerima link reset.
          </p>
        </header>

        <form @submit.prevent="onForgotPassword" class="space-y-6">

          <!-- Email -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
              Alamat Email
            </label>

            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="nama@email.com"
              required
              class="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full bg-indigo-600 text-white font-medium py-3 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="!isLoading">
              Kirim Link Reset
            </span>
            <span v-else>
              Mengirim...
            </span>
          </button>

          <!-- Back to login -->
          <footer class="text-center">
            <NuxtLink
              to="/auth/sign-in"
              class="text-sm font-medium text-indigo-600 hover:text-indigo-500 cursor-pointer"
            >
              Kembali ke Login
            </NuxtLink>
          </footer>

        </form>

      </article>
    </main>
  </section>
</template>