<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useAuthUser } from '@/composables/useAuthUser'

// ✅ Panggil state sidebar
const isSidebarOpen = useState('adminSidebarOpen')

const showMenu = ref(false)
const dropdownRef = ref(null)
const { user, logout } = useAuthUser()

const toggleMenu = () => { showMenu.value = !showMenu.value }

// ✅ Fungsi untuk buka/tutup sidebar
const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

const handleLogout = async (event) => {
  event.stopPropagation(); 
  event.preventDefault();
  showMenu.value = false; 
  await logout(); 
}

const handleOutsideClick = (e) => {
  const target = e.target
  const insideDropdown = dropdownRef.value?.contains(target)
  if (showMenu.value && !insideDropdown) {
    showMenu.value = false
  }
}

onMounted(() => document.addEventListener('click', handleOutsideClick))
onBeforeUnmount(() => document.removeEventListener('click', handleOutsideClick))
</script>

<template>
  <header class="bg-tryout-navbar text-tryout-navbar-text shadow-md flex justify-between items-center px-4 md:px-6 h-16 z-50 fixed w-full top-0 transition-colors duration-300">
    
    <div class="flex items-center gap-4 md:w-56">
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
      
      <button 
        @click="toggleSidebar" 
        class="p-2 rounded-lg hover:bg-tryout-surface/10 transition-colors focus:outline-none"
        title="Toggle Sidebar"
      >
        <i class="pi pi-bars text-xl"></i>
      </button>
    </div>

    <div class="hidden md:block text-sm font-medium opacity-80">
      Admin Workspace
    </div>

    <div class="flex items-center gap-4 md:gap-6">
      <ThemeSwitcher />

      <div ref="dropdownRef" class="flex items-center gap-3 cursor-pointer relative hover:opacity-90 transition-opacity" @click="toggleMenu">
        <p class="text-sm font-medium hidden sm:block">Hai, {{ user?.username || 'Admin' }}</p>
        <div class="w-9 h-9 flex items-center justify-center bg-tryout-primary text-white rounded-full shadow-inner">
          <i class="pi pi-user text-sm"></i>
        </div>

        <transition name="fade">
          <div v-if="showMenu" class="absolute top-12 right-0 bg-tryout-surface text-tryout-text rounded-xl shadow-xl py-2 w-48 z-50 border border-tryout-border text-sm" @click.stop>
            <div class="px-4 py-2 border-b border-tryout-divider mb-1">
              <p class="font-bold truncate">{{ user?.username }}</p>
              <p class="text-xs text-tryout-muted">Administrator</p>
            </div>
            <ul>
              <li><NuxtLink to="/admin/profile" class="flex items-center gap-3 px-4 py-2 hover:bg-tryout-hover transition-colors" @click="showMenu = false"><i class="pi pi-user text-xs"></i> Profil Admin</NuxtLink></li>
              <li><NuxtLink to="/" target="_blank" class="flex items-center gap-3 px-4 py-2 hover:bg-tryout-hover transition-colors" @click="showMenu = false"><i class="pi pi-external-link text-xs"></i> Lihat Website</NuxtLink></li>
              <div class="h-px bg-tryout-divider my-1"></div>
              <li><button class="w-full text-left flex items-center gap-3 px-4 py-2 text-red-500 hover:bg-red-500/10 transition-colors font-medium" @click="handleLogout"><i class="pi pi-sign-out text-xs"></i> Logout</button></li>
            </ul>
          </div>
        </transition>
      </div>
    </div>
  </header>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-5px); }
</style>