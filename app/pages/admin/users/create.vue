<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

definePageMeta({
  layout: 'admin'
})

const router = useRouter()
const config = useRuntimeConfig()
const { authToken } = useAuthUser() // Ambil token untuk akses admin

// --- STATE FORM ---
const form = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'USER'
})

const loading = ref(false)
const error = ref(null)
const success = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

// --- VALIDATION ---
const validation = ref({
  username: { valid: true, message: '' },
  email: { valid: true, message: '' },
  password: { valid: true, message: '' },
  confirmPassword: { valid: true, message: '' }
})

const validateUsername = () => {
  if (form.value.username.length < 3) {
    validation.value.username = { valid: false, message: 'Username minimal 3 karakter' }
    return false
  }
  validation.value.username = { valid: true, message: '' }
  return true
}

const validateEmail = () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(form.value.email)) {
    validation.value.email = { valid: false, message: 'Format email tidak valid' }
    return false
  }
  validation.value.email = { valid: true, message: '' }
  return true
}

const validatePassword = () => {
  if (form.value.password.length < 6) {
    validation.value.password = { valid: false, message: 'Password minimal 6 karakter' }
    return false
  }
  validation.value.password = { valid: true, message: '' }
  return true
}

const validateConfirmPassword = () => {
  if (form.value.password !== form.value.confirmPassword) {
    validation.value.confirmPassword = { valid: false, message: 'Password tidak cocok' }
    return false
  }
  validation.value.confirmPassword = { valid: true, message: '' }
  return true
}

const isFormValid = computed(() => {
  return form.value.username.length >= 3 &&
         form.value.email &&
         form.value.password.length >= 6 &&
         form.value.password === form.value.confirmPassword
})

