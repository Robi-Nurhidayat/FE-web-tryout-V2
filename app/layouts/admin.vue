<script setup>
import { onMounted } from 'vue'

const isSidebarOpen = useState('adminSidebarOpen', () => true)

// ✅ Otomatis tutup sidebar jika diakses dari layar HP
onMounted(() => {
  if (window.innerWidth < 768) {
    isSidebarOpen.value = false
  }
})
</script>

<template>
  <div class="min-h-screen bg-tryout-bg text-tryout-text flex flex-col font-sans transition-colors duration-300 overflow-x-hidden">
    
    <LayoutsAdminHeader />
    
    <div class="flex flex-1 pt-16 relative">
      
      <transition name="fade">
        <div 
          v-if="isSidebarOpen" 
          @click="isSidebarOpen = false" 
          class="md:hidden fixed inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm z-30"
        ></div>
      </transition>

      <LayoutsAdminSidebar />
      
      <div 
        class="flex-1 px-4 sm:px-5 pt-6 pb-10 min-h-[calc(100vh-4rem)] transition-all duration-300 w-full"
        :class="isSidebarOpen ? 'md:ml-64 ml-0' : 'ml-0'"
      >
        <slot />
      </div>
      
    </div>
    
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>