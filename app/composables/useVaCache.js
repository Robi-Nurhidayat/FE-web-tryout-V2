// composables/useVaCache.js

const CIPHER_KEY = 'ppagi_va_2025'

const xorEncrypt = (str, key) => {
  return str.split('').map((char, i) =>
    String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))
  ).join('')
}

const encode = (data) => {
  try {
    const json = JSON.stringify(data)
    const xored = xorEncrypt(json, CIPHER_KEY)
    return btoa(unescape(encodeURIComponent(xored)))
  } catch { return null }
}

const decode = (encoded) => {
  try {
    const xored = decodeURIComponent(escape(atob(encoded)))
    const json = xorEncrypt(xored, CIPHER_KEY)
    return JSON.parse(json)
  } catch { return null }
}

export const useVaCache = () => {
  const buildKey = (packetId) => `_trx_${packetId}`
  // Key terpisah di sessionStorage untuk data besar (QR string, payment URL)
  // sessionStorage: hilang saat tab ditutup, cocok untuk QR yang short-lived
  const buildSessionKey = (packetId) => `_trx_session_${packetId}`

  // =============================================
  // LOCALSTORAGE — simpan info ringan (VA, paymentType, bankName, paymentCode)
  // Persistent, dipakai untuk navigasi bolak-balik
  // =============================================
  const savePaymentInfo = (packetId, paymentInfo, expiredAt) => {
    if (!packetId || !paymentInfo) return
    try {
      // Simpan data ringan ke localStorage (tanpa qrString dan paymentUrl yang besar)
      const lightPayload = {
        paymentType: paymentInfo.paymentType || null,
        vaNumber: paymentInfo.vaNumber || null,
        bankName: paymentInfo.bankName || null,
        paymentCode: paymentInfo.paymentCode || null,
        expireAt: expiredAt
          ? new Date(expiredAt).getTime()
          : Date.now() + (60 * 60 * 1000)
      }
      const encoded = encode(lightPayload)
      if (encoded) localStorage.setItem(buildKey(packetId), encoded)

      // Simpan QR string dan payment URL ke sessionStorage (boleh besar)
      if (paymentInfo.qrString || paymentInfo.paymentUrl) {
        const sessionPayload = {
          qrString: paymentInfo.qrString || null,
          paymentUrl: paymentInfo.paymentUrl || null,
          expireAt: lightPayload.expireAt
        }
        sessionStorage.setItem(buildSessionKey(packetId), JSON.stringify(sessionPayload))
      }
    } catch {}
  }

  // Backward compat
  const saveVa = (packetId, vaNumber, bankName, expiredAt) => {
    savePaymentInfo(packetId, {
      paymentType: 'bank_transfer',
      vaNumber, bankName,
      qrString: null, paymentUrl: null, paymentCode: null,
    }, expiredAt)
  }

  // =============================================
  // GET — gabungkan dari localStorage + sessionStorage
  // =============================================
  const getPaymentInfo = (packetId) => {
    try {
      // Ambil data ringan dari localStorage
      const raw = localStorage.getItem(buildKey(packetId))
      let lightData = null
      if (raw) {
        const decoded = decode(raw)
        if (decoded) {
          if (decoded.expireAt && Date.now() > decoded.expireAt) {
            localStorage.removeItem(buildKey(packetId))
            sessionStorage.removeItem(buildSessionKey(packetId))
            return null
          }
          const { expireAt, ...info } = decoded
          lightData = info
        }
      }

      // Ambil QR/URL dari sessionStorage
      let sessionData = null
      const sessionRaw = sessionStorage.getItem(buildSessionKey(packetId))
      if (sessionRaw) {
        const parsed = JSON.parse(sessionRaw)
        if (parsed.expireAt && Date.now() > parsed.expireAt) {
          sessionStorage.removeItem(buildSessionKey(packetId))
        } else {
          const { expireAt, ...sInfo } = parsed
          sessionData = sInfo
        }
      }

      if (!lightData && !sessionData) return null

      return {
        ...(lightData || {}),
        ...(sessionData || {}),
      }
    } catch { return null }
  }

  // Backward compat
  const getVa = (packetId) => {
    const info = getPaymentInfo(packetId)
    if (!info?.vaNumber) return null
    return { vaNumber: info.vaNumber, bankName: info.bankName }
  }

  const clearVa = (packetId) => {
    try {
      localStorage.removeItem(buildKey(packetId))
      sessionStorage.removeItem(buildSessionKey(packetId))
    } catch {}
  }

  const cleanExpired = () => {
    try {
      // Bersihkan localStorage
      Object.keys(localStorage)
        .filter(key => key.startsWith('_trx_'))
        .forEach(key => {
          const raw = localStorage.getItem(key)
          if (!raw) return
          const data = decode(raw)
          if (!data || (data.expireAt && Date.now() > data.expireAt)) {
            localStorage.removeItem(key)
          }
        })
      // Bersihkan sessionStorage
      Object.keys(sessionStorage)
        .filter(key => key.startsWith('_trx_session_'))
        .forEach(key => {
          try {
            const data = JSON.parse(sessionStorage.getItem(key))
            if (!data || (data.expireAt && Date.now() > data.expireAt)) {
              sessionStorage.removeItem(key)
            }
          } catch { sessionStorage.removeItem(key) }
        })
    } catch {}
  }

  return { savePaymentInfo, saveVa, getPaymentInfo, getVa, clearVa, cleanExpired }
}