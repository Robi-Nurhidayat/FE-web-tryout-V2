<script setup>

const toaster = { position: 'top-center',duration: 3000 }

useHead({
  script: [
    {
      src: 'https://app.sandbox.midtrans.com/snap/snap.js',
      'data-client-key': 'SB-Mid-client-pBnbcUZI93exikG9',
      type: 'text/javascript'
    }
  ]
})

</script>

<template>
  <UApp :toaster="toaster">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>