<script setup>
definePageMeta({
  layout: 'admin',
})

const router = useRouter()
const toast = useToast()
const { $api } = useNuxtApp()

const title = ref('')
const isLoading = ref(false)

const submitForm = async () => {
  // ✅ Validation
  if (!title.value.trim()) {
    toast.add({
      title: 'Validasi Gagal',
      description: 'Judul position wajib diisi',
      color: 'amber'
    })
    return
  }

  try {
    isLoading.value = true

    const response = await $api('/api/v1/positions', {
      method: 'POST',
      body: {
        title: title.value.trim(),
      },
    })

    if (response?.statusCode === 201) {
      // ✅ Success toast
      toast.add({
        title: 'Berhasil!',
        description: 'Position berhasil ditambahkan',
        color: 'green'
      })

      // ✅ Redirect setelah 500ms
      setTimeout(() => {
        router.push('/admin/positions')
      }, 500)
    } else {
      toast.add({
        title: 'Gagal',
        description: 'Gagal menambahkan position',
        color: 'red'
      })
    }
  } catch (error) {
    console.error('Error:', error)
    
    // ✅ Error toast
    toast.add({
      title: 'Error',
      description: error?.data?.message || 'Gagal menambahkan position',
      color: 'red'
    })
  } finally {
    isLoading.value = false
  }
}

// ✅ Handle cancel
const handleCancel = () => {
  if (!title.value.trim()) {
    router.push('/admin/positions')
    return
  }
  
  if (confirm('Data yang sudah diisi akan hilang. Yakin ingin membatalkan?')) {
    router.push('/admin/positions')
  }
}
</script>

<template>
  <main class="min-h-screen bg-tryout-bg p-4 sm:p-6 lg:p-8 transition-colors duration-300">
    <div class="max-w-lg mx-auto bg-tryout-surface border border-tryout-border rounded-2xl shadow-sm p-5 sm:p-6 md:p-8 transition-colors duration-300 mt-4 sm:mt-0">
      <h1 class="text-xl sm:text-2xl font-bold text-tryout-text mb-6">Tambah Position</h1>

      <form @submit.prevent="submitForm" class="space-y-4">
        <div>
          <label class="block text-tryout-text text-sm sm:text-base mb-1.5 font-medium">
            Judul Position <span class="text-red-500 dark:text-red-400">*</span>
          </label>
          <input
            v-model="title"
            type="text"
            placeholder="Masukkan nama position"
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
              class="animate-spin h-4 w-4 flex-shrink-0" 
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