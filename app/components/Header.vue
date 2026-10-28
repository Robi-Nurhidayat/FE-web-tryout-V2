<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const { isLoggedIn, user, logout } = useAuthUser()
const { $api } = useNuxtApp()  // ✅ Tambah $api

const isMobileMenuOpen = ref(false)
const toggleMobileMenu = () => (isMobileMenuOpen.value = !isMobileMenuOpen.value)

const showMenu = ref(false)
const dropdownRef = ref(null)
const headerRef = ref(null)
const toggleMenu = () => { showMenu.value = !showMenu.value }

// =============================================
// PENDING TRANSACTION BADGE
// =============================================
const pendingCount = ref(0)

const fetchPendingCount = async () => {
  if (!isLoggedIn.value) return
  try {
    // ✅ Ganti $fetch → $api (auto inject baseURL, token, ngrok header)
    const res = await $api('/api/v1/transactions/history')
    const list = res?.data || []
    pendingCount.value = list.filter(t =>
      t.transactionStatus?.toUpperCase() === 'PENDING' &&
      t.expiredAt && new Date(t.expiredAt).getTime() > Date.now()
    ).length
  } catch {
    pendingCount.value = 0
  }
}

onMounted(() => {
  fetchPendingCount()
  document.addEventListener('click', handleOutsideClick)
})

// =============================================
// LOGOUT MODAL
// =============================================
const isLogoutModalOpen = ref(false)
const isLoggingOut = ref(false)

const triggerLogout = (event) => {
  if (event) { event.stopPropagation(); event.preventDefault() }
  showMenu.value = false
  isMobileMenuOpen.value = false
  isLogoutModalOpen.value = true
}

const closeLogoutModal = () => {
  if (!isLoggingOut.value) isLogoutModalOpen.value = false
}

const executeLogout = async () => {
  try {
    isLoggingOut.value = true
    await logout()
    if (process.client) localStorage.clear()
    pendingCount.value = 0
    closeLogoutModal()
  } catch (error) {
    console.error('Gagal logout:', error)
  } finally {
    isLoggingOut.value = false
  }
}

// =============================================
// OUTSIDE CLICK
// =============================================
const handleOutsideClick = (e) => {
  if (showMenu.value && !dropdownRef.value?.contains(e.target)) showMenu.value = false
  if (isMobileMenuOpen.value && !headerRef.value?.contains(e.target)) isMobileMenuOpen.value = false
}

onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideClick)
})
</script>

