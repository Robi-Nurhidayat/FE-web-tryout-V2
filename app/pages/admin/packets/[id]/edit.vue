<script setup>
definePageMeta({
  layout: 'admin',
})

const router = useRouter()
const route = useRoute()
const id = String(route.params.id)

const title = ref('')
const category = ref('')
const subCategory = ref('')
const position = ref('')
const description = ref('')
const price = ref('')
const urlGroup = ref('')
const isLoading = ref(false)

const originalData = ref({})

const { $api } = useNuxtApp()
const toast = useToast()

const normalizePriceForInput = (value) => {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value)
}

const toNumberOrNull = (value) => {
  if (value === '' || value === null || value === undefined) {
    return null
  }

  const numberValue = Number(value)

  if (Number.isNaN(numberValue)) {
    return null
  }

  return numberValue
}

// ✅ Fetch packet data
const {
  data: packetData,
  pending: isFetching
} = await useAsyncData(
  `packet-${id}`,
  () => $api(`/api/v1/packets/${id}`)
)

// ✅ Set form values
if (packetData.value?.data) {
  const packet = packetData.value.data

  title.value = packet.title || ''
  category.value = packet.category || ''
  subCategory.value = packet.subCategory || ''
  position.value = packet.position || ''
  description.value = packet.description || ''

  /*
   * Penting:
   * Jangan pakai packet.price || ''
   * karena nilai 0 akan berubah menjadi string kosong.
   */
  price.value = normalizePriceForInput(packet.price)

  urlGroup.value = packet.urlGroup || ''

  originalData.value = {
    title: packet.title || '',
    category: packet.category || '',
    subCategory: packet.subCategory || '',
    position: packet.position || '',
    description: packet.description || '',
    price: normalizePriceForInput(packet.price),
    urlGroup: packet.urlGroup || ''
  }
}

// ✅ Fetch dropdowns
const { data: categoriesData } = await useAsyncData(
  'categories',
  () => $api('/api/v1/categories')
)

const categories = computed(() =>
  categoriesData.value?.data || []
)

const { data: subCategoriesData } = await useAsyncData(
  'sub-categories',
  () => $api('/api/v1/sub-categories')
)

const subCategories = computed(() =>
  subCategoriesData.value?.data || []
)

const { data: positionsData } = await useAsyncData(
  'positions',
  () => $api('/api/v1/positions')
)

const positions = computed(() =>
  positionsData.value?.data || []
)

// ✅ Check if form has changes
const hasChanges = computed(() => {
  const currentPrice = toNumberOrNull(price.value)
  const originalPrice = toNumberOrNull(originalData.value.price)

  return title.value !== originalData.value.title
    || category.value !== originalData.value.category
    || subCategory.value !== originalData.value.subCategory
    || position.value !== originalData.value.position
    || description.value !== originalData.value.description
    || urlGroup.value !== originalData.value.urlGroup
    || currentPrice !== originalPrice
})

const submitForm = async () => {
  if (!title.value.trim()) {
    toast.add({
      title: 'Validasi Gagal',
      description: 'Judul paket wajib diisi',
      color: 'amber'
    })

    return
  }

  if (!category.value.trim()) {
    toast.add({
      title: 'Validasi Gagal',
      description: 'Kategori wajib diisi',
      color: 'amber'
    })

    return
  }

  const numericPrice = Number(price.value)

  /*
   * Harga 0 valid untuk paket gratis.
   * Yang ditolak hanya kosong, bukan angka, atau negatif.
   */
  if (
    price.value === ''
    || Number.isNaN(numericPrice)
    || numericPrice < 0
  ) {
    toast.add({
      title: 'Validasi Gagal',
      description: 'Harga tidak boleh kosong atau negatif',
      color: 'amber'
    })

    return
  }

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

    const response = await $api(
      `/api/v1/packets/${id}`,
      {
        method: 'PUT',
        body: {
          title: title.value.trim(),
          category: category.value.trim(),
          subCategory: subCategory.value.trim(),
          position: position.value.trim(),
          description: description.value.trim(),
          price: numericPrice,
          urlGroup: urlGroup.value.trim()
        },
      }
    )

    if (response?.statusCode === 200) {
      toast.add({
        title: 'Berhasil!',
        description: 'Paket berhasil diperbarui',
        color: 'green'
      })

      setTimeout(() => {
        router.push('/admin/packets')
      }, 500)
    } else {
      toast.add({
        title: 'Gagal',
        description: 'Gagal memperbarui paket',
        color: 'red'
      })
    }
  } catch (error) {
    console.error('Error:', error)

    toast.add({
      title: 'Error',
      description:
        error?.data?.message
        || error?.response?._data?.message
        || 'Gagal memperbarui paket',
      color: 'red'
    })
  } finally {
    isLoading.value = false
  }
}

