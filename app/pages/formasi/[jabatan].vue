<script setup>
import { computed, ref, onMounted } from 'vue'

definePageMeta({ layout: 'landing' })

const route = useRoute()
const config = useRuntimeConfig()
const { $api } = useNuxtApp()

// ✅ TAMBAHKAN AuthUser untuk cek status login
const { isLoggedIn, authToken } = useAuthUser()

// 1. Ambil slug dari URL (misal: "pranata-komputer" atau "skd")
const rawSlug = route.params.jabatan

// 2. Ubah slug kembali menjadi teks normal
const formatTitleCase = (str) => {
    // Pengecualian khusus jika user mencari "skd" atau "skb" agar hurufnya besar
    if (str.toLowerCase() === 'skd') return 'SKD'
    if (str.toLowerCase() === 'skb') return 'SKB'

    return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}
const jabatanName = computed(() => formatTitleCase(rawSlug))

// 3. ✨ SEO Meta Tags
useSeoMeta({
    title: `Tryout CPNS ${jabatanName.value} 2026 - Latihan Soal Terupdate`,
    description: `Kumpulan paket tryout CPNS terlengkap untuk formasi ${jabatanName.value}. Dilengkapi simulasi CAT BKN, timer, ranking nasional, dan pembahasan soal terupdate.`,
})

// 4. Fetch Semua Paket dari Backend
const { data: response, pending } = await useAsyncData(
    `packets-formasi-${rawSlug}`,
    () => $api('/api/v1/packets', { method: 'GET' })
)

// =======================================================
// ✅ LOGIKA TRANSAKSI (Sembunyikan yang PAID & PENDING)
// =======================================================

// A. Fetch paket yang sudah PAID
const { data: myPacketsRes } = await useAsyncData(
    `my-transactions-formasi-${rawSlug}`,
    () => $api('/api/v1/transactions/my', { method: 'GET' }),
    { server: false, lazy: true }
)

const myPurchasedIds = computed(() => {
    const data = myPacketsRes.value?.data || []
    return data.map(item => item.id || item.packetId).filter(Boolean)
})

// B. Fetch history transaksi untuk paket yang PENDING
const pendingPacketHashIds = ref([])

const fetchPendingTransactions = async () => {
    if (!isLoggedIn.value) return
    try {
        const res = await $fetch('/api/v1/transactions/history', {
            baseURL: config.public.apiBaseUrl,
            headers: { Authorization: authToken.value }
        })
        const list = res?.data || []
        pendingPacketHashIds.value = list
            .filter(t => {
                const isPending = t.transactionStatus?.toUpperCase() === 'PENDING'
                const notExpired = t.expiredAt ? new Date(t.expiredAt).getTime() > Date.now() : true
                return isPending && notExpired
            })
            .map(t => t.packetHashId)
            .filter(Boolean)
    } catch {
        pendingPacketHashIds.value = []
    }
}

onMounted(() => {
    fetchPendingTransactions()
})

// =======================================================
// 5. FILTER AKHIR (Formasi + Sembunyikan yang sudah dibeli)
// =======================================================
const filteredPackets = computed(() => {
    const allPackets = response.value?.data || []

    const paidIds = myPurchasedIds.value
    const pendingIds = pendingPacketHashIds.value

    return allPackets.filter(p => {
        // 1. Cocokkan nama Formasi/Jabatan
        const isMatchPosition = p.position && p.position.toLowerCase() === jabatanName.value.toLowerCase()

        // 2. Cek apakah paket sudah dibeli atau pending
        const isPaid = paidIds.includes(p.id)
        const isPending = pendingIds.includes(p.id)

        // Hanya kembalikan yang posisinya cocok DAN belum dibeli/pending
        return isMatchPosition && !isPaid && !isPending
    })
})

const formatPrice = (price) => new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0
}).format(price)
</script>

