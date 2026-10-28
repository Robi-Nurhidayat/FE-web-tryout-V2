<script setup>
const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Peringatan'
  },
  message: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'warning', // 'warning', 'success', 'error', 'info'
    validator: (value) => ['warning', 'success', 'error', 'info'].includes(value)
  },
  confirmText: {
    type: String,
    default: 'OK'
  },
  cancelText: {
    type: String,
    default: 'Batal'
  },
  showCancel: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['confirm', 'cancel', 'close'])

const handleConfirm = () => {
  emit('confirm')
  emit('close')
}

const handleCancel = () => {
  emit('cancel')
  emit('close')
}

const getIconConfig = () => {
  const configs = {
    warning: {
      bgColor: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
    },
    success: {
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    error: {
      bgColor: 'bg-red-100',
      iconColor: 'text-red-600',
      icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    info: {
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
      icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    }
  }
  return configs[props.type] || configs.warning
}
</script>

<template>
  <!-- Backdrop Overlay -->
  <Transition name="fade">
    <div 
      v-if="show"
      class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-[9998] flex items-center justify-center p-4"
      @click.self="showCancel ? handleCancel() : null"
    >
      <!-- Modal Container -->
      <Transition name="modal">
        <div 
          v-if="show"
          class="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform"
        >
          <!-- Header with Icon -->
          <div class="p-6 pb-4">
            <div class="flex items-start gap-4">
              <!-- Icon -->
              <div :class="[getIconConfig().bgColor, 'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center']">
                <svg :class="[getIconConfig().iconColor, 'w-6 h-6']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getIconConfig().icon" />
                </svg>
              </div>

              <!-- Title & Message -->
              <div class="flex-1 pt-1">
                <h3 class="text-xl font-bold text-gray-900 mb-2">
                  {{ title }}
                </h3>
                <p class="text-gray-600 leading-relaxed whitespace-pre-line">
                  {{ message }}
                </p>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="bg-gray-50 px-6 py-4 flex gap-3 justify-end">
            <button 
              v-if="showCancel"
              @click="handleCancel"
              class="px-6 py-2.5 bg-white border-2 border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-semibold transition-all shadow-sm hover:shadow"
            >
              {{ cancelText }}
            </button>
            <button 
              @click="handleConfirm"
              :class="[
                'px-6 py-2.5 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg',
                type === 'error' ? 'bg-red-600 hover:bg-red-700 text-white' :
                type === 'success' ? 'bg-green-600 hover:bg-green-700 text-white' :
                type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700 text-white' :
                'bg-blue-600 hover:bg-blue-700 text-white'
              ]"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<style scoped>
/* Fade transition untuk backdrop */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Modal transition */
.modal-enter-active {
  transition: all 0.3s ease;
}

.modal-leave-active {
  transition: all 0.2s ease;
}

.modal-enter-from {
  opacity: 0;
  transform: scale(0.9) translateY(-20px);
}

.modal-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}
</style>