// https://nuxt.com/docs/api/configuration/nuxt-config

// import tailwindcss from "@tailwindcss/vite";

// export default defineNuxtConfig({
//   compatibilityDate: '2025-07-15',
//   devtools: { enabled: true },
//   modules: ['@nuxt/eslint']
// })

// import tailwindcss from "@tailwindcss/vite";

// export default defineNuxtConfig({
//   ssr: false,
//   compatibilityDate: "2025-07-15",
//   devtools: { enabled: true },
//   runtimeConfig: {
//     public: {
//       // Ambil dari .env, fallback ke localhost jika tidak ada
//       apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:9000'
//     }
//   },
//   css: ['~/assets/css/main.css'],
//   vite: {
//     plugins: [
//       tailwindcss(),
//     ],
//   },
// });

import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxtjs/color-mode'],
  ssr: false,
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:9000',
      googleClientId: process.env.NUXT_PUBLIC_GOOGLE_CLIENT_ID || ''
    }
  },

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: true,
      proxy:{}
    }
  },
   app: {
    head: {
      title: 'Nyoba ASN',
      link: [
        {
          rel: 'icon',
          type: 'image/png',
          href: '/nyobaasn.png'
        }
      ]
    }
  }
});