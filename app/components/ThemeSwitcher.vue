<script setup>
const colorMode = useColorMode()

const setPreference = (mode) => {
  colorMode.preference = mode
}
</script>

<template>
  <ClientOnly>
    <div class="relative inline-flex items-center bg-slate-200 dark:bg-slate-800 rounded-full p-1 shadow-inner">
      
      <div
        class="absolute w-8 h-8 bg-white dark:bg-slate-600 rounded-full shadow-sm transition-transform duration-300 ease-spring scale-90"
        :class="colorMode.preference === 'dark' ? 'translate-x-full' : 'translate-x-0'"
      ></div>

      <button 
        @click="setPreference('light')" 
        class="relative w-8 h-8 flex items-center justify-center z-10 transition-colors duration-300"
        :class="colorMode.preference !== 'dark' ? 'text-amber-500' : 'text-slate-400 hover:text-slate-500 dark:hover:text-slate-300'"
        title="Mode Terang"
        aria-label="Mode Terang"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </button>

      <button 
        @click="setPreference('dark')" 
        class="relative w-8 h-8 flex items-center justify-center z-10 transition-colors duration-300"
        :class="colorMode.preference === 'dark' ? 'text-white' : 'text-slate-400 hover:text-slate-500 dark:hover:text-slate-300'"
        title="Mode Gelap"
        aria-label="Mode Gelap"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      </button>
    </div>

    <template #fallback>
      <div class="w-[72px] h-[40px] bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse"></div>
    </template>
  </ClientOnly>
</template>

<style scoped>
/* Memperhalus animasi pantulan saat digeser */
.ease-spring {
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1.2);
}
</style>