<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

definePageMeta({
  layout: 'admin'
})

const router = useRouter()
const route = useRoute()
const config = useRuntimeConfig()
const { authToken } = useAuthUser()
const toast = useToast()

const userId = computed(() => String(route.params.id || '').trim())

// --- STATE LOADING & ERROR GLOBAL ---
const pageLoading = ref(true)
const submitLoading = ref(false)
const globalError = ref(null)
const success = ref(false)
const userLoaded = ref(false)

// --- STATE FORM ---
const form = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'USER'
})

const showPassword = ref(false)
const showConfirmPassword = ref(false)

// Header dasar untuk seluruh request menuju backend ngrok.
// Header ngrok-skip-browser-warning wajib ikut pada GET dan PUT.
const requestHeaders = computed(() => ({
  Authorization: authToken.value || '',
  Accept: 'application/json',
  'ngrok-skip-browser-warning': 'true'
}))

const getErrorMessage = (err, fallback) => {
  return (
    err?.data?.message ||
    err?.response?._data?.message ||
    err?.message ||
    fallback
  )
}

// --- 1. FETCH DATA USER ---
const fetchUser = async () => {
  if (!userId.value) {
    pageLoading.value = false
    globalError.value = 'ID pengguna tidak valid.'
    return
  }

  if (!authToken.value) {
    // Token biasanya dipulihkan dari cookie pada sisi client.
    // Watcher di bawah akan memanggil fungsi ini lagi setelah token tersedia.
    return
  }

  pageLoading.value = true
  globalError.value = null

  try {
    const response = await $fetch(`/api/v1/admin/users/${userId.value}`, {
      baseURL: config.public.apiBaseUrl,
      method: 'GET',
      headers: requestHeaders.value,
      retry: 0
    })

    if (!response?.data) {
      throw new Error('Data pengguna tidak ditemukan pada respons server.')
    }

    form.value.username = response.data.username || ''
    form.value.email = response.data.email || ''
    form.value.role = response.data.role || 'USER'
    form.value.password = ''
    form.value.confirmPassword = ''

    userLoaded.value = true
  } catch (err) {
    console.error('Gagal mengambil user:', err)

    globalError.value = getErrorMessage(
      err,
      'Gagal mengambil data pengguna. Pastikan backend ngrok aktif dan konfigurasi CORS sudah benar.'
    )

    toast.add({
      title: 'Error',
      description: globalError.value,
      color: 'red'
    })
  } finally {
    pageLoading.value = false
  }
}

// Jangan langsung fetch hanya berdasarkan onMounted.
// Tunggu sampai token benar-benar tersedia agar request pertama tidak terkirim tanpa Authorization.
watch(
  [authToken, userId],
  ([token, id]) => {
    if (token && id && !userLoaded.value) {
      fetchUser()
    }
  },
  { immediate: true }
)

// --- 2. VALIDATION LOGIC ---
const validation = ref({
  username: { valid: true, message: '' },
  password: { valid: true, message: '' },
  confirmPassword: { valid: true, message: '' }
})

const validateUsername = () => {
  const username = form.value.username.trim()

  if (username.length < 3) {
    validation.value.username = {
      valid: false,
      message: 'Username minimal 3 karakter'
    }
    return false
  }

  validation.value.username = { valid: true, message: '' }
  return true
}

const validatePassword = () => {
  if (!form.value.password) {
    validation.value.password = { valid: true, message: '' }

    if (!form.value.confirmPassword) {
      validation.value.confirmPassword = { valid: true, message: '' }
    }

    return true
  }

  if (form.value.password.length < 6) {
    validation.value.password = {
      valid: false,
      message: 'Password baru minimal 6 karakter'
    }
    return false
  }

  validation.value.password = { valid: true, message: '' }
  return true
}

const validateConfirmPassword = () => {
  if (!form.value.password && form.value.confirmPassword) {
    validation.value.confirmPassword = {
      valid: false,
      message: 'Isi password baru terlebih dahulu'
    }
    return false
  }

  if (
    form.value.password &&
    form.value.password !== form.value.confirmPassword
  ) {
    validation.value.confirmPassword = {
      valid: false,
      message: 'Konfirmasi password tidak cocok'
    }
    return false
  }

  validation.value.confirmPassword = { valid: true, message: '' }
  return true
}

