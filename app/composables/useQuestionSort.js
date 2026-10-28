// composables/useQuestionSort.js

const normalizeText = (value) => (value ?? '').toString().toLowerCase().trim()

// Prioritas kategori utama
const getTopicPriority = (topic) => {
  const t = normalizeText(topic)
  if (!t) return 99

  // SKD CPNS
  if (t.includes('twk')) return 1
  if (t.includes('tiu')) return 2
  if (t.includes('tkp')) return 3

  // PPPK
  if (t.includes('teknis')) return 1
  if (t.includes('manajerial')) return 2
  if (t.includes('sosial') || t.includes('soskul')) return 3

  if (t.includes('wawancara')) return 4

  return 99
}

// Sub-topik yang harus diletakkan PALING AKHIR di dalam kategorinya.
// Key = kategori utama (huruf kecil), value = kata kunci sub-topik.
const LAST_SUBTOPIC_RULES = {
  twk: ['bahasa negara'],
  tiu: ['figural']
}

// 0 = normal, 1 = didorong ke akhir kategorinya
const getSubTopicPriority = (item) => {
  const combined = `${normalizeText(item?.mainTopic)} ${normalizeText(item?.subTopic)}`

  const category = Object.keys(LAST_SUBTOPIC_RULES).find(key => combined.includes(key))
  if (!category) return 0

  return LAST_SUBTOPIC_RULES[category].some(keyword => combined.includes(keyword)) ? 1 : 0
}

export const useQuestionSort = () => {
  const sortQuestions = (rawData = []) => {
    return rawData
      .map((item, index) => ({ item, index }))
      .sort((a, b) => {
        // 1. Kategori utama: TWK -> TIU -> TKP
        const priorityA = getTopicPriority(`${a.item?.mainTopic || ''} ${a.item?.subTopic || ''}`)
        const priorityB = getTopicPriority(`${b.item?.mainTopic || ''} ${b.item?.subTopic || ''}`)
        if (priorityA !== priorityB) return priorityA - priorityB

        // 2. Sub-topik: "Bahasa Negara" (TWK) dan "Figural" (TIU) paling akhir
        const subA = getSubTopicPriority(a.item)
        const subB = getSubTopicPriority(b.item)
        if (subA !== subB) return subA - subB

        // 3. Sisanya pertahankan urutan dari backend
        return a.index - b.index
      })
      .map(({ item }) => item)
  }

  return { sortQuestions }
}