const passwordStrength = computed(() => {
  const pwd = form.value.password
  if (!pwd) return { level: 0, text: '', color: '' }
  
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

// --- SUBMIT HANDLER ---
const handleSubmit = async () => {
  const isUsernameValid = validateUsername()
  const isEmailValid = validateEmail()
  const isPasswordValid = validatePassword()
  const isConfirmPasswordValid = validateConfirmPassword()
  
  if (!isUsernameValid || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
    return
  }

  loading.value = true
  error.value = null
  success.value = false

  try {
    // Buang confirmPassword dari payload yang dikirim
    const { confirmPassword, ...payload } = form.value
    
    // Tembak endpoint Khusus Admin yang otomatis mem-bypass verifikasi email
    await $fetch('/api/v1/admin/users', {
      baseURL: config.public.apiBaseUrl,
      method: 'POST',
      headers: { 
        'Authorization': authToken.value, // Tanpa Bearer
        'Content-Type': 'application/json' 
      },
      body: payload
    })

    success.value = true
    
    // Kembali ke tabel user setelah 1.5 detik
    setTimeout(() => {
      router.push('/admin/users')
    }, 1500)

  } catch (err) {
    // Tangkap pesan error dari backend (misal: "Email sudah terdaftar!")
    error.value = err.data?.message || 'Gagal menambahkan pengguna. Pastikan data valid.'
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  if (confirm('Apakah Anda yakin ingin membatalkan? Data yang diisi akan hilang.')) {
    router.push('/admin/users')
  }
}
</script>

<template>
  <main class="min-h-screen bg-tryout-bg py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
    <div class="max-w-2xl mx-auto">
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-tryout-primary/10 rounded-full mb-4">
          <svg class="w-8 h-8 text-tryout-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
          </svg>
        </div>
        <h1 class="text-3xl font-bold text-tryout-text mb-2">Tambah Pengguna Baru</h1>
        <p class="text-tryout-muted">Lengkapi form di bawah untuk menambahkan pengguna baru ke sistem</p>
      </div>

      <div class="bg-tryout-surface rounded-xl shadow-sm border border-tryout-border overflow-hidden transition-colors">
        <div v-if="error || success" class="p-4 border-b border-tryout-divider">
          <div v-if="error" class="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg">
            <svg class="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
              <h3 class="text-sm font-semibold text-red-800 dark:text-red-400 mb-1">Gagal Menambahkan Pengguna</h3>
              <p class="text-sm text-red-700 dark:text-red-300/90">{{ error }}</p>
            </div>
          </div>
          
          <div v-if="success" class="flex items-start gap-3 p-4 bg-green-50 dark:bg-emerald-900/10 border border-green-200 dark:border-emerald-900/30 rounded-lg">
            <svg class="w-5 h-5 text-green-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
              <h3 class="text-sm font-semibold text-green-800 dark:text-emerald-400 mb-1">Berhasil!</h3>
              <p class="text-sm text-green-700 dark:text-emerald-300/90">Pengguna berhasil ditambahkan. Mengalihkan ke daftar pengguna...</p>
            </div>
          </div>
        </div>

        <form @submit.prevent="handleSubmit" class="p-6 sm:p-8 space-y-6">
          <div>
            <label for="username" class="block text-sm font-semibold text-tryout-text mb-2">
              Username <span class="text-red-500 dark:text-red-400">*</span>
            </label>
            <input
              id="username"
              v-model="form.username"
              type="text"
              required
              placeholder="Masukkan username (min. 3 karakter)"
              @blur="validateUsername"
              :class="[
                'w-full px-4 py-2.5 border rounded-lg transition-all outline-none bg-tryout-surface text-tryout-text',
                validation.username.valid 
                  ? 'border-tryout-border focus:ring-2 focus:ring-tryout-primary focus:border-tryout-primary' 
                  : 'border-red-300 dark:border-red-700/50 focus:ring-2 focus:ring-red-500 focus:border-red-500'
              ]"
            />
            <p v-if="!validation.username.valid" class="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              {{ validation.username.message }}
            </p>
          </div>

          <div>
            <label for="email" class="block text-sm font-semibold text-tryout-text mb-2">
              Email <span class="text-red-500 dark:text-red-400">*</span>
            </label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              placeholder="Masukkan alamat email"
              @blur="validateEmail"
              :class="[
                'w-full px-4 py-2.5 border rounded-lg transition-all outline-none bg-tryout-surface text-tryout-text',
                validation.email.valid 
                  ? 'border-tryout-border focus:ring-2 focus:ring-tryout-primary focus:border-tryout-primary' 
                  : 'border-red-300 dark:border-red-700/50 focus:ring-2 focus:ring-red-500 focus:border-red-500'
              ]"
            />
            <p v-if="!validation.email.valid" class="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              {{ validation.email.message }}
            </p>
          </div>

          <div>
            <label for="password" class="block text-sm font-semibold text-tryout-text mb-2">
              Password <span class="text-red-500 dark:text-red-400">*</span>
            </label>
            <div class="relative">
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                required
                placeholder="Masukkan password (min. 6 karakter)"
                @blur="validatePassword"
                :class="[
                  'w-full px-4 py-2.5 pr-10 border rounded-lg transition-all outline-none bg-tryout-surface text-tryout-text',
                  validation.password.valid 
                    ? 'border-tryout-border focus:ring-2 focus:ring-tryout-primary focus:border-tryout-primary' 
                    : 'border-red-300 dark:border-red-700/50 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                ]"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-tryout-subtle hover:text-tryout-muted transition-colors"
              >
                <svg v-if="!showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                </svg>
              </button>
            </div>
            
            <div v-if="form.password" class="mt-2">
              <div class="flex items-center gap-2 mb-1">
                <div class="flex-1 h-1.5 bg-tryout-hover rounded-full overflow-hidden">
                  <div 
                    :class="passwordStrength.color"
                    class="h-full transition-all duration-300"
                    :style="{ width: `${(passwordStrength.level / 5) * 100}%` }"
                  ></div>
                </div>
                <span class="text-xs font-medium text-tryout-muted">{{ passwordStrength.text }}</span>
              </div>
            </div>
            
            <p v-if="!validation.password.valid" class="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              {{ validation.password.message }}
            </p>
          </div>

          <div>
            <label for="confirmPassword" class="block text-sm font-semibold text-tryout-text mb-2">
              Konfirmasi Password <span class="text-red-500 dark:text-red-400">*</span>
            </label>
            <div class="relative">
              <input
                id="confirmPassword"
                v-model="form.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                required
                placeholder="Masukkan ulang password"
                @blur="validateConfirmPassword"
                :class="[
                  'w-full px-4 py-2.5 pr-10 border rounded-lg transition-all outline-none bg-tryout-surface text-tryout-text',
                  validation.confirmPassword.valid 
                    ? 'border-tryout-border focus:ring-2 focus:ring-tryout-primary focus:border-tryout-primary' 
                    : 'border-red-300 dark:border-red-700/50 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                ]"
              />
              <button
                type="button"
                @click="showConfirmPassword = !showConfirmPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-tryout-subtle hover:text-tryout-muted transition-colors"
              >
                <svg v-if="!showConfirmPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                </svg>
              </button>
            </div>
            <p v-if="!validation.confirmPassword.valid" class="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              {{ validation.confirmPassword.message }}
            </p>
          </div>

          <div>
            <label for="role" class="block text-sm font-semibold text-tryout-text mb-2">
              Role <span class="text-red-500 dark:text-red-400">*</span>
            </label>
            <select
              id="role"
              v-model="form.role"
              class="w-full px-4 py-2.5 border border-tryout-border rounded-lg focus:ring-2 focus:ring-tryout-primary focus:border-tryout-primary outline-none transition-all bg-tryout-surface text-tryout-text cursor-pointer"
            >
              <option value="USER">User - Akses terbatas</option>
              <option value="ADMIN">Admin - Akses penuh</option>
            </select>
            <p class="mt-1.5 text-xs text-tryout-muted">Pilih level akses untuk pengguna baru</p>
          </div>

          <div class="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-tryout-divider">
            <button
              type="button"
              @click="handleCancel"
              class="w-full sm:flex-1 px-6 py-2.5 bg-tryout-surface border border-tryout-border text-tryout-text rounded-lg hover:bg-tryout-hover transition-colors font-bold active:scale-[0.98]"
            >
              Batal
            </button>
            <button
              type="submit"
              :disabled="loading || !isFormValid"
              class="w-full sm:flex-1 px-6 py-2.5 bg-tryout-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold shadow-sm flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <svg v-if="loading" class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ loading ? 'Menyimpan...' : 'Simpan Pengguna' }}
            </button>
          </div>
        </form>
      </div>

      <div class="mt-6 text-center">
        <NuxtLink
          to="/admin/users"
          class="inline-flex items-center gap-2 text-sm text-tryout-subtle hover:text-tryout-text transition-colors font-semibold"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Kembali ke Daftar Pengguna
        </NuxtLink>
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