<template>
  <!-- 
    Header: bg-[#1e3a5f] di light mode (navy branded), dark:bg-[#1e293b] di dark mode (slate-800)
    Keduanya satu hue family biru-slate → harmonis saat toggle
  -->
  <header ref="headerRef"
    class="bg-[#1e3a5f] dark:bg-[#1e293b] text-white shadow-md fixed w-full top-0 z-50 transition-colors duration-300">
   <div class="max-w-7xl mx-auto w-full flex justify-between items-center px-4 md:px-8 py-3.5 h-[72px]">

      <NuxtLink to="/" class="flex items-center gap-2.5 group transition-opacity hover:opacity-80 cursor-pointer">
        <div
          class="bg-tryout-primary/10 p-1.5 rounded-xl text-tryout-primary group-hover:scale-105 transition-transform duration-300 shadow-sm border border-tryout-primary/20">
          <svg class="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
              d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z">
            </path>
          </svg>
        </div>

        <span class="text-xl sm:text-2xl font-black tracking-tigh">
          Nyoba<span class="text-tryout-primary">ASN</span>
        </span>
      </NuxtLink>

      <!-- ── Desktop Nav ── -->
      <nav class="hidden md:flex space-x-8 text-slate-200 font-medium">
        <NuxtLink to="/" class="hover:text-blue-300 transition" active-class="text-blue-300">
          Beranda
        </NuxtLink>
        <NuxtLink to="/paket" class="hover:text-blue-300 transition" active-class="text-blue-300">
          Paket Ujian
        </NuxtLink>
         <NuxtLink to="/kontak" class="hover:text-blue-300 transition" active-class="text-blue-300">
          Kontak
        </NuxtLink>
      </nav>

      <!-- ── Desktop Right Actions ── -->
      <div class="hidden md:flex items-center space-x-4">

        <ThemeSwitcher />

        <!-- Guest -->
        <template v-if="!isLoggedIn">
          <NuxtLink to="/auth/sign-in"
            class="px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded-lg font-medium transition">
            Sign In
          </NuxtLink>
          <NuxtLink to="/auth/sign-up"
            class="px-4 py-2 border border-blue-300/60 hover:bg-blue-400 hover:border-blue-400 hover:text-white rounded-lg font-medium transition">
            Sign Up
          </NuxtLink>
        </template>

        <!-- Logged In -->
        <template v-else>

          <!-- Transaksi shortcut -->
          <NuxtLink to="/transaksi"
            class="relative flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition text-sm font-medium">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Transaksi
            <span v-if="pendingCount > 0"
              class="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
              {{ pendingCount > 9 ? '9+' : pendingCount }}
            </span>
          </NuxtLink>

          <!-- Avatar Dropdown -->
          <div ref="dropdownRef" class="relative">
            <button @click="toggleMenu"
              class="flex items-center gap-3 cursor-pointer focus:outline-none hover:opacity-90 transition">
              <span class="text-sm font-medium text-slate-200">
                Halo, {{ user?.username || 'Peserta' }}
              </span>
              <div
                class="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg ring-2 ring-blue-400/40">
                {{ (user?.username || 'P').charAt(0).toUpperCase() }}
              </div>
            </button>

            <transition name="dropdown-fade">
              <!--
                Dropdown Card:
                  Light: bg-white, border slate-200, teks slate-700
                  Dark:  bg-slate-800, border slate-700, teks slate-200
              -->
              <div v-if="showMenu" class="absolute right-0 mt-4 w-56 rounded-xl shadow-xl py-3 z-50
                       bg-white dark:bg-slate-800
                       border border-slate-200 dark:border-slate-700
                       text-slate-700 dark:text-slate-200" @click.stop>
                <!-- User Info -->
                <div class="px-6 py-3 border-b border-slate-100 dark:border-slate-700 mb-2">
                  <p class="font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {{ user?.username }}
                  </p>
                  <p class="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {{ user?.email }}
                  </p>
                </div>

                <!-- Menu Items -->
                <NuxtLink to="/overview" class="flex items-center gap-3 px-6 py-2.5 text-sm font-medium transition
                         hover:bg-blue-50 hover:text-blue-600
                         dark:hover:bg-slate-700 dark:hover:text-blue-400" @click="showMenu = false">
                  <i class="pi pi-th-large"></i> Overview
                </NuxtLink>

                <NuxtLink to="/transaksi" class="flex items-center justify-between px-6 py-2.5 text-sm font-medium transition
                         hover:bg-blue-50 hover:text-blue-600
                         dark:hover:bg-slate-700 dark:hover:text-blue-400" @click="showMenu = false">
                  <span class="flex items-center gap-3">
                    <i class="pi pi-receipt"></i> Transaksi Saya
                  </span>
                  <span v-if="pendingCount > 0"
                    class="w-5 h-5 bg-amber-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                    {{ pendingCount > 9 ? '9+' : pendingCount }}
                  </span>
                </NuxtLink>

                <NuxtLink to="/my-packets" class="flex items-center gap-3 px-6 py-2.5 text-sm font-medium transition
                         hover:bg-blue-50 hover:text-blue-600
                         dark:hover:bg-slate-700 dark:hover:text-blue-400" @click="showMenu = false">
                  <i class="pi pi-file-edit"></i> My Packets
                </NuxtLink>

                <NuxtLink to="/profile" class="flex items-center gap-3 px-6 py-2.5 text-sm font-medium transition
                         hover:bg-blue-50 hover:text-blue-600
                         dark:hover:bg-slate-700 dark:hover:text-blue-400" @click="showMenu = false">
                  <i class="pi pi-user"></i> My Profile
                </NuxtLink>

                <NuxtLink to="/ulasan" class="flex items-center gap-3 px-6 py-2.5 text-sm font-medium transition
                         hover:bg-blue-50 hover:text-blue-600
                         dark:hover:bg-slate-700 dark:hover:text-blue-400" @click="showMenu = false">
                  <i class="pi pi-star-fill"></i> Ulasan
                </NuxtLink>


                <div class="h-px bg-slate-100 dark:bg-slate-700 my-2"></div>

                <button @click="triggerLogout" class="w-full text-left flex items-center gap-3 px-6 py-2.5 text-sm font-medium transition
                         text-red-500 hover:bg-red-50 hover:text-red-600
                         dark:hover:bg-red-900/20 dark:text-red-400 dark:hover:text-red-300">
                  <i class="pi pi-sign-out"></i> Logout
                </button>
              </div>
            </transition>
          </div>
        </template>
      </div>

      <!-- ── Mobile Right (ThemeSwitcher + Hamburger) ── -->
      <div class="flex md:hidden items-center gap-4">
        <ThemeSwitcher />
        <button @click="toggleMobileMenu" class="text-slate-300 hover:text-white focus:outline-none transition"
          :aria-label="isMobileMenuOpen ? 'Tutup menu' : 'Buka menu'">
          <i class="pi" :class="isMobileMenuOpen ? 'pi-times' : 'pi-bars'" style="font-size: 1.5rem;"></i>
        </button>
      </div>
    </div>

    <!-- ── Mobile Menu ── -->
    <transition name="slide-fade">
      <!--
        Mobile dropdown:
          Light: bg-[#1e3a5f] (tetap navy — branded)
          Dark:  bg-[#1e293b] (slate-800)
      -->
      <div v-if="isMobileMenuOpen" class="md:hidden px-6 py-4 space-y-3 transition-colors duration-300
               bg-[#1e3a5f] dark:bg-[#1e293b]
               border-t border-slate-600/50 dark:border-slate-700">
        <NuxtLink to="/" class="block text-slate-200 hover:text-blue-300 transition" @click="isMobileMenuOpen = false">
          Beranda
        </NuxtLink>
        <NuxtLink to="/paket" class="block text-slate-200 hover:text-blue-300 transition"
          @click="isMobileMenuOpen = false">
          Paket Ujian
        </NuxtLink>
         <NuxtLink to="/kontak" class="block text-slate-200 hover:text-blue-300 transition"
          @click="isMobileMenuOpen = false">
          Kontak
        </NuxtLink>

        <hr class="border-slate-600/50 dark:border-slate-700" />

        <!-- Guest Mobile -->
        <template v-if="!isLoggedIn">
          <NuxtLink to="/auth/sign-in"
            class="block bg-blue-500 hover:bg-blue-400 text-center py-2 rounded-lg transition font-medium"
            @click="isMobileMenuOpen = false">
            Sign In
          </NuxtLink>
          <NuxtLink to="/auth/sign-up"
            class="block border border-blue-300/60 text-center py-2 rounded-lg hover:bg-blue-400 hover:border-blue-400 hover:text-white transition font-medium"
            @click="isMobileMenuOpen = false">
            Sign Up
          </NuxtLink>
        </template>

        <!-- Logged In Mobile -->
        <template v-else>
          <div class="mb-3 px-2 flex items-center gap-3">
            <div
              class="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold ring-2 ring-blue-400/40">
              {{ (user?.username || 'P').charAt(0).toUpperCase() }}
            </div>
            <div>
              <p class="font-bold text-sm truncate text-white">{{ user?.username }}</p>
              <p class="text-xs text-slate-400 truncate">{{ user?.email }}</p>
            </div>
          </div>

          <NuxtLink to="/overview"
            class="flex items-center gap-3 px-2 py-2 text-slate-200 hover:text-blue-300 transition text-sm font-medium"
            @click="isMobileMenuOpen = false">
            <i class="pi pi-th-large"></i> Overview
          </NuxtLink>

          <NuxtLink to="/transaksi"
            class="flex items-center justify-between px-2 py-2 text-slate-200 hover:text-blue-300 transition text-sm font-medium"
            @click="isMobileMenuOpen = false">
            <span class="flex items-center gap-3">
              <i class="pi pi-receipt"></i> Transaksi Saya
            </span>
            <span v-if="pendingCount > 0"
              class="w-5 h-5 bg-amber-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
              {{ pendingCount > 9 ? '9+' : pendingCount }}
            </span>
          </NuxtLink>

          <NuxtLink to="/my-packets"
            class="flex items-center gap-3 px-2 py-2 text-slate-200 hover:text-blue-300 transition text-sm font-medium"
            @click="isMobileMenuOpen = false">
            <i class="pi pi-file-edit"></i> My Packets
          </NuxtLink>

          <NuxtLink to="/profile"
            class="flex items-center gap-3 px-2 py-2 text-slate-200 hover:text-blue-300 transition text-sm font-medium"
            @click="isMobileMenuOpen = false">
            <i class="pi pi-user"></i> My Profile
          </NuxtLink>


          <NuxtLink to="/profile"
            class="flex items-center gap-3 px-2 py-2 text-slate-200 hover:text-blue-300 transition text-sm font-medium"
            @click="isMobileMenuOpen = false">
            <i class="pi pi-star-fill"></i> Ulasan
          </NuxtLink>

          <button @click="triggerLogout"
            class="w-full mt-2 border border-red-400/70 text-red-400 text-center py-2 rounded-lg hover:bg-red-500 hover:border-red-500 hover:text-white transition font-medium">
            Logout
          </button>
        </template>
      </div>
    </transition>

    <!-- ── Logout Modal ── -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="isLogoutModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <!-- Backdrop -->
          <div class="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/70 backdrop-blur-sm" @click="closeLogoutModal">
          </div>

          <!-- Modal Card -->
          <div class="relative z-10 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden
                   bg-white dark:bg-slate-800">
            <!-- Icon area -->
            <div class="p-6 flex justify-center border-b
                     bg-red-50 dark:bg-red-900/20
                     border-red-100 dark:border-red-900/30">
              <div class="w-16 h-16 rounded-full flex items-center justify-center bg-red-100 dark:bg-red-900/40">
                <svg class="w-8 h-8 text-red-600 dark:text-red-400 ml-1" fill="none" stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
            </div>

            <!-- Body -->
            <div class="p-6 text-center">
              <h3 class="text-xl font-extrabold mb-2 text-slate-900 dark:text-slate-100">
                Keluar Aplikasi?
              </h3>
              <p class="text-sm text-slate-500 dark:text-slate-400">
                Apakah Anda yakin ingin mengakhiri sesi dan keluar dari akun Anda?
              </p>
            </div>

            <!-- Actions -->
            <div class="p-6 flex gap-3
                     bg-slate-50 dark:bg-slate-900/40
                     border-t border-slate-100 dark:border-slate-700">
              <button @click="closeLogoutModal" :disabled="isLoggingOut" class="flex-1 px-4 py-2.5 font-bold rounded-xl transition disabled:opacity-50
                       bg-white dark:bg-slate-700
                       border border-slate-300 dark:border-slate-600
                       text-slate-700 dark:text-slate-200
                       hover:bg-slate-100 dark:hover:bg-slate-600">
                Batal
              </button>
              <button @click="executeLogout" :disabled="isLoggingOut" class="flex-1 px-4 py-2.5 font-bold rounded-xl transition flex justify-center items-center gap-2 disabled:opacity-70
                       bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600
                       text-white">
                <svg v-if="isLoggingOut" class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {{ isLoggingOut ? 'Keluar...' : 'Ya, Keluar' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </header>
</template>

<style scoped>
/* Mobile menu slide */
.slide-fade-enter-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-fade-leave-active {
  transition: all 0.2s ease;
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Dropdown */
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: all 0.2s ease;
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

/* Logout modal */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>