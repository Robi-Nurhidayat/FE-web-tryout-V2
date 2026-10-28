<script setup>
definePageMeta({
    layout: 'admin',
})

const { $api } = useNuxtApp()

// State
const search = ref('')
const ratingFilter = ref('') // '1', '2', '3', '4', '5', atau kosong untuk semua
const currentPage = ref(1)
const itemsPerPage = ref(10)

// ✅ Fetch All Reviews dari API backend
const { data: response, pending, refresh } = await useAsyncData('admin-reviews', () =>
    $api('/api/v1/reviews')
)

const reviews = computed(() => response.value?.data || [])

// ✅ Filter & Pencarian Logic
const filteredReviews = computed(() => {
    let result = reviews.value

    // Filter by Rating
    if (ratingFilter.value) {
        result = result.filter(r => r.rating === parseInt(ratingFilter.value))
    }

    // Filter by Search (Mencari di komentar)
    if (search.value.trim()) {
        const s = search.value.toLowerCase().trim()
        result = result.filter(r => r.comment?.toLowerCase().includes(s))
    }

    return result
})

// ✅ Pagination Logic
const totalItems = computed(() => filteredReviews.value.length)
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value))

const paginatedReviews = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value
    const end = start + itemsPerPage.value
    return filteredReviews.value.slice(start, end)
})

watch([search, ratingFilter], () => {
    currentPage.value = 1
})

const goToPage = (page) => {
    if (page >= 1 && page <= totalPages.value) currentPage.value = page
}

// ✅ Summary Stats
const averageRating = computed(() => {
    if (reviews.value.length === 0) return 0
    const total = reviews.value.reduce((sum, r) => sum + r.rating, 0)
    return (total / reviews.value.length).toFixed(1)
})

const totalPerfectReviews = computed(() => {
    return reviews.value.filter(r => r.rating === 5).length
})

// ✅ Helpers
const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    }).format(date)
}
</script>

