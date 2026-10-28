export const useImageUrl = () => {
  const config = useRuntimeConfig()

  const getImageUrl = (filename) => {
    if (!filename || filename.trim() === '' || filename === '-') return null

    const base = String(config.public.apiBaseUrl || '').replace(/\/+$/, '')

    let path = filename.startsWith('http') ? new URL(filename).pathname : filename
    if (!path.startsWith('/')) path = `/${path}`
    if (!path.startsWith('/uploads/')) path = `/uploads${path}`

    const encoded = path
      .split('/')
      .map(seg => {
        try { return encodeURIComponent(decodeURIComponent(seg)) }
        catch { return encodeURIComponent(seg) }
      })
      .join('/')

    return `${base}${encoded}`
  }

  return { getImageUrl }
}