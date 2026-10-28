<script setup>
definePageMeta({
  layout: 'admin',
})

const router = useRouter()
const route = useRoute()
const toast = useToast()
const { $api } = useNuxtApp()

const id = route.params.id
const title = ref('')
const categoryId = ref(null)
const isLoading = ref(false)

// ✅ Track original values
const originalData = ref({})

// ✅ Fetch categories
const { data: categoriesData } = await useAsyncData('categories', () =>
  $api('/api/v1/categories')
)
const categories = computed(() => categoriesData.value?.data || [])

// ✅ Fetch sub category data
const { data: subCategoryData, pending: isFetching } = await useAsyncData(
  `sub-category-${id}`,
  () => $api(`/api/v1/sub-categories/${id}`)
)

// Set form values
if (subCategoryData.value?.data) {
  const data = subCategoryData.value.data
  title.value = data.title || ''
  categoryId.value = data.categoryId ? Number(data.categoryId) : null
  
  // ✅ Store original values
  originalData.value = {
    title: data.title || '',
    categoryId: data.categoryId ? Number(data.categoryId) : null
  }
}

// ✅ Check if form has changes
const hasChanges = computed(() => {
  return title.value !== originalData.value.title ||
         categoryId.value !== originalData.value.categoryId
})

const submitForm = async () => {
  // ✅ Validation
  if (!title.value.trim()) {
    toast.add({
      title: 'Validasi Gagal',
      description: 'Judul sub kategori wajib diisi',
      color: 'amber'
    })
    return
  }
  
  if (!categoryId.value) {
    toast.add({
      title: 'Validasi Gagal',
      description: 'Kategori wajib dipilih',
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
    
    // ✅ PUT dengan $api
    const response = await $api(`/api/v1/sub-categories/${id}`, {
      method: 'PUT',
      body: {
        title: title.value.trim(),
        categoryId: Number(categoryId.value),
      },
    })

    if (response?.statusCode === 200) {
      // ✅ Success toast
      toast.add({
        title: 'Berhasil!',
        description: 'Sub kategori berhasil diperbarui',
        color: 'green'
      })

      // ✅ Redirect setelah 500ms
      setTimeout(() => {
        router.push('/admin/sub-categories')
      }, 500)
    } else {
      toast.add({
        title: 'Gagal',
        description: 'Gagal memperbarui sub kategori',
        color: 'red'
      })
    }
  } catch (error) {
    console.error('Error:', error)
    
    // ✅ Error toast
    toast.add({
      title: 'Error',
      description: error?.data?.message || 'Gagal memperbarui sub kategori',
      color: 'red'
    })
  } finally {
    isLoading.value = false
  }
}

// ✅ Handle cancel dengan native confirm
const handleCancel = () => {
  // Jika tidak ada perubahan, langsung kembali
  if (!hasChanges.value) {
    router.push('/admin/sub-categories')
    return
  }

  // Jika ada perubahan, confirm dulu
  if (confirm('Anda memiliki perubahan yang belum disimpan.\n\nYakin ingin membatalkan?')) {
    toast.add({
      title: 'Dibatalkan',
      description: 'Perubahan dibatalkan',
      color: 'gray'
    })
    router.push('/admin/sub-categories')
  }
}
</script>

<template>
  <main class="min-h-screen bg-tryout-bg p-4 sm:p-6 lg:p-8 transition-colors duration-300">
    <div class="max-w-lg mx-auto bg-tryout-surface border border-tryout-border rounded-2xl shadow-sm p-5 sm:p-6 md:p-8 transition-colors duration-300 mt-4 sm:mt-0">
      <h1 class="text-xl sm:text-2xl font-bold text-tryout-text mb-6">Edit Sub Kategori</h1>

      <div v-if="isFetching" class="text-center py-8">
        <div class="animate-spin rounded-full h-10 w-10 border-4 border-tryout-border border-t-tryout-primary mx-auto mb-4"></div>
        <p class="text-sm font-medium text-tryout-muted">Memuat data sub kategori...</p>
      </div>

      <form v-else @submit.prevent="submitForm" class="space-y-5">
        <div>
          <label class="block text-tryout-text text-sm sm:text-base mb-1.5 font-medium">
            Judul Sub Kategori <span class="text-red-500 dark:text-red-400">*</span>
          </label>
          <input
            v-model="title"
            type="text"
            placeholder="Masukkan nama sub kategori"
            class="w-full px-4 py-2.5 sm:py-2 border border-tryout-border rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none transition-shadow text-sm sm:text-base"
            :disabled="isLoading"
          />
        </div>

        <div>
          <label class="block text-tryout-text text-sm sm:text-base mb-1.5 font-medium">
            Kategori Induk <span class="text-red-500 dark:text-red-400">*</span>
          </label>
          <select
            v-model="categoryId"
            class="w-full px-4 py-2.5 sm:py-2 border border-tryout-border rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none transition-shadow cursor-pointer text-sm sm:text-base"
            :disabled="isLoading"
          >
            <option :value="null">-- Pilih Kategori --</option>
            <option
              v-for="category in categories"
              :key="category.id"
              :value="category.id"
            >
              {{ category.title }}
            </option>
          </select>
        </div>

        <div v-if="hasChanges" class="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-lg p-3 sm:p-4 mt-4 transition-colors">
          <p class="text-sm text-amber-800 dark:text-amber-400 flex items-center gap-2 font-medium">
            <svg class="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Ada perubahan yang belum disimpan
          </p>
        </div>

        <div class="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-lg p-3 sm:p-4 mt-2 transition-colors">
          <p class="text-sm text-blue-800 dark:text-blue-300 flex items-center gap-2 font-medium">
            <svg class="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span><span class="text-red-500 dark:text-red-400 font-bold">*</span> = Wajib diisi</span>
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