<template>
    <main class="min-h-screen bg-tryout-bg p-4 sm:p-6 lg:p-8 transition-colors duration-300">

        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
                <h1 class="text-2xl font-bold text-tryout-text">Ulasan Paket</h1>
                <p class="text-sm text-tryout-muted mt-1">Pantau masukan, rating, dan komentar dari peserta</p>
            </div>
            <button @click="refresh()"
                class="px-4 py-2 bg-tryout-surface border border-tryout-border rounded-lg shadow-sm hover:bg-tryout-hover flex items-center gap-2 font-semibold text-tryout-text transition-colors">
                <i class="pi pi-refresh" :class="{ 'animate-spin': pending }"></i> Refresh Data
            </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div class="bg-tryout-surface rounded-xl shadow-sm border border-tryout-border p-6 flex items-center gap-4">
                <div
                    class="w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center text-xl">
                    <i class="pi pi-comments"></i>
                </div>
                <div>
                    <p class="text-sm text-tryout-muted font-medium">Total Ulasan</p>
                    <p class="text-2xl font-bold text-tryout-text">{{ reviews.length }}</p>
                </div>
            </div>

            <div class="bg-tryout-surface rounded-xl shadow-sm border border-tryout-border p-6 flex items-center gap-4">
                <div
                    class="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center text-xl">
                    <i class="pi pi-star-fill"></i>
                </div>
                <div>
                    <p class="text-sm text-tryout-muted font-medium">Rata-rata Rating</p>
                    <p class="text-2xl font-bold text-tryout-text">{{ averageRating }} <span
                            class="text-sm font-normal text-tryout-muted">/ 5.0</span></p>
                </div>
            </div>

            <div class="bg-tryout-surface rounded-xl shadow-sm border border-tryout-border p-6 flex items-center gap-4">
                <div
                    class="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xl">
                    <i class="pi pi-heart-fill"></i>
                </div>
                <div>
                    <p class="text-sm text-tryout-muted font-medium">Ulasan Bintang 5</p>
                    <p class="text-2xl font-bold text-tryout-text">{{ totalPerfectReviews }}</p>
                </div>
            </div>
        </div>

        <div
            class="bg-tryout-surface rounded-xl shadow-sm border border-tryout-border p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div class="flex-1 w-full relative">
                <input v-model="search" type="text" placeholder="Cari berdasarkan komentar..."
                    class="w-full pl-10 pr-4 py-2 border border-tryout-border rounded-lg bg-tryout-surface text-tryout-text outline-none focus:border-tryout-primary" />
                <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-tryout-subtle"></i>
            </div>

            <div class="flex gap-4 w-full md:w-auto">
                <select v-model="ratingFilter"
                    class="w-full md:w-48 px-4 py-2 border border-tryout-border rounded-lg bg-tryout-surface text-tryout-text outline-none focus:border-tryout-primary">
                    <option value="">Semua Bintang</option>
                    <option value="5">Bintang 5</option>
                    <option value="4">Bintang 4</option>
                    <option value="3">Bintang 3</option>
                    <option value="2">Bintang 2</option>
                    <option value="1">Bintang 1</option>
                </select>
            </div>
        </div>

        <div class="bg-tryout-surface shadow-sm border border-tryout-border rounded-xl overflow-hidden w-full">
            <div class="overflow-x-auto w-full">
                <table class="w-full min-w-full divide-y divide-tryout-divider">
                    <thead class="bg-tryout-hover">
                        <tr>
                            <th class="px-6 py-3.5 text-left text-xs font-bold text-tryout-text uppercase">Tanggal</th>
                            <th class="px-6 py-3.5 text-left text-xs font-bold text-tryout-text uppercase">User & Paket
                            </th>
                            <th class="px-6 py-3.5 text-left text-xs font-bold text-tryout-text uppercase">Rating</th>
                            <th
                                class="px-6 py-3.5 text-left text-xs font-bold text-tryout-text uppercase min-w-[250px]">
                                Komentar</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-tryout-divider">
                        <tr v-if="pending">
                            <td colspan="4" class="px-6 py-12 text-center text-tryout-primary">
                                <i class="pi pi-spinner animate-spin text-2xl mb-2"></i>
                                <p class="text-sm font-medium">Memuat data ulasan...</p>
                            </td>
                        </tr>
                        <tr v-else-if="filteredReviews.length === 0">
                            <td colspan="4" class="px-6 py-12 text-center text-tryout-muted">
                                <i class="pi pi-inbox text-3xl mb-2 text-tryout-subtle"></i>
                                <p class="text-sm font-medium">Tidak ada ulasan ditemukan.</p>
                            </td>
                        </tr>
                        <tr v-else v-for="review in paginatedReviews" :key="review.id" class="hover:bg-tryout-hover/50">
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-tryout-muted">
                                {{ formatDate(review.createdAt) }}
                            </td>

                            <td class="px-6 py-4 text-sm text-tryout-text">
                                <!-- Langsung memanggil userEmail dari DTO baru -->
                                <div class="font-bold text-tryout-primary">{{ review.userEmail || 'User Tidak Diketahui'
                                    }}</div>

                                <!-- Langsung memanggil packetTitle dari DTO baru -->
                                <div class="text-xs text-tryout-subtle line-clamp-1 mt-1">
                                    Paket: {{ review.packetTitle || 'Paket Tidak Diketahui' }}
                                </div>
                            </td>

                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="flex items-center gap-1">
                                    <i v-for="i in 5" :key="i" class="pi text-sm"
                                        :class="i <= review.rating ? 'pi-star-fill text-amber-400' : 'pi-star text-tryout-border'">
                                    </i>
                                </div>
                            </td>

                            <td class="px-6 py-4 text-sm text-tryout-text">
                                <p class="line-clamp-3 text-justify">{{ review.comment || 'Tidak ada komentar.' }}</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div v-if="totalPages > 1"
                class="bg-tryout-hover/30 px-6 py-3.5 border-t border-tryout-divider flex items-center justify-between">
                <span class="text-sm text-tryout-muted">
                    Menampilkan {{ (currentPage - 1) * itemsPerPage + 1 }} - {{ Math.min(currentPage * itemsPerPage,
                    totalItems) }} dari {{ totalItems }}
                </span>
                <div class="flex gap-1">
                    <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1"
                        class="px-3 py-1.5 border border-tryout-border rounded bg-tryout-surface text-tryout-text hover:bg-tryout-hover disabled:opacity-40 disabled:cursor-not-allowed">
                        <i class="pi pi-angle-left"></i>
                    </button>
                    <span class="px-3 py-1.5 text-sm font-bold text-tryout-text">Hal {{ currentPage }} / {{ totalPages
                        }}</span>
                    <button @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages"
                        class="px-3 py-1.5 border border-tryout-border rounded bg-tryout-surface text-tryout-text hover:bg-tryout-hover disabled:opacity-40 disabled:cursor-not-allowed">
                        <i class="pi pi-angle-right"></i>
                    </button>
                </div>
            </div>
        </div>
    </main>
</template>