const isFormValid = computed(() => {
  const usernameOk = form.value.username.trim().length >= 3

  const passwordOk =
    !form.value.password ||
    (
      form.value.password.length >= 6 &&
      form.value.password === form.value.confirmPassword
    )

  return usernameOk && passwordOk
})

const passwordStrength = computed(() => {
  const pwd = form.value.password

  if (!pwd) {
    return { level: 0, text: '', color: '' }
  }

  let strength = 0

  if (pwd.length >= 6) strength++
  if (pwd.length >= 10) strength++
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++
  if (/\d/.test(pwd)) strength++
  if (/[^a-zA-Z0-9]/.test(pwd)) strength++

  const levels = [
    { level: 0, text: '', color: '' },
    { level: 1, text: 'Lemah', color: 'bg-red-500' },
    { level: 2, text: 'Cukup', color: 'bg-yellow-500' },
    { level: 3, text: 'Baik', color: 'bg-blue-500' },
    { level: 4, text: 'Kuat', color: 'bg-green-500' },
    { level: 5, text: 'Sangat Kuat', color: 'bg-green-600' }
  ]

  return levels[Math.min(strength, 5)]
})

// --- 3. SUBMIT HANDLER ---
const handleSubmit = async () => {
  const isUsernameValid = validateUsername()
  const isPasswordValid = validatePassword()
  const isConfirmPasswordValid = validateConfirmPassword()

  if (
    !isUsernameValid ||
    !isPasswordValid ||
    !isConfirmPasswordValid
  ) {
    return
  }

  if (!authToken.value) {
    globalError.value = 'Sesi login tidak ditemukan. Silakan login kembali.'

    toast.add({
      title: 'Sesi berakhir',
      description: globalError.value,
      color: 'red'
    })

    return
  }

  submitLoading.value = true
  globalError.value = null
  success.value = false

  try {
    const payload = {
      username: form.value.username.trim(),
      role: form.value.role
    }

    if (form.value.password) {
      payload.password = form.value.password
    }

    await $fetch(`/api/v1/admin/users/${userId.value}`, {
      baseURL: config.public.apiBaseUrl,
      method: 'PUT',
      headers: {
        ...requestHeaders.value,
        'Content-Type': 'application/json'
      },
      body: payload,
      retry: 0
    })

    success.value = true

    toast.add({
      title: 'Berhasil',
      description: 'Data pengguna berhasil diperbarui',
      color: 'success'
    })

    window.setTimeout(() => {
      router.push('/admin/users')
    }, 1500)
  } catch (err) {
    console.error('Gagal memperbarui user:', err)

    globalError.value = getErrorMessage(
      err,
      'Gagal memperbarui pengguna. Pastikan backend ngrok aktif dan menerima origin frontend.'
    )

    toast.add({
      title: 'Gagal',
      description: globalError.value,
      color: 'red'
    })
  } finally {
    submitLoading.value = false
  }
}

const handleCancel = () => {
  router.push('/admin/users')
}
</script>

