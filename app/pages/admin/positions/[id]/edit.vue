<script setup>
definePageMeta({
  layout: 'admin',
})

const router = useRouter()
const route = useRoute()
const toast = useToast()
const { $api } = useNuxtApp()

const positionId = route.params.id
const title = ref('')
const originalTitle = ref('') // Track original value
const isLoading = ref(false)

// ✅ Fetch position data
const { data: response } = await useAsyncData(`position-${positionId}`, () =>
  $api(`/api/v1/positions/${positionId}`)
)

// Set values
if (response.value?.data) {
  title.value = response.value.data.title
  originalTitle.value = response.value.data.title
}

// ✅ Check if form has changes
const hasChanges = computed(() => {
  return title.value.trim() !== originalTitle.value
})

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

  // ✅ Check if no changes
  if (!hasChanges.value) {
    toast.add({
      title: 'Tidak Ada Perubahan',
      description: 'Tidak ada perubahan yang perlu disimpan',
      color: 'blue'
    })
    return
  }

  try {
    isLoading.value = true

    const response = await $api(`/api/v1/positions/${positionId}`, {
      method: 'PUT',
      body: {
        title: title.value.trim(),
      },
    })

    if (response?.statusCode === 200) {
      // ✅ Success toast
      toast.add({
        title: 'Berhasil!',
        description: 'Position berhasil diperbarui',
        color: 'green'
      })

      // ✅ Redirect setelah 500ms
      setTimeout(() => {
        router.push('/admin/positions')
      }, 500)
    } else {
      toast.add({
        title: 'Gagal',
        description: 'Gagal memperbarui position',
        color: 'red'
      })
    }
  } catch (error) {
    console.error('Error:', error)
    
    // ✅ Error toast
    toast.add({
      title: 'Error',
      description: error?.data?.message || 'Gagal memperbarui position',
      color: 'red'
    })
  } finally {
    isLoading.value = false
  }
}

// ✅ Handle cancel
const handleCancel = () => {
  // Jika tidak ada perubahan, langsung kembali
  if (!hasChanges.value) {
    router.push('/admin/positions')
    return
  }

  // Jika ada perubahan, confirm dulu
  if (confirm('Anda memiliki perubahan yang belum disimpan.\n\nYakin ingin membatalkan?')) {
    toast.add({
      title: 'Dibatalkan',
      description: 'Perubahan dibatalkan',
      color: 'gray'
    })
    router.push('/admin/positions')
  }
}
</script>

<template>
  <main class="min-h-screen bg-tryout-bg p-4 sm:p-6 lg:p-8 transition-colors duration-300">
    <div class="max-w-lg mx-auto bg-tryout-surface border border-tryout-border rounded-2xl shadow-sm p-5 sm:p-6 md:p-8 transition-colors duration-300 mt-4 sm:mt-0">
      <h1 class="text-xl sm:text-2xl font-bold text-tryout-text mb-6">Edit Position</h1>

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

        <div v-if="hasChanges" class="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-lg p-3 sm:p-4 mt-4 transition-colors">
          <p class="text-sm text-amber-800 dark:text-amber-400 flex items-center gap-2 font-medium">
            <svg class="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Ada perubahan yang belum disimpan
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
            :disabled="isLoading || !hasChanges"
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
            {{ isLoading ? 'Menyimpan...' : 'Simpan Perubahan' }}
          </button>
        </div>
      </form>
    </div>
  </main>
</template>