<script setup>
import Header from '~/components/Header.vue';
</script>

<template>
  <div class="min-h-screen flex flex-col font-sans transition-colors duration-300 bg-tryout-bg">
    <Header />

    <div class="flex flex-1 pt-[72px]">

      <LayoutsUserSidebar />

      <div class="flex-1 flex flex-col min-h-[calc(100vh-72px)] w-full overflow-hidden">
        <main class="flex-1 p-4 md:p-6 lg:p-8">
          <slot />
        </main>
      </div>

    </div>
  </div>
</template>