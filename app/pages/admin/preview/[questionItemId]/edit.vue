<script setup>
definePageMeta({
    layout: 'admin'
})

const router = useRouter()
const route = useRoute()
const toast = useToast()
const { $api } = useNuxtApp()
const config = useRuntimeConfig()

const questionItemId = route.params.questionItemId

// ✅ STATE BARU: Untuk Toggle Tipe Soal
const questionType = ref('text') // Default 'text', otomatis berubah saat data di-load

// Form state
const formData = ref({
    questionBankId: '',
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    optionE: '',
    correctAnswerText: '',
    explanation: '',
    mainTopic: '',
    subTopic: '',
    scoreOptionA: 0,
    scoreOptionB: 0,
    scoreOptionC: 0,
    scoreOptionD: 0,
    scoreOptionE: 0
})

// ✅ STATE: Menyimpan pilihan A/B/C/D/E di Dropdown (HANYA UNTUK TIPE TEKS)
const selectedAnswerKey = ref('')

// File uploads state
const files = ref({
    questionImage: null,
    imageOptionA: null,
    imageOptionB: null,
    imageOptionC: null,
    imageOptionD: null,
    imageOptionE: null,
    correctAnswerImage: null, // Digunakan hanya untuk Tipe Gambar
    explanationImage: null
})

const previews = ref({
    questionImage: null,
    imageOptionA: null,
    imageOptionB: null,
    imageOptionC: null,
    imageOptionD: null,
    imageOptionE: null,
    correctAnswerImage: null,
    explanationImage: null
})

// Existing images from server
const existingImages = ref({
    questionImage: null,
    imageOptionA: null,
    imageOptionB: null,
    imageOptionC: null,
    imageOptionD: null,
    imageOptionE: null,
    correctAnswerImage: null,
    explanationImage: null
})

const isLoading = ref(false)

// ✅ Fetch existing data
const { data: existingData, pending } = await useAsyncData(
    `question-item-${questionItemId}`,
    () => $api(`/api/v1/question-items/${questionItemId}`)
)

// ✅ Populate form dengan data existing
watchEffect(() => {
    if (existingData.value?.data) {
        const data = existingData.value.data

        formData.value = {
            questionBankId: data.questionBankId || '',
            questionText: data.questionText || '',
            optionA: data.optionA || '',
            optionB: data.optionB || '',
            optionC: data.optionC || '',
            optionD: data.optionD || '',
            optionE: data.optionE || '',
            correctAnswerText: data.correctAnswerText || '',
            explanation: data.explanation || '',
            mainTopic: data.mainTopic || '',
            subTopic: data.subTopic || '',
            scoreOptionA: data.scoreOptionA || 0,
            scoreOptionB: data.scoreOptionB || 0,
            scoreOptionC: data.scoreOptionC || 0,
            scoreOptionD: data.scoreOptionD || 0,
            scoreOptionE: data.scoreOptionE || 0
        }

        existingImages.value = {
            questionImage: data.questionImage || null,
            imageOptionA: data.imageOptionA || null,
            imageOptionB: data.imageOptionB || null,
            imageOptionC: data.imageOptionC || null,
            imageOptionD: data.imageOptionD || null,
            imageOptionE: data.imageOptionE || null,
            correctAnswerImage: data.correctAnswerImage || null,
            explanationImage: data.explanationImage || null
        }

        // ✅ LOGIKA TOGGLE OTOMATIS: Tebak dari database ini tipe gambar atau teks
        if (data.questionImage && data.questionImage.trim() !== '' && data.questionImage !== '-') {
            questionType.value = 'image'
        } else {
            questionType.value = 'text'
        }

        // ✅ LOGIKA DROPDOWN: (Hanya relevan jika data aslinya teks)
        if (data.correctAnswerText) {
            if (data.correctAnswerText === data.optionA || data.correctAnswerText === 'A') selectedAnswerKey.value = 'A'
            else if (data.correctAnswerText === data.optionB || data.correctAnswerText === 'B') selectedAnswerKey.value = 'B'
            else if (data.correctAnswerText === data.optionC || data.correctAnswerText === 'C') selectedAnswerKey.value = 'C'
            else if (data.correctAnswerText === data.optionD || data.correctAnswerText === 'D') selectedAnswerKey.value = 'D'
            else if (data.correctAnswerText === data.optionE || data.correctAnswerText === 'E') selectedAnswerKey.value = 'E'
            else selectedAnswerKey.value = ''
        }
    }
})