const handleCancel = () => {
  if (!hasChanges.value) {
    router.push('/admin/packets')
    return
  }

  if (
    confirm(
      'Anda memiliki perubahan yang belum disimpan.\n\nYakin ingin membatalkan?'
    )
  ) {
    toast.add({
      title: 'Dibatalkan',
      description: 'Perubahan dibatalkan',
      color: 'gray'
    })

    router.push('/admin/packets')
  }
}
</script>

<template>
  <main
    class="min-h-screen bg-tryout-bg p-4 sm:p-6 lg:p-8 transition-colors duration-300"
  >
    <div
      class="max-w-2xl mx-auto bg-tryout-surface border border-tryout-border rounded-2xl shadow-sm p-5 sm:p-8 transition-colors duration-300 mt-4 sm:mt-0"
    >
      <h1 class="text-xl sm:text-2xl font-bold text-tryout-text mb-6">
        Edit Paket
      </h1>

      <div
        v-if="isFetching"
        class="text-center py-8"
      >
        <div
          class="animate-spin rounded-full h-10 w-10 border-4 border-tryout-border border-t-tryout-primary mx-auto mb-4"
        ></div>

        <p class="text-sm font-medium text-tryout-muted">
          Memuat data paket...
        </p>
      </div>

      <form
        v-else
        @submit.prevent="submitForm"
        class="space-y-5"
      >
        <div>
          <label
            class="block text-tryout-text mb-1.5 text-sm sm:text-base font-medium"
          >
            Judul Paket
            <span class="text-red-500 dark:text-red-400">*</span>
          </label>

          <input
            v-model="title"
            type="text"
            placeholder="Masukkan judul paket"
            class="w-full px-4 py-2.5 sm:py-2 border border-tryout-border bg-tryout-surface text-tryout-text rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none transition-shadow text-sm sm:text-base"
            :disabled="isLoading"
          >
        </div>

        <div>
          <label
            class="block text-tryout-text mb-1.5 text-sm sm:text-base font-medium"
          >
            Kategori
            <span class="text-red-500 dark:text-red-400">*</span>
          </label>

          <select
            v-model="category"
            class="w-full px-4 py-2.5 sm:py-2 border border-tryout-border bg-tryout-surface text-tryout-text rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none transition-shadow cursor-pointer text-sm sm:text-base"
            :disabled="isLoading"
          >
            <option value="">
              Pilih Kategori
            </option>

            <option
              v-for="cat in categories"
              :key="cat.id"
              :value="cat.title"
            >
              {{ cat.title }}
            </option>
          </select>
        </div>

        <div>
          <label
            class="block text-tryout-text mb-1.5 text-sm sm:text-base font-medium"
          >
            Sub Kategori
          </label>

          <select
            v-model="subCategory"
            class="w-full px-4 py-2.5 sm:py-2 border border-tryout-border bg-tryout-surface text-tryout-text rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none transition-shadow cursor-pointer text-sm sm:text-base"
            :disabled="isLoading"
          >
            <option value="">
              Pilih Sub Kategori
            </option>

            <option
              v-for="sub in subCategories"
              :key="sub.id"
              :value="sub.title"
            >
              {{ sub.title }}
            </option>
          </select>
        </div>

        <div>
          <label
            class="block text-tryout-text mb-1.5 text-sm sm:text-base font-medium"
          >
            Posisi
          </label>

          <select
            v-model="position"
            class="w-full px-4 py-2.5 sm:py-2 border border-tryout-border bg-tryout-surface text-tryout-text rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none transition-shadow cursor-pointer text-sm sm:text-base"
            :disabled="isLoading"
          >
            <option value="">
              Pilih Posisi
            </option>

            <option
              v-for="pos in positions"
              :key="pos.id"
              :value="pos.title"
            >
              {{ pos.title }}
            </option>
          </select>
        </div>

        <div>
          <label
            class="block text-tryout-text mb-1.5 text-sm sm:text-base font-medium"
          >
            URL Group (Link Grup Belajar)
          </label>

          <input
            v-model="urlGroup"
            type="url"
            placeholder="contoh: https://t.me/grupbelajar atau https://chat.whatsapp.com/..."
            class="w-full px-4 py-2.5 sm:py-2 border border-tryout-border bg-tryout-surface text-tryout-text rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none transition-shadow text-sm sm:text-base"
            :disabled="isLoading"
          >
        </div>

        <div>
          <label
            class="block text-tryout-text mb-1.5 text-sm sm:text-base font-medium"
          >
            Deskripsi
          </label>

          <textarea
            v-model="description"
            rows="4"
            placeholder="contoh: paket pksti 1, paket pksti 2, paket pksti 3, dst. pisahkan dengan koma"
            class="w-full px-4 py-3 border border-tryout-border bg-tryout-surface text-tryout-text rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none transition-shadow text-sm sm:text-base"
            :disabled="isLoading"
          ></textarea>
        </div>

        <div>
          <label
            class="block text-tryout-text mb-1.5 text-sm sm:text-base font-medium"
          >
            Harga
            <span class="text-red-500 dark:text-red-400">*</span>
          </label>

          <div class="relative">
            <span
              class="absolute left-3 top-1/2 -translate-y-1/2 text-tryout-subtle font-medium text-sm sm:text-base"
            >
              Rp
            </span>

            <input
              v-model="price"
              type="number"
              step="1000"
              min="0"
              placeholder="Masukkan harga"
              class="w-full pl-10 pr-4 py-2.5 sm:py-2 border border-tryout-border bg-tryout-surface text-tryout-text rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none transition-shadow text-sm sm:text-base"
              :disabled="isLoading"
            >
          </div>

          <p class="text-xs text-tryout-muted mt-1.5">
            Format: angka tanpa titik/koma. Isi
            <strong>0</strong>
            untuk paket gratis.
          </p>
        </div>

        <div
          v-if="hasChanges"
          class="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-lg p-3 sm:p-4 mt-4 transition-colors"
        >
          <p
            class="text-sm text-amber-800 dark:text-amber-400 flex items-center gap-2 font-medium"
          >
            <svg
              class="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>

            Ada perubahan yang belum disimpan
          </p>
        </div>

        <div
          class="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-lg p-3 sm:p-4 mt-4 transition-colors"
        >
          <p
            class="text-sm text-blue-800 dark:text-blue-300 flex items-center gap-2 font-medium"
          >
            <svg
              class="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>

            <span>
              <span class="text-red-500 dark:text-red-400 font-bold">*</span>
              = Wajib diisi
            </span>
          </p>
        </div>

        <div
          class="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-8 pt-4 border-t border-tryout-divider"
        >
          <button
            type="button"
            @click="handleCancel"
            :disabled="isLoading"
            class="w-full sm:w-auto px-5 py-2.5 rounded-xl border-2 border-tryout-border bg-tryout-surface text-tryout-text font-bold hover:bg-tryout-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            Batal
          </button>

          <button
            type="submit"
            :disabled="isLoading || !hasChanges"
            class="w-full sm:w-auto px-5 py-2.5 cursor-pointer rounded-xl bg-tryout-primary text-white font-bold hover:opacity-90 transition-all shadow-md shadow-tryout-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <svg
              v-if="isLoading"
              class="animate-spin h-5 w-5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>

              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>

            {{ isLoading ? 'Menyimpan...' : 'Simpan Perubahan' }}
          </button>
        </div>
      </form>
    </div>
  </main>
</template>