<template>
    <section
        class="min-h-screen py-24 px-4 sm:px-6 lg:px-8 bg-tryout-bg text-tryout-text transition-colors duration-300 relative overflow-hidden">

        <!-- Dekorasi Background -->
        <div
            class="absolute -top-24 -right-24 w-96 h-96 rounded-full pointer-events-none blur-[100px] bg-tryout-primary/8">
        </div>

        <div class="max-w-6xl mx-auto relative z-10">

            <!-- Tombol Kembali -->
            <NuxtLink to="/paket"
                class="mb-8 flex items-center gap-2 font-medium w-fit transition-colors text-tryout-muted hover:text-tryout-text">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
                Kembali ke Katalog Utama
            </NuxtLink>

            <!-- ── SEO Header (H1) ── -->
            <header class="mb-16 border-l-4 border-tryout-accent pl-6">
                <h1 class="text-3xl md:text-5xl font-black tracking-tighter mb-4 leading-tight">
                    Paket Tryout CPNS <br /> Formasi <span class="text-tryout-accent">{{ jabatanName }}</span>
                </h1>
                <p class="font-medium text-lg text-tryout-muted max-w-2xl">
                    Fokuskan belajarmu! Berikut adalah daftar paket latihan soal khusus untuk persiapan formasi {{
                    jabatanName }} yang tersedia untuk Anda.
                </p>
            </header>

            <!-- ── Loading State ── -->
            <div v-if="pending" class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div v-for="i in 3" :key="i" class="h-80 rounded-3xl animate-pulse bg-tryout-skeleton"></div>
            </div>

            <!-- ── Empty State ── -->
            <div v-else-if="filteredPackets.length === 0"
                class="text-center py-20 rounded-3xl bg-tryout-surface border border-tryout-border shadow-sm">
                <div class="text-6xl mb-4">🙏</div>
                <h3 class="text-2xl font-bold mb-2">Belum Ada Paket Tersedia</h3>
                <p class="text-tryout-muted mb-6">Paket untuk formasi <strong>{{ jabatanName }}</strong> mungkin sedang
                    disusun tim kami, atau Anda sudah membeli semua paket pada formasi ini.</p>
                <NuxtLink to="/paket"
                    class="px-6 py-3 bg-tryout-primary text-white font-bold rounded-xl hover:opacity-90">
                    Lihat Formasi Lainnya
                </NuxtLink>
            </div>

            <!-- ── Packet Grid ── -->
            <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div v-for="packet in filteredPackets" :key="packet.id"
                    class="group rounded-[2rem] p-6 flex flex-col justify-between transition-all duration-500 bg-tryout-surface border border-tryout-border hover:border-tryout-accent/60 hover:shadow-xl">
                    <div>
                        <div class="flex justify-between items-start mb-6 gap-2">
                            <span
                                class="text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full bg-tryout-accent text-white">
                                {{ packet.category }}
                            </span>
                        </div>
                        <h3
                            class="text-xl font-bold mb-3 leading-tight capitalize transition-colors text-tryout-text group-hover:text-tryout-accent">
                            {{ packet.title }}
                        </h3>
                        <p class="text-sm font-medium line-clamp-3 mb-6 leading-relaxed text-tryout-muted">
                            {{ packet.description || 'Simulasi CAT standar nasional dengan pembahasan soal mendalam.' }}
                        </p>
                    </div>

                    <div class="pt-6 border-t border-tryout-divider">
                        <div class="flex items-center justify-between mb-5">
                            <span class="text-2xl font-black tracking-tighter text-tryout-text">{{
                                formatPrice(packet.price) }}</span>
                        </div>
                        <!-- Arahkan langsung ke halaman detail paket -->
                        <NuxtLink :to="`/paket/${packet.id}/detail`"
                            class="block w-full text-center py-3.5 rounded-xl text-xs uppercase tracking-widest font-black transition-all bg-tryout-hover text-tryout-text hover:bg-tryout-accent hover:text-white">
                            Lihat Detail
                        </NuxtLink>
                    </div>
                </div>
            </div>

        </div>
    </section>
</template>