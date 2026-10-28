<script setup>
const email = ref('')
const username = ref('')
const password = ref('')
const ulangi_password = ref('')
const config = useRuntimeConfig()
const router = useRouter()

// ✅ Tambahan: route dan useAuthUser untuk Google Login yang langsung redirect
const route = useRoute()
const { setAuthUser } = useAuthUser()
const toast = useToast()

const isMatching = ref(false)
const showPassword = ref(false)
const showUlangiPassword = ref(false)
const isLoading = ref(false)

// State untuk tampilan instruksi email (Pendaftaran Manual)
const showEmailSentMessage = ref(false)
const registeredEmail = ref('')

const toggleShowPassword = () => {
  showPassword.value = !showPassword.value
}

const toggleShowUlangiPassword = () => {
  showUlangiPassword.value = !showUlangiPassword.value
}

// ✅ Handle Logic Pendaftaran Manual
const onSubmit = async () => {
  if (password.value !== ulangi_password.value) {
    isMatching.value = true
    toast.add({
      title: 'Password Salah',
      description: 'Password dan konfirmasi password tidak cocok!',
      color: 'red'
    })
    return
  } else {
    isMatching.value = false
  }

  try {
    isLoading.value = true

    const response = await $fetch(`${config.public.apiBaseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email.value.trim(),
        username: username.value.trim(),
        password: password.value.trim(),
        role: 'USER'
      })
    })

    if (response.statusCode === 201 || response.status === 201) {
      registeredEmail.value = email.value

      toast.add({
        title: 'Registrasi Berhasil',
        description: 'Silakan periksa Inbox email Anda. Jika tidak ada, cek folder Spam, Promosi, atau Junk.',
        icon: 'i-heroicons-check-circle',
        color: 'green'
      })

      showEmailSentMessage.value = true

      email.value = ''
      username.value = ''
      password.value = ''
      ulangi_password.value = ''
    }

  } catch (error) {
    console.error('❌ Error during sign-up:', error)
    toast.add({
      title: 'Registrasi Gagal',
      description: error.data?.message || 'Terjadi kesalahan saat mendaftar.',
      color: 'red'
    })
  } finally {
    isLoading.value = false
  }
}

// ✅ Handle Logic Google Login/Register (Langsung Masuk)
const handleGoogleLogin = async (response) => {
  isLoading.value = true

  try {
    const res = await $fetch(`${config.public.apiBaseUrl}/api/v1/auth/google`, {
      method: 'POST',
      body: {
        idToken: response.credential
      }
    })

    if (res.statusCode === 200 && res.data.token) {
      // Simpan session persis seperti login
      setAuthUser({
        email: res.data.email,
        username: res.data.username,
        role: res.data.role
      }, res.data.token)

      toast.add({
        title: 'Pendaftaran via Google Berhasil!',
        color: 'success'
      })

      // Langsung arahkan ke dalam aplikasi
      if (res.data.role === 'ADMIN') {
        await router.push('/admin/dashboard')
      } else {
        const redirectPath = route.query.redirect
        await router.push(redirectPath || '/')
      }
    }
  } catch (error) {
    toast.add({
      title: 'Gagal',
      description: error.data?.message || 'Gagal mendaftar dengan Google. Coba lagi.',
      color: 'red'
    })

    console.error(error)
  } finally {
    isLoading.value = false
  }
}

const handleRegisterAnother = () => {
  showEmailSentMessage.value = false
}
</script>

<template>
  <section
    class="min-h-screen bg-[#0A192F] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans selection:bg-orange-200 selection:text-orange-900">

    <div
      class="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-[100px] pointer-events-none">
    </div>
    <div
      class="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-500/20 rounded-full blur-[100px] pointer-events-none">
    </div>

    <main class="w-full max-w-5xl relative z-10 my-8">

      <article
        class="bg-white rounded-[2rem] sm:rounded-[3rem] shadow-2xl flex flex-col lg:flex-row overflow-hidden border border-white/20">

        <div
          class="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 p-12 text-white relative overflow-hidden">
          <div
            class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZyI+PHBhdGggZD0iTTEgMWgydjExeiIgZmlsbD0icmdiYSgyNTUsIDI1NSLCAyNTUsIDAuMSkiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvc3ZnPg==')] opacity-20">
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
              Mulai Perjalananmu 🎯
            </div>
            <h1 class="text-4xl xl:text-5xl font-extrabold leading-tight mb-6">
              Satu Langkah <br />
              Menuju <span class="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-300">Seragam
                ASN.</span>
            </h1>
            <p class="text-blue-100 text-lg leading-relaxed max-w-md font-medium">
              Akses sistem simulasi CAT yang dirancang khusus untuk menguji dan melatih kesiapanmu menghadapi seleksi resmi.
            </p>
          </div>

          <div
            class="relative z-10 bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl mt-12 space-y-3">
            <div class="flex items-center gap-3">
              <div class="w-6 h-6 rounded-full bg-green-400/20 text-green-300 flex items-center justify-center">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd" />
                </svg>
              </div>
              <span class="text-sm font-semibold">Simulasi CAT </span>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-6 h-6 rounded-full bg-green-400/20 text-green-300 flex items-center justify-center">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd" />
                </svg>
              </div>
              <span class="text-sm font-semibold">Ranking Nasional </span>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-6 h-6 rounded-full bg-green-400/20 text-green-300 flex items-center justify-center">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd" />
                </svg>
              </div>
              <span class="text-sm font-semibold">Pembahasan Soal</span>
            </div>
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
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Kembali ke Beranda
            </NuxtLink>
          </div>

          <div v-if="showEmailSentMessage" class="animate-scale-in">
            <div class="text-center">
              <div
                class="w-24 h-24 bg-green-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner border border-green-200">
                <svg class="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>

              <h2 class="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">Cek Email Kamu! 🎉</h2>
              <p class="text-slate-500 font-medium mb-1">Tautan verifikasi akun telah dikirimkan ke:</p>
              <p
                class="text-indigo-600 font-extrabold text-lg mb-8 break-all bg-indigo-50 py-2 px-4 rounded-xl inline-block border border-indigo-100">
                {{ registeredEmail }}
              </p>

              <div class="bg-slate-50 border-2 border-slate-100 rounded-2xl p-6 mb-8 text-left">
                <p class="text-sm text-slate-800 font-extrabold flex items-center gap-2 mb-4 uppercase tracking-wider">
                  <span class="w-2 h-2 rounded-full bg-orange-500"></span>
                  Langkah Selanjutnya:
                </p>

                <ul class="text-slate-600 space-y-3 font-medium">
                  <li class="flex items-start gap-3">
                    <span
                      class="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm">
                      1
                    </span>
                    <span>
                      Buka kotak masuk <strong>(Inbox)</strong> di aplikasi email kamu.
                    </span>
                  </li>

                  <li class="flex items-start gap-3">
                    <span
                      class="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm">
                      2
                    </span>
                    <span>
                      Cari email verifikasi dari tim <strong>Nyoba ASN</strong>.
                    </span>
                  </li>

                  <li class="flex items-start gap-3">
                    <span
                      class="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm">
                      3
                    </span>
                    <span>
                      Jika tidak ada di Inbox, cek folder <strong>Spam</strong>, <strong>Promosi</strong>, atau
                      <strong>Junk</strong>.
                    </span>
                  </li>

                  <li class="flex items-start gap-3">
                    <span
                      class="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm">
                      4
                    </span>
                    <span>
                      Klik tombol <strong>"Verifikasi Email"</strong> di dalam pesan tersebut.
                    </span>
                  </li>
                </ul>
              </div>

              <div class="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-8 text-left">
                <p class="text-sm text-orange-700 font-bold flex items-start gap-2">
                  <span class="text-lg leading-none">💡</span>
                  <span>
                    Belum menerima email? Tunggu sekitar 1-2 menit, lalu cek kembali folder Inbox, Spam, Promosi,
                    atau Junk.
                  </span>
                </p>
              </div>

              <div class="space-y-4">
                <a href="https://mail.google.com/" target="_blank"
                  class="w-full flex justify-center items-center gap-2 bg-white border-2 border-indigo-600 text-indigo-600 py-3.5 rounded-2xl font-extrabold hover:bg-indigo-50 transition-all active:scale-[0.98]">
                  <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
                  </svg>
                  Buka Gmail Sekarang
                </a>

                <button @click="router.push('/auth/sign-in')"
                  class="w-full bg-gradient-to-r from-orange-500 to-orange-400 text-white py-3.5 rounded-2xl font-extrabold hover:shadow-[0_0_20px_-5px_rgba(249,115,22,0.5)] transition-all active:scale-[0.98]">
                  Lanjut ke Halaman Login
                </button>

                <button @click="handleRegisterAnother"
                  class="w-full text-slate-500 text-sm font-bold hover:text-slate-800 transition-colors mt-4">
                  Batal, ingin daftar akun lain
                </button>
              </div>
            </div>
          </div>

          <div v-else class="animate-scale-in">
            <header class="mb-6">
              <h2 class="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">
                Buat Akun Baru
              </h2>
              <p class="text-slate-500 font-medium">Lengkapi data di bawah ini atau daftar dengan cepat.</p>
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
                Atau daftar manual
              </span>
              <div class="flex-grow border-t border-slate-200"></div>
            </div>

            <form class="space-y-5" @submit.prevent="onSubmit">

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
                <label class="text-sm font-bold text-slate-700 ml-1">Username</label>
                <div class="relative group">
                  <div
                    class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input v-model="username" type="text" required :disabled="isLoading" placeholder="username_kamu"
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
                    placeholder="Buat password yang kuat"
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

              <div class="space-y-2">
                <label class="text-sm font-bold text-slate-700 ml-1">Konfirmasi Password</label>
                <div class="relative group">
                  <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors"
                    :class="isMatching ? 'text-red-500' : 'text-slate-400 group-focus-within:text-blue-500'">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <input :type="showUlangiPassword ? 'text' : 'password'" v-model="ulangi_password" required
                    :disabled="isLoading" placeholder="Ketik ulang password"
                    class="w-full pl-11 pr-12 py-3.5 border-2 rounded-2xl outline-none transition-all font-medium text-slate-900 placeholder:text-slate-400 disabled:opacity-60"
                    :class="isMatching ? 'bg-red-50 border-red-300 focus:border-red-500' : 'bg-slate-50 border-slate-100 focus:bg-white focus:ring-0 focus:border-blue-500'" />

                  <button type="button" @click="toggleShowUlangiPassword" tabindex="-1"
                    class="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none">
                    <svg v-if="!showUlangiPassword" class="w-5 h-5" fill="none" stroke="currentColor"
                      viewBox="0 0 24 24">
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
                <p v-if="isMatching" class="text-xs text-red-500 font-bold ml-1 mt-1">Password tidak cocok!</p>
              </div>

              <div class="pt-4">
                <button type="submit" :disabled="isLoading"
                  class="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-400 text-white rounded-2xl font-extrabold text-lg hover:shadow-[0_0_20px_-5px_rgba(249,115,22,0.5)] hover:scale-[1.02] transition-all disabled:opacity-70 disabled:hover:scale-100 disabled:hover:shadow-none flex items-center justify-center gap-2">
                  <svg v-if="isLoading" class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                    </path>
                  </svg>
                  <span>{{ isLoading ? 'Mendaftarkan Akun...' : 'Daftar Sekarang 🚀' }}</span>
                </button>
              </div>

            </form>

            <footer class="mt-8 text-center">
              <p class="text-slate-600 font-medium">
                Sudah punya akun?
                <NuxtLink to="/auth/sign-in"
                  class="text-indigo-600 font-extrabold hover:text-indigo-800 transition-colors ml-1">
                  Masuk di sini
                </NuxtLink>
              </p>
            </footer>

          </div>
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

@keyframes scale-in {
  0% {
    transform: scale(0.9);
    opacity: 0;
  }

  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.animate-scale-in {
  animation: scale-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
</style>