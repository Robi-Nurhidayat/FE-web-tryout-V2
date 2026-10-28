<script setup>
import Header from '~/components/Header.vue'
import Footer from '~/components/Footer.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col bg-slate-950">
    <Header />

    <main class="flex-grow mt-12">
      <slot />
    </main>

    <Footer />
  </div>
</template>