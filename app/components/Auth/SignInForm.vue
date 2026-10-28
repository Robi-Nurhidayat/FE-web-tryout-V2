<script setup>
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const isLoading = ref(false)
const isResending = ref(false)

const config = useRuntimeConfig()
const router = useRouter()
// ✅ Ambil route untuk menangkap query param
const route = useRoute()
const toast = useToast()
const { setAuthUser } = useAuthUser()

const errorAlert = ref({
  show: false,
  message: '',
  type: ''
})

const toggleShowPassword = () => {
  showPassword.value = !showPassword.value
}

const resendVerification = async () => {
  try {
    isResending.value = true

    await $fetch(`${config.public.apiBaseUrl}/api/v1/auth/resend-verification`, {
      method: 'POST',
      query: { email: email.value.trim() }
    })

    errorAlert.value = {
      show: true,
      message: 'Link verifikasi baru telah dikirim! Silakan cek inbox Anda.',
      type: 'success'
    }

  } catch (err) {
    toast.add({
      title: 'Gagal',
      description: err.data?.message,
      color: 'error'
    })
  } finally {
    isResending.value = false
  }
}

// ✅ Handle Logic Redirect setelah sukses (Login Manual)
const onSubmit = async () => {
  errorAlert.value.show = false

  try {
    isLoading.value = true

    const response = await $fetch(`${config.public.apiBaseUrl}/api/v1/auth/login`, {
      method: 'POST',
      body: {
        username: email.value.trim(),
        password: password.value.trim()
      }
    })

    if (response.statusCode === 200 && response.data.token) {

      setAuthUser({
        email: response.data.email,
        username: response.data.username,
        role: response.data.role
      }, response.data.token)

      toast.add({
        title: 'Login Berhasil',
        color: 'success'
      })

      // ✅ Tentukan arah redirect
      if (response.data.role === 'ADMIN') {
        await router.push('/admin/dashboard')
      } else {
        // Cek apakah ada query 'redirect' dari URL (misal dari detail paket)
        const redirectPath = route.query.redirect
        if (redirectPath) {
          await router.push(redirectPath)
        } else {
          await router.push('/') // Default ke Beranda
        }
      }
    }

  } catch (error) {
    const status = error.status
    const message = error.data?.message?.toLowerCase() || ''

    if (status === 403 || message.includes('verify')) {
      errorAlert.value = {
        show: true,
        message: 'Akun Anda belum aktif. Silakan verifikasi email Anda terlebih dahulu.',
        type: 'unverified'
      }
    } else {
      errorAlert.value = {
        show: true,
        message: error.data?.message || 'Email atau password salah.',
        type: 'error'
      }
    }
  } finally {
    isLoading.value = false
  }
}

