// stores/useTransactionStore.js
import { defineStore } from 'pinia'

export const useTransactionStore = defineStore('transaction', {
  state: () => ({
    // Key: packetId, Value: { vaNumber, bankName }
    vaCache: {}
  }),

  actions: {
    saveVa(packetId, vaNumber, bankName) {
      if (!packetId || !vaNumber) return
      this.vaCache[packetId] = { vaNumber, bankName: bankName || '' }
    },

    getVa(packetId) {
      return this.vaCache[packetId] || null
    },

    clearVa(packetId) {
      delete this.vaCache[packetId]
    }
  }
})