<template>
  <main class="min-h-screen bg-tryout-bg py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
    <div class="max-w-2xl mx-auto">
      
      <NuxtLink to="/admin/users" class="inline-flex items-center gap-2 text-sm text-tryout-subtle hover:text-tryout-primary mb-6 transition-colors font-semibold">
        <i class="pi pi-arrow-left text-xs"></i>
        Kembali ke Daftar Pengguna
      </NuxtLink>

      <div v-if="pageLoading" class="text-center bg-tryout-surface rounded-xl shadow-sm border border-tryout-border p-12 transition-colors">
        <i class="pi pi-spin pi-spinner text-3xl text-tryout-primary mb-4"></i>
        <p class="text-tryout-muted font-medium">Memuat data pengguna...</p>
      </div>

      <div v-else-if="globalError && !form.username" class="text-center bg-tryout-surface rounded-xl shadow-sm border border-tryout-border p-12 transition-colors">
        <i class="pi pi-exclamation-triangle text-5xl text-red-500 dark:text-red-400 mb-4"></i>
        <h2 class="text-xl font-bold text-tryout-text mb-2">Waduh, Error!</h2>
        <p class="text-tryout-muted mb-6">{{ globalError }}</p>
        <NuxtLink to="/admin/users" class="px-6 py-2.5 bg-tryout-primary text-white rounded-lg hover:opacity-90 font-medium shadow-sm transition-opacity">
          Kembali ke Daftar
        </NuxtLink>
      </div>

      <div v-else>
        <div class="flex items-center gap-4 mb-8 p-4 bg-tryout-surface rounded-xl shadow-sm border border-tryout-border transition-colors">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-tryout-primary/10 text-tryout-primary rounded-full text-3xl font-bold shadow-inner">
            {{ form.username ? form.username.charAt(0).toUpperCase() : 'U' }}
          </div>
          <div>
            <h1 class="text-2xl font-bold text-tryout-text">Edit Pengguna</h1>
            <p class="text-tryout-muted text-sm">Mengubah data untuk: <span class="font-semibold text-tryout-primary">{{ form.email }}</span></p>
          </div>
        </div>

        <div class="bg-tryout-surface rounded-xl shadow-sm border border-tryout-border overflow-hidden relative transition-colors">
          
          <div v-if="submitLoading" class="absolute inset-0 bg-tryout-surface/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
            <i class="pi pi-spin pi-spinner text-2xl text-tryout-primary mb-2"></i>
            <span class="text-sm font-medium text-tryout-text">Menyimpan perubahan...</span>
          </div>

          <div v-if="success" class="p-6 border-b border-tryout-divider bg-green-50 dark:bg-emerald-900/10 transition-colors">
            <div class="flex items-start gap-3 p-4 bg-tryout-surface border border-green-500/20 rounded-lg shadow-sm text-green-800 dark:text-emerald-400">
              <i class="pi pi-check-circle text-2xl text-green-600 dark:text-emerald-400 mt-0.5"></i>
              <div>
                <h3 class="font-semibold mb-1">Berhasil Disimpan!</h3>
                <p class="text-sm opacity-90">Data pengguna telah diperbarui. Mengalihkan dalam 1.5 detik...</p>
              </div>
            </div>
          </div>

          <form @submit.prevent="handleSubmit" class="p-6 sm:p-8 space-y-6">
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-semibold text-tryout-text mb-2">Email (Tidak bisa diubah)</label>
                <div class="relative">
                  <input type="email" v-model="form.email" disabled class="w-full px-4 py-2.5 bg-tryout-hover border border-tryout-border rounded-lg text-tryout-muted cursor-not-allowed font-medium outline-none" />
                  <i class="pi pi-lock absolute right-3 top-1/2 -translate-y-1/2 text-tryout-subtle"></i>
                </div>
              </div>

              <div>
                <label for="username" class="block text-sm font-semibold text-tryout-text mb-2">Username <span class="text-red-500 dark:text-red-400">*</span></label>
                <input id="username" v-model="form.username" type="text" required placeholder="Min. 3 karakter" @blur="validateUsername"
                  :class="['w-full px-4 py-2.5 border bg-tryout-surface text-tryout-text rounded-lg transition outline-none', validation.username.valid ? 'border-tryout-border focus:ring-2 focus:ring-tryout-primary focus:border-tryout-primary' : 'border-red-300 dark:border-red-700/50 focus:ring-2 focus:ring-red-500']" />
                <p v-if="!validation.username.valid" class="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1"><i class="pi pi-exclamation-circle"></i> {{ validation.username.message }}</p>
              </div>
            </div>

            <hr class="border-tryout-divider" />

            <div class="bg-tryout-hover/50 p-5 sm:p-6 rounded-lg border border-tryout-border transition-colors">
              <h3 class="text-sm font-bold text-tryout-text mb-1">Ganti Password (Opsional)</h3>
              <p class="text-xs text-tryout-muted mb-4">Kosongkan kolom di bawah jika Anda tidak ingin mengubah password user.</p>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label for="password" class="block text-sm font-medium text-tryout-text mb-2">Password Baru</label>
                  <div class="relative">
                    <input id="password" v-model="form.password" :type="showPassword ? 'text' : 'password'" placeholder="Min. 6 karakter" @blur="validatePassword"
                      :class="['w-full px-4 py-2.5 pr-10 border bg-tryout-surface text-tryout-text rounded-lg transition outline-none', validation.password.valid ? 'border-tryout-border focus:ring-2 focus:ring-tryout-primary focus:border-tryout-primary' : 'border-red-300 dark:border-red-700/50 focus:ring-2 focus:ring-red-500']" />
                    <button type="button" @click="showPassword = !showPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-tryout-subtle hover:text-tryout-muted transition-colors">
                      <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
                    </button>
                  </div>
                  
                  <div v-if="form.password" class="mt-2 flex items-center gap-2">
                    <div class="flex-1 h-1 bg-tryout-hover rounded-full overflow-hidden">
                      <div :class="passwordStrength.color" class="h-full transition-all duration-300" :style="{ width: `${(passwordStrength.level / 5) * 100}%` }"></div>
                    </div>
                    <span class="text-xs font-medium text-tryout-muted">{{ passwordStrength.text }}</span>
                  </div>
                  <p v-if="!validation.password.valid" class="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1"><i class="pi pi-exclamation-circle"></i> {{ validation.password.message }}</p>
                </div>

                <div>
                  <label for="confirmPassword" class="block text-sm font-medium text-tryout-text mb-2">Konfirmasi Password Baru</label>
                  <div class="relative">
                    <input id="confirmPassword" v-model="form.confirmPassword" :type="showConfirmPassword ? 'text' : 'password'" placeholder="Ulangi password" @blur="validateConfirmPassword"
                      :class="['w-full px-4 py-2.5 pr-10 border bg-tryout-surface text-tryout-text rounded-lg transition outline-none', validation.confirmPassword.valid ? 'border-tryout-border focus:ring-2 focus:ring-tryout-primary focus:border-tryout-primary' : 'border-red-300 dark:border-red-700/50 focus:ring-2 focus:ring-red-500']" />
                    <button type="button" @click="showConfirmPassword = !showConfirmPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-tryout-subtle hover:text-tryout-muted transition-colors">
                      <i :class="showConfirmPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
                    </button>
                  </div>
                  <p v-if="!validation.confirmPassword.valid" class="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1"><i class="pi pi-exclamation-circle"></i> {{ validation.confirmPassword.message }}</p>
                </div>
              </div>
            </div>

            <div class="md:w-1/2">
              <label for="role" class="block text-sm font-semibold text-tryout-text mb-2">Role / Hak Akses <span class="text-red-500 dark:text-red-400">*</span></label>
              <select id="role" v-model="form.role" class="w-full px-4 py-2.5 border border-tryout-border rounded-lg focus:ring-2 focus:ring-tryout-primary outline-none transition bg-tryout-surface font-medium text-tryout-text cursor-pointer">
                <option value="USER">USER - Akses Peserta Tryout</option>
                <option value="ADMIN">ADMIN - Akses Management Sistem</option>
              </select>
            </div>

            <div class="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t border-tryout-divider">
              <button type="button" @click="handleCancel" class="w-full sm:flex-1 px-6 py-2.5 bg-tryout-surface border border-tryout-border text-tryout-text rounded-lg hover:bg-tryout-hover transition-colors font-bold active:scale-[0.98]">
                Batal
              </button>
              <button type="submit" :disabled="submitLoading || !isFormValid" class="w-full sm:flex-1 px-6 py-2.5 bg-tryout-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold shadow-md flex items-center justify-center gap-2 active:scale-[0.98]">
                <i v-if="submitLoading" class="pi pi-spin pi-spinner"></i>
                <i v-else class="pi pi-save"></i>
                {{ submitLoading ? 'Menyimpan...' : 'Simpan Perubahan' }}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  </main>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>