// Helper untuk URL Gambar Penuh
const getImageUrl = (url) => {
    if (!url || url.trim() === '' || url === '-') return ''
    if (url.startsWith('http')) return url
    return `${config.public.apiBaseUrl}${url.startsWith('/') ? '' : '/'}${url}`
}

const handleFileChange = (fieldName, event) => {
    const file = event.target.files[0]
    if (!file) return

    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
        toast.add({ title: 'File Terlalu Besar', description: 'Maksimal 2MB', color: 'amber' })
        return
    }

    files.value[fieldName] = file
    previews.value[fieldName] = URL.createObjectURL(file)
    existingImages.value[fieldName] = null
}

const removeFile = (fieldName) => {
    if (previews.value[fieldName]) URL.revokeObjectURL(previews.value[fieldName])
    files.value[fieldName] = null
    previews.value[fieldName] = null
}

const removeExistingImage = (fieldName) => {
    existingImages.value[fieldName] = null
}

const submitForm = async () => {
    // Validasi dasar berdasarkan tipe
    if (questionType.value === 'text') {
        if (!formData.value.questionText) {
            toast.add({ title: 'Validasi Gagal', description: 'Teks Pertanyaan wajib diisi!', color: 'amber' })
            return
        }
        if (!selectedAnswerKey.value) {
            toast.add({ title: 'Validasi Gagal', description: 'Pilih Kunci Jawaban Benar dari Dropdown!', color: 'amber' })
            return
        }
    } else if (questionType.value === 'image') {
        if (!files.value.questionImage && !existingImages.value.questionImage) {
            toast.add({ title: 'Validasi Gagal', description: 'Gambar Pertanyaan wajib diisi!', color: 'amber' })
            return
        }
        // Validasi opsional: pastikan ada gambar jawaban benar
        if (!files.value.correctAnswerImage && !existingImages.value.correctAnswerImage) {
            toast.add({ title: 'Validasi Gagal', description: 'Gambar Kunci Jawaban wajib diisi!', color: 'amber' })
            return
        }
    }

    // ✅ LOGIKA PEMBERSIH OTOMATIS (AUTO-CLEAR) SESUAI LOGIKA BARU
    if (questionType.value === 'image') {
        // Jika tipe GAMBAR, bersihkan data eksklusif TEKS
        formData.value.questionText = ''
        formData.value.optionA = ''
        formData.value.optionB = ''
        formData.value.optionC = ''
        formData.value.optionD = ''
        formData.value.optionE = ''
        formData.value.correctAnswerText = '' // Kosongkan teks jawaban karena pakai gambar
    } else {
        // Jika tipe TEKS, bersihkan data eksklusif GAMBAR
        files.value.questionImage = null
        files.value.imageOptionA = null
        files.value.imageOptionB = null
        files.value.imageOptionC = null
        files.value.imageOptionD = null
        files.value.imageOptionE = null
        files.value.correctAnswerImage = null

        existingImages.value.questionImage = null
        existingImages.value.imageOptionA = null
        existingImages.value.imageOptionB = null
        existingImages.value.imageOptionC = null
        existingImages.value.imageOptionD = null
        existingImages.value.imageOptionE = null
        existingImages.value.correctAnswerImage = null

        // Set text jawaban dari dropdown
        formData.value.correctAnswerText = formData.value[`option${selectedAnswerKey.value}`] || selectedAnswerKey.value
    }

    // Catatan: Explanation (Text & Image) tidak dibersihkan karena universal

    try {
        isLoading.value = true
        const formDataToSend = new FormData()

        // Append teks
        Object.keys(formData.value).forEach(key => {
            formDataToSend.append(key, formData.value[key])
        })

        // Append file baru
        Object.keys(files.value).forEach(key => {
            if (files.value[key]) formDataToSend.append(key, files.value[key])
        })

        // Append file lama (hanya nama filenya saja)
        Object.keys(existingImages.value).forEach(key => {
            if (existingImages.value[key] && !files.value[key]) {
                let fileNameOnly = existingImages.value[key]
                if (fileNameOnly.includes('/uploads/')) fileNameOnly = fileNameOnly.split('/uploads/').pop()
                formDataToSend.append(`existing_${key}`, fileNameOnly)
            }
        })

        const response = await $api(`/api/v1/question-items/${questionItemId}`, {
            method: 'PUT',
            body: formDataToSend
        })

        if (response?.statusCode === 200) {
            toast.add({ title: 'Berhasil!', description: 'Soal diperbarui', color: 'green' })
            // KODE BARU
            setTimeout(() => router.push(`/admin/preview/${formData.value.questionBankId}`), 500)
        } else {
            toast.add({ title: 'Gagal', description: 'Gagal memperbarui', color: 'red' })
        }
    } catch (error) {
        toast.add({ title: 'Error', description: error?.data?.message || 'Terjadi kesalahan', color: 'red' })
        console.error(error)
    } finally {
        isLoading.value = false
    }
}

