export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  
  const api = $fetch.create({
    baseURL: config.public.apiBaseUrl,

    onRequest({ request, options }) {
      const authToken = useCookie('auth_token')
      
      const headers = {
        ...options.headers,
        'ngrok-skip-browser-warning': 'true'
      }
      
      // ✅ Kirim token RAW tanpa Bearer (Sesuai setting backend Anda)
      if (authToken.value) {
        headers['Authorization'] = authToken.value
      }
      
      // ✅ Only set Content-Type for JSON
      if (options.method !== 'GET' && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json'
      }
      
      options.headers = headers
      
      // if (process.dev) console.log('📤 Request:', options.method, request)
    },

    onResponseError({ response }) {
      // HAPUS useToast() dari sini agar tidak bentrok (Error inject)
      if (process.dev) console.error('❌ Error API:', response.status, response._data)
      
      // Handle sesi habis
      if (response.status === 401) {
        useCookie('auth_token').value = null
        useCookie('auth_user').value = null
        navigateTo('/auth/sign-in')
      }
    }
  })

  return { provide: { api } }
})