// ✅ Handle Logic Google Login
const handleGoogleLogin = async (response) => {
  errorAlert.value.show = false
  isLoading.value = true

  try {
    // response.credential adalah ID Token yang didapat dari Google
    const res = await $fetch(`${config.public.apiBaseUrl}/api/v1/auth/google`, {
      method: 'POST',
      body: {
        idToken: response.credential
      }
    })

    if (res.statusCode === 200 && res.data.token) {

      setAuthUser({
        email: res.data.email,
        username: res.data.username,
        role: res.data.role
      }, res.data.token)

      toast.add({
        title: 'Login Google Berhasil',
        color: 'success'
      })

      if (res.data.role === 'ADMIN') {
        await router.push('/admin/dashboard')
      } else {
        const redirectPath = route.query.redirect
        await router.push(redirectPath || '/')
      }
    }
  } catch (error) {
    errorAlert.value = {
      show: true,
      message: error.data?.message || 'Gagal terhubung dengan Google. Coba lagi.',
      type: 'error'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <section
    class="min-h-screen bg-[#0A192F] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans selection:bg-orange-200 selection:text-orange-900">

    <div
      class="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-[100px] pointer-events-none">
    </div>
    <div
      class="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-500/20 rounded-full blur-[100px] pointer-events-none">
    </div>

    <main class="w-full max-w-5xl relative z-10">

      <article
        class="bg-white rounded-[2rem] sm:rounded-[3rem] shadow-2xl flex flex-col lg:flex-row overflow-hidden border border-white/20">

        <div
          class="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 p-12 text-white relative overflow-hidden">
          <div
            class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMWgydjExeiIgZmlsbD0icmdiYSgyNTUsIDI1NSLCAyNTUsIDAuMSkiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvc3ZnPg==')] opacity-20">
          </div>

          <div class="absolute top-20 right-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse"></div>
          <div class="absolute bottom-20 left-10 w-32 h-32 bg-orange-500/20 rounded-full blur-2xl animate-pulse"
            style="animation-delay: 1s;"></div>

          <div class="relative z-10">
            <NuxtLink to="/"
              class="inline-flex items-center gap-2 text-white font-extrabold text-2xl tracking-tight hover:opacity-80 transition-opacity">
              <span
                class="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-lg">🚀</span>
              Nyoba ASN
            </NuxtLink>
          </div>

          <div class="relative z-10 mt-12">
            <div
              class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-orange-300 font-bold text-xs uppercase tracking-wider mb-6">
              Welcome Back! 👋
            </div>
            <h1 class="text-4xl xl:text-5xl font-extrabold leading-tight mb-6">
              Waktunya Kembali <br />
              <span class="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-300">Mengasah
                Kemampuan.</span>
            </h1>
            <p class="text-blue-100 text-lg leading-relaxed max-w-md font-medium">
              Perkuat persiapanmu melalui latihan soal soal dan simulasi CAT.
            </p>
          </div>

          <div class="flex items-center gap-3">
  <div
    class="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center">
    📚
  </div>
  <!-- <div>
    <div class="text-sm font-semibold">Soal soal latihan tersedia</div>
    <div class="text-xs text-white/70">CPNS, PPPK, dan simulasi CAT </div>
  </div> -->
</div>
        </div>

        <div class="w-full lg:w-1/2 p-8 sm:p-12 xl:p-16 flex flex-col justify-center bg-white relative">

          <div class="lg:hidden text-center mb-6">
            <NuxtLink to="/"
              class="inline-flex items-center gap-2 text-slate-900 font-extrabold text-3xl tracking-tight">
              <span
                class="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-lg text-white">🚀</span>
              Nyoba ASN
            </NuxtLink>
          </div>

          <div class="mb-8 flex justify-start">
            <NuxtLink to="/"
              class="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-orange-500 transition-colors group">
              <svg class="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none"
                stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Kembali ke Beranda
            </NuxtLink>
          </div>

          <header class="mb-6">
            <h2 class="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">
              Masuk Akun
            </h2>
            <p class="text-slate-500 font-medium">Silakan pilih metode login untuk melanjutkan.</p>
          </header>

          <div class="mb-6 flex justify-center">
            <GoogleLogin 
              :callback="handleGoogleLogin" 
              prompt
            />
          </div>

          <div class="relative flex items-center mb-6">
            <div class="flex-grow border-t border-slate-200"></div>
            <span class="flex-shrink-0 mx-4 text-slate-400 text-sm font-bold uppercase tracking-wider">
              Atau masuk dengan email
            </span>
            <div class="flex-grow border-t border-slate-200"></div>
          </div>

          <div v-if="errorAlert.show"
            class="mb-6 p-4 sm:p-5 rounded-2xl border-2 flex flex-col gap-3 transition-all duration-300"
            :class="errorAlert.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'">
            <div class="flex items-start gap-3">
              <div class="mt-0.5 flex-shrink-0"
                :class="errorAlert.type === 'success' ? 'text-green-500' : 'text-red-500'">
                <svg v-if="errorAlert.type === 'success'" class="w-6 h-6" fill="none" stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p class="text-sm font-semibold"
                :class="errorAlert.type === 'success' ? 'text-green-800' : 'text-red-800'">
                {{ errorAlert.message }}
              </p>
            </div>

            <button v-if="errorAlert.type === 'unverified'" type="button" @click="resendVerification"
              :disabled="isResending"
              class="ml-9 self-start px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2">
              <svg v-if="isResending" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                </path>
              </svg>
              {{ isResending ? 'Mengirim ulang...' : 'Kirim Ulang Verifikasi' }}
            </button>
          </div>

          <form class="space-y-6" @submit.prevent="onSubmit">

            <div class="space-y-2">
              <label class="text-sm font-bold text-slate-700 ml-1">Alamat Email</label>
              <div class="relative group">
                <div
                  class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input v-model="email" type="email" required :disabled="isLoading" placeholder="contoh@email.com"
                  class="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:ring-0 focus:border-blue-500 outline-none transition-all font-medium text-slate-900 placeholder:text-slate-400 disabled:opacity-60" />
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-sm font-bold text-slate-700 ml-1">Password</label>
              <div class="relative group">
                <div
                  class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input :type="showPassword ? 'text' : 'password'" v-model="password" required :disabled="isLoading"
                  placeholder="Masukkan password"
                  class="w-full pl-11 pr-12 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:ring-0 focus:border-blue-500 outline-none transition-all font-medium text-slate-900 placeholder:text-slate-400 disabled:opacity-60" />

                <button type="button" @click="toggleShowPassword" tabindex="-1"
                  class="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none">
                  <svg v-if="!showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                </button>
              </div>
            </div>

            <div class="flex justify-end">
              <NuxtLink to="/auth/forgot-password"
                class="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">
                Lupa Password?
              </NuxtLink>
            </div>

            <button type="submit" :disabled="isLoading"
              class="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-400 text-white rounded-2xl font-extrabold text-lg hover:shadow-[0_0_20px_-5px_rgba(249,115,22,0.5)] hover:scale-[1.02] transition-all disabled:opacity-70 disabled:hover:scale-100 disabled:hover:shadow-none flex items-center justify-center gap-2">
              <svg v-if="isLoading" class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                </path>
              </svg>
              <span>{{ isLoading ? 'Sedang Memeriksa...' : 'Masuk Sekarang 🚀' }}</span>
            </button>

          </form>

          <footer class="mt-8 text-center">
            <p class="text-slate-600 font-medium">
              Belum punya akun pejuang?
              <NuxtLink to="/auth/sign-up"
                class="text-orange-500 font-extrabold hover:text-orange-600 transition-colors ml-1">
                Daftar Sekarang
              </NuxtLink>
            </p>
          </footer>

        </div>
      </article>

    </main>
  </section>
</template>

<style scoped>
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 30px #f8fafc inset !important;
  -webkit-text-fill-color: #0f172a !important;
  border-radius: 1rem;
}
</style>