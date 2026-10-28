<script setup>
definePageMeta({
  layout: 'admin',
})

const router = useRouter()
const { $api } = useNuxtApp()
const toast = useToast()

const title = ref('')
const isLoading = ref(false)

// ✅ DEBUG: Check token on mount
onMounted(() => {
  const authToken = useCookie('auth_token')
  const authUser = useCookie('auth_user')
  
  // console.log('🔑 Auth Token:', authToken.value)
  // console.log('👤 Auth User:', authUser.value)
  
  // Decode JWT to check authorities
  if (authToken.value) {
    try {
      const tokenParts = authToken.value.split('.')
      const payload = JSON.parse(atob(tokenParts[1]))
      // console.log('📦 JWT Payload:', payload)
      // console.log('🛡️ Authorities:', payload.authorities)
      // console.log('👤 Username:', payload.username || payload.sub)
    } catch (e) {
      console.error('❌ Failed to decode token:', e)
    }
  } else {
    console.error('❌ No token found!')
  }
})

const submitForm = async () => {
  if (!title.value.trim()) {
    toast.add({
      title: 'Validasi Gagal',
      description: 'Judul category wajib diisi',
      color: 'amber'
    })
    return
  }

  try {
    isLoading.value = true
    
    // console.log('📤 Submitting:', { title: title.value.trim() })
    
    const response = await $api('/api/v1/categories', {
      method: 'POST',
      body: {
        title: title.value.trim(),
      }
    })

    // console.log('✅ Success:', response)

    toast.add({
      title: 'Berhasil!',
      description: 'Category berhasil ditambahkan',
      color: 'green'
    })
    
    setTimeout(() => {
      router.push('/admin/categories')
    }, 500)

  } catch (error) {
    console.error('❌ Error saat submit:', error)
    
    // Check error details
    // console.log('Error status:', error?.status)
    // console.log('Error data:', error?.data)
    // console.log('Error response:', error?.response)
    
    if (error?.status === 403) {
      toast.add({
        title: 'Akses Ditolak',
        description: 'Anda tidak memiliki izin untuk membuat category. Pastikan Anda login sebagai ADMIN.',
        color: 'red'
      })
    } else {
      toast.add({
        title: 'Error',
        description: error?.data?.message || 'Gagal menyimpan category',
        color: 'red'
      })
    }
    
  } finally {
    isLoading.value = false
  }
}

const handleCancel = () => {
  if (!title.value.trim()) {
    router.push('/admin/categories')
    return
  }
  
  if (confirm('Batal menyimpan kategori ini?')) {
    router.push('/admin/categories')
  }
}
</script>

<template>
  <main class="min-h-screen bg-tryout-bg p-4 sm:p-6 lg:p-8 transition-colors duration-300">
    <div class="max-w-lg mx-auto bg-tryout-surface border border-tryout-border rounded-2xl shadow-sm p-5 sm:p-6 md:p-8 transition-colors duration-300 mt-4 sm:mt-0">
      <h1 class="text-xl sm:text-2xl font-bold text-tryout-text mb-6">Tambah Category</h1>

      <form @submit.prevent="submitForm" class="space-y-4">
        <div>
          <label class="block text-tryout-text text-sm sm:text-base mb-1.5 font-medium">
            Judul Category <span class="text-red-500 dark:text-red-400">*</span>
          </label>
          <input
            v-model="title"
            type="text"
            placeholder="Masukkan nama category (contoh: CPNS)"
            class="w-full px-4 py-2.5 sm:py-2 border border-tryout-border rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none transition-shadow text-sm sm:text-base"
            :disabled="isLoading"
          />
          <p class="text-xs text-tryout-muted mt-1.5">
            * Wajib diisi
          </p>
        </div>

        <div class="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-8">
          <button
            type="button"
            @click="handleCancel"
            :disabled="isLoading"
            class="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-tryout-border bg-tryout-surface text-tryout-text font-bold hover:bg-tryout-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            Batal
          </button>
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full sm:w-auto px-5 py-2.5 cursor-pointer rounded-lg bg-tryout-primary text-white font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] shadow-sm"
          >
            <svg 
              v-if="isLoading" 
              class="animate-spin h-4 w-4" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isLoading ? 'Menyimpan...' : 'Simpan' }}
          </button>
        </div>
      </form>
    </div>
  </main>
</template>