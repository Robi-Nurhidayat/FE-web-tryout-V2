<script setup>
definePageMeta({
  layout: false
})

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const toast = useToast()

const newPassword = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)

const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

const toggleShowNewPassword = () => {
  showNewPassword.value = !showNewPassword.value
}

const toggleShowConfirmPassword = () => {
  showConfirmPassword.value = !showConfirmPassword.value
}

const onResetPassword = async () => {
  // Validasi Sederhana
  if (newPassword.value !== confirmPassword.value) {
    return toast.add({
      title: 'Error',
      description: 'Password tidak cocok!',
      color: 'error'
    })
  }

  const token = route.query.token
  if (!token) {
    return toast.add({
      title: 'Error',
      description: 'Token tidak ditemukan!',
      color: 'error'
    })
  }

  try {
    isLoading.value = true

    await $fetch(`${config.public.apiBaseUrl}/api/v1/auth/reset-password`, {
      method: 'POST',
      body: {
        token: token,
        newPassword: newPassword.value
      }
    })

    toast.add({
      title: 'Berhasil',
      description: 'Password Anda telah diperbarui. Silakan login.',
      color: 'success'
    })

    router.push('/auth/sign-in')
  } catch (error) {
    toast.add({
      title: 'Gagal',
      description: error.data?.message || 'Token tidak valid atau sudah kadaluarsa.',
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

        <!-- Header -->
        <header class="text-center mb-8">
          <h1 class="text-2xl font-bold text-gray-900">
            Buat Password Baru
          </h1>
          <p class="text-gray-600 mt-2 text-sm">
            Silakan masukkan password baru Anda.
          </p>
        </header>

        <!-- Form -->
        <form @submit.prevent="onResetPassword" class="space-y-6">

          <!-- Password Baru -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
              Password Baru
            </label>

            <div class="relative">
              <input
                id="password"
                v-model="newPassword"
                :type="showNewPassword ? 'text' : 'password'"
                placeholder="••••••••"
                required
                class="w-full border border-gray-300 rounded-lg px-4 py-3 pr-12 text-sm
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />

              <button
                type="button"
                @click="toggleShowNewPassword"
                class="absolute inset-y-0 right-0 px-4 flex items-center text-gray-400 hover:text-gray-600"
                tabindex="-1"
              >
                <svg
                  v-if="!showNewPassword"
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>

                <svg
                  v-else
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </svg>
              </button>
            </div>
          </div>

          <!-- Konfirmasi Password -->
          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">
              Konfirmasi Password
            </label>

            <div class="relative">
              <input
                id="confirmPassword"
                v-model="confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                placeholder="••••••••"
                required
                class="w-full border border-gray-300 rounded-lg px-4 py-3 pr-12 text-sm
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />

              <button
                type="button"
                @click="toggleShowConfirmPassword"
                class="absolute inset-y-0 right-0 px-4 flex items-center text-gray-400 hover:text-gray-600"
                tabindex="-1"
              >
                <svg
                  v-if="!showConfirmPassword"
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>

                <svg
                  v-else
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </svg>
              </button>
            </div>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full bg-indigo-600 text-white font-medium py-3 rounded-lg
                   hover:bg-indigo-700 transition
                   disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="!isLoading">
              Update Password
            </span>
            <span v-else>
              Memproses...
            </span>
          </button>

        </form>

      </article>
    </main>
  </section>
</template>