onUnmounted(() => {
    Object.values(previews.value).forEach(url => { if (url) URL.revokeObjectURL(url) })
})
</script>

<template>
    <main class="min-h-screen bg-tryout-bg p-4 sm:p-6 lg:p-8 transition-colors duration-300">
        <div class="max-w-5xl mx-auto bg-tryout-surface border border-tryout-border rounded-2xl shadow-sm p-5 sm:p-8 transition-colors duration-300 mt-4 sm:mt-0">
            <h1 class="text-xl sm:text-2xl font-bold text-tryout-text mb-6">Edit Question Item #{{ questionItemId }}</h1>

            <div v-if="pending" class="text-center py-12">
                <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-tryout-primary"></div>
                <p class="mt-4 text-tryout-muted">Loading data...</p>
            </div>

            <form v-else @submit.prevent="submitForm" class="space-y-8">

                <div
                    class="bg-tryout-hover border border-tryout-border rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-center shadow-sm transition-colors">
                    <span class="font-bold text-tryout-text">Pilih Tipe Soal:</span>

                    <div class="flex gap-4">
                        <label
                            class="flex items-center gap-2 cursor-pointer bg-tryout-surface border border-tryout-border hover:bg-blue-50 dark:hover:bg-blue-900/20 px-5 py-3 rounded-lg shadow-sm transition-all"
                            :class="questionType === 'text' ? 'ring-2 ring-blue-500 border-blue-500 dark:ring-blue-400 dark:border-blue-400' : 'border-tryout-border'">
                            <input type="radio" v-model="questionType" value="text"
                                class="w-5 h-5 text-blue-600 focus:ring-blue-500">
                            <span class="font-bold"
                                :class="questionType === 'text' ? 'text-blue-700 dark:text-blue-400' : 'text-tryout-muted'">📝 Khusus Teks</span>
                        </label>

                        <label
                            class="flex items-center gap-2 cursor-pointer bg-tryout-surface border border-tryout-border hover:bg-purple-50 dark:hover:bg-purple-900/20 px-5 py-3 rounded-lg shadow-sm transition-all"
                            :class="questionType === 'image' ? 'ring-2 ring-purple-500 border-purple-500 dark:ring-purple-400 dark:border-purple-400' : 'border-tryout-border'">
                            <input type="radio" v-model="questionType" value="image"
                                class="w-5 h-5 text-purple-600 focus:ring-purple-500">
                            <span class="font-bold"
                                :class="questionType === 'image' ? 'text-purple-700 dark:text-purple-400' : 'text-tryout-muted'">🖼️ Teks & Gambar</span>
                        </label>
                    </div>
                </div>

                <div v-show="questionType === 'text'"
                    class="border-2 border-blue-200 dark:border-blue-900/40 rounded-xl p-5 sm:p-6 bg-blue-50 dark:bg-blue-900/10 transition-all duration-300 origin-top">
                    <h2 class="text-lg sm:text-xl font-bold text-blue-800 dark:text-blue-300 mb-6 flex items-center">
                        <span
                            class="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm sm:text-base">1</span>
                        Konten Soal & Opsi (Teks)
                    </h2>

                    <div class="mb-6">
                        <label class="block text-tryout-text font-semibold mb-2">Teks Pertanyaan <span
                                class="text-red-500 dark:text-red-400">*</span></label>
                        <textarea v-model="formData.questionText" placeholder="Masukkan pertanyaan dalam bentuk teks"
                            rows="4"
                            class="w-full px-4 py-3 border border-tryout-border bg-tryout-surface text-tryout-text rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none transition-shadow"></textarea>
                    </div>

                    <div class="grid grid-cols-1 gap-4 mb-6">
                        <div><label class="block text-tryout-text font-semibold mb-2">Opsi A</label><input
                                v-model="formData.optionA" type="text"
                                class="w-full px-4 py-3 border border-tryout-border bg-tryout-surface text-tryout-text rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none transition-shadow" />
                        </div>
                        <div><label class="block text-tryout-text font-semibold mb-2">Opsi B</label><input
                                v-model="formData.optionB" type="text"
                                class="w-full px-4 py-3 border border-tryout-border bg-tryout-surface text-tryout-text rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none transition-shadow" />
                        </div>
                        <div><label class="block text-tryout-text font-semibold mb-2">Opsi C</label><input
                                v-model="formData.optionC" type="text"
                                class="w-full px-4 py-3 border border-tryout-border bg-tryout-surface text-tryout-text rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none transition-shadow" />
                        </div>
                        <div><label class="block text-tryout-text font-semibold mb-2">Opsi D</label><input
                                v-model="formData.optionD" type="text"
                                class="w-full px-4 py-3 border border-tryout-border bg-tryout-surface text-tryout-text rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none transition-shadow" />
                        </div>
                        <div><label class="block text-tryout-text font-semibold mb-2">Opsi E</label><input
                                v-model="formData.optionE" type="text"
                                class="w-full px-4 py-3 border border-tryout-border bg-tryout-surface text-tryout-text rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none transition-shadow" />
                        </div>
                    </div>

                    <div class="mt-8 border-t border-blue-200 dark:border-blue-900/40 pt-6">
                        <label class="block text-tryout-text font-bold mb-2 text-base sm:text-lg">Jawaban Benar (Teks) <span
                                class="text-red-500 dark:text-red-400">*</span></label>
                        <select v-model="selectedAnswerKey"
                            class="w-full sm:max-w-md px-4 py-3 border-2 border-blue-300 dark:border-blue-700/50 rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none transition-shadow bg-tryout-surface text-tryout-text text-base sm:text-lg font-semibold cursor-pointer">
                            <option value="" disabled>-- Pilih Kunci Jawaban --</option>
                            <option value="A">Kunci: A {{ formData.optionA ? `(${formData.optionA})` : '' }}</option>
                            <option value="B">Kunci: B {{ formData.optionB ? `(${formData.optionB})` : '' }}</option>
                            <option value="C">Kunci: C {{ formData.optionC ? `(${formData.optionC})` : '' }}</option>
                            <option value="D">Kunci: D {{ formData.optionD ? `(${formData.optionD})` : '' }}</option>
                            <option value="E">Kunci: E {{ formData.optionE ? `(${formData.optionE})` : '' }}</option>
                        </select>
                    </div>
                </div>

                <div v-show="questionType === 'image'"
                    class="border-2 border-purple-200 dark:border-purple-900/40 rounded-xl p-5 sm:p-6 bg-purple-50 dark:bg-purple-900/10 transition-all duration-300 origin-top">
                    <h2 class="text-lg sm:text-xl font-bold text-purple-800 dark:text-purple-300 mb-6 flex items-center">
                        <span
                            class="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm sm:text-base">2</span>
                        Konten Soal & Opsi (Gambar)
                    </h2>

                    <div class="mb-6">
                        <label class="block text-tryout-text font-semibold mb-2">Gambar Pertanyaan <span
                                class="text-red-500 dark:text-red-400">*</span></label>
                        <div v-if="existingImages.questionImage && getImageUrl(existingImages.questionImage)"
                            class="mb-3">
                            <div class="relative inline-block">
                                <img :src="getImageUrl(existingImages.questionImage)"
                                    class="w-32 h-32 sm:w-40 sm:h-40 object-contain rounded-lg border-2 border-purple-300 dark:border-purple-700/50" />
                                <button type="button" @click="removeExistingImage('questionImage')"
                                    class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 shadow-lg">×</button>
                            </div>
                        </div>
                        <input type="file" accept="image/*" @change="handleFileChange('questionImage', $event)"
                            class="w-full px-4 py-2.5 sm:py-3 border border-tryout-border rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none transition-shadow bg-tryout-surface text-tryout-text" />
                        <div v-if="previews.questionImage" class="mt-3 relative inline-block">
                            <img :src="previews.questionImage"
                                class="w-32 h-32 sm:w-40 sm:h-40 object-cover rounded-lg border-2 border-emerald-500" />
                            <button type="button" @click="removeFile('questionImage')"
                                class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 shadow-lg">×</button>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div v-for="opt in ['A', 'B', 'C', 'D', 'E']" :key="opt">
                            <label class="block text-tryout-text font-semibold mb-2">Gambar Opsi {{ opt }}</label>

                            <div v-if="existingImages[`imageOption${opt}`] && getImageUrl(existingImages[`imageOption${opt}`])"
                                class="mb-3">
                                <div class="relative inline-block">
                                    <img :src="getImageUrl(existingImages[`imageOption${opt}`])"
                                        class="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg border-2 border-purple-300 dark:border-purple-700/50" />
                                    <button type="button" @click="removeExistingImage(`imageOption${opt}`)"
                                        class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 shadow-lg">×</button>
                                </div>
                            </div>

                            <input type="file" accept="image/*" @change="handleFileChange(`imageOption${opt}`, $event)"
                                class="w-full px-4 py-2.5 sm:py-3 border border-tryout-border rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none transition-shadow bg-tryout-surface text-tryout-text" />

                            <div v-if="previews[`imageOption${opt}`]" class="mt-3 relative inline-block">
                                <img :src="previews[`imageOption${opt}`]"
                                    class="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg border-2 border-emerald-500" />
                                <button type="button" @click="removeFile(`imageOption${opt}`)"
                                    class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 shadow-lg">×</button>
                            </div>
                        </div>
                    </div>

                    <div class="mt-8 border-t border-purple-200 dark:border-purple-900/40 pt-6">
                        <label class="block text-tryout-text font-bold mb-2 text-base sm:text-lg">Gambar Jawaban Benar <span
                                class="text-red-500 dark:text-red-400">*</span></label>
                        <div v-if="existingImages.correctAnswerImage && getImageUrl(existingImages.correctAnswerImage)"
                            class="mb-3">
                            <div class="relative inline-block">
                                <img :src="getImageUrl(existingImages.correctAnswerImage)"
                                    class="w-32 h-32 sm:w-40 sm:h-40 object-cover rounded-lg border-2 border-purple-300 dark:border-purple-700/50" />
                                <button type="button" @click="removeExistingImage('correctAnswerImage')"
                                    class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 shadow-lg">×</button>
                            </div>
                        </div>
                        <input type="file" accept="image/*" @change="handleFileChange('correctAnswerImage', $event)"
                            class="w-full sm:max-w-md px-4 py-2.5 sm:py-3 border border-tryout-border rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none transition-shadow bg-tryout-surface text-tryout-text" />
                        <div v-if="previews.correctAnswerImage" class="mt-3 relative inline-block">
                            <img :src="previews.correctAnswerImage"
                                class="w-32 h-32 sm:w-40 sm:h-40 object-cover rounded-lg border-2 border-emerald-500" />
                            <button type="button" @click="removeFile('correctAnswerImage')"
                                class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 shadow-lg">×</button>
                        </div>
                    </div>
                </div>

                <div class="border-2 border-tryout-border rounded-xl p-5 sm:p-6 bg-tryout-surface shadow-sm transition-colors">
                    <h2 class="text-lg sm:text-xl font-bold text-tryout-text mb-6 flex items-center">
                        <span
                            class="bg-tryout-muted text-white w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm sm:text-base">3</span>
                        Penjelasan, Bobot Skor & Topik
                    </h2>

                    <div class="mb-6 bg-tryout-hover/50 p-4 rounded-lg border border-tryout-border">
                        <h3 class="font-bold text-tryout-text mb-4">Materi Pembahasan</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-tryout-text font-semibold mb-2">Teks Penjelasan</label>
                                <textarea v-model="formData.explanation" placeholder="Tulis pembahasan disini..."
                                    rows="4"
                                    class="w-full px-4 py-3 border border-tryout-border bg-tryout-surface text-tryout-text rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none transition-shadow"></textarea>
                            </div>
                            <div>
                                <label class="block text-tryout-text font-semibold mb-2">Gambar Penjelasan
                                    (Opsional)</label>
                                <div v-if="existingImages.explanationImage && getImageUrl(existingImages.explanationImage)"
                                    class="mb-3">
                                    <div class="relative inline-block">
                                        <img :src="getImageUrl(existingImages.explanationImage)"
                                            class="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg border border-tryout-border" />
                                        <button type="button" @click="removeExistingImage('explanationImage')"
                                            class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 shadow-lg text-sm">×</button>
                                    </div>
                                </div>
                                <input type="file" accept="image/*"
                                    @change="handleFileChange('explanationImage', $event)"
                                    class="w-full px-4 py-2 border border-tryout-border bg-tryout-surface text-tryout-text rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none transition-shadow text-sm" />
                                <div v-if="previews.explanationImage" class="mt-3 relative inline-block">
                                    <img :src="previews.explanationImage"
                                        class="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg border-2 border-emerald-500" />
                                    <button type="button" @click="removeFile('explanationImage')"
                                        class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 shadow-lg text-sm">×</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="mb-6">
                        <p class="text-sm text-tryout-text mb-3 font-semibold border-b border-tryout-divider pb-2">Bobot Nilai
                            (Score) per Opsi:</p>
                        <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div><label class="block text-tryout-text text-sm font-semibold mb-2">Score A</label><input
                                    v-model.number="formData.scoreOptionA" type="number"
                                    class="w-full px-4 py-2.5 sm:py-2 border border-tryout-border bg-tryout-surface text-tryout-text rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none transition-shadow" />
                            </div>
                            <div><label class="block text-tryout-text text-sm font-semibold mb-2">Score B</label><input
                                    v-model.number="formData.scoreOptionB" type="number"
                                    class="w-full px-4 py-2.5 sm:py-2 border border-tryout-border bg-tryout-surface text-tryout-text rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none transition-shadow" />
                            </div>
                            <div><label class="block text-tryout-text text-sm font-semibold mb-2">Score C</label><input
                                    v-model.number="formData.scoreOptionC" type="number"
                                    class="w-full px-4 py-2.5 sm:py-2 border border-tryout-border bg-tryout-surface text-tryout-text rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none transition-shadow" />
                            </div>
                            <div><label class="block text-tryout-text text-sm font-semibold mb-2">Score D</label><input
                                    v-model.number="formData.scoreOptionD" type="number"
                                    class="w-full px-4 py-2.5 sm:py-2 border border-tryout-border bg-tryout-surface text-tryout-text rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none transition-shadow" />
                            </div>
                            <div><label class="block text-tryout-text text-sm font-semibold mb-2">Score E</label><input
                                    v-model.number="formData.scoreOptionE" type="number"
                                    class="w-full px-4 py-2.5 sm:py-2 border border-tryout-border bg-tryout-surface text-tryout-text rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none transition-shadow" />
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><label class="block text-tryout-text font-semibold mb-2">Sub Topic</label><input
                                v-model="formData.subTopic" type="text"
                                class="w-full px-4 py-2.5 sm:py-3 border border-tryout-border bg-tryout-surface text-tryout-text rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none transition-shadow" />
                        </div>
                        <div><label class="block text-tryout-text font-semibold mb-2">Main Topic</label><input
                                v-model="formData.mainTopic" type="text"
                                class="w-full px-4 py-2.5 sm:py-3 border border-tryout-border bg-tryout-surface text-tryout-text rounded-lg focus:ring-2 focus:ring-tryout-primary focus:outline-none transition-shadow" />
                        </div>
                    </div>
                </div>

                <div class="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-tryout-divider">
                    <button type="button" @click="router.push(`/admin/question-bank/${formData.questionBankId}/detail`)"
                        :disabled="isLoading"
                        class="w-full sm:w-auto px-6 py-2.5 sm:py-3 rounded-xl border-2 border-tryout-border bg-tryout-surface text-tryout-text font-bold hover:bg-tryout-hover transition-colors disabled:opacity-50 active:scale-[0.98]">Batal</button>
                    <button type="submit" :disabled="isLoading"
                        class="w-full sm:w-auto px-6 py-2.5 sm:py-3 rounded-xl bg-tryout-primary text-white font-bold hover:opacity-90 transition-all disabled:opacity-50 flex justify-center items-center gap-2 active:scale-[0.98] shadow-sm">
                        <svg v-if="isLoading" class="animate-spin h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4">
                            </circle>
                            <path class="opacity-75" fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                            </path>
                        </svg>
                        {{ isLoading ? 'Menyimpan...' : 'Update Question' }}
                    </button>
                </div>
            </form>
        </div>
    </main>
</template>

<style scoped>
/* Transisi Modal */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>