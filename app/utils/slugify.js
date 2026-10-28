export const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Ganti spasi dengan -
    .replace(/[^\w\-]+/g, '') // Hapus karakter non-alphanumeric
    .replace(/\-\-+/g, '-') // Hapus double -
}