<script setup>
definePageMeta({
  layout: 'admin' // ✅ Gunakan layout khusus admin
})

const { user, authToken, setAuthUser } = useAuthUser()
const config = useRuntimeConfig()
const toast = useToast()

const isLoading = ref(false)

const form = ref({
  email: user.value?.email || '',
  username: user.value?.username || '',
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const handleUpdateProfile = async () => {
  // Jika isi password baru, wajib isi password lama dan konfirmasi
  if (form.value.newPassword || form.value.oldPassword) {
    if (!form.value.oldPassword) {
      toast.add({ title: 'Gagal', description: 'Masukkan password lama Anda', color: 'red' })
      return
    }
    if (form.value.newPassword !== form.value.confirmPassword) {
      toast.add({ title: 'Gagal', description: 'Konfirmasi password baru tidak cocok', color: 'red' })
      return
    }
  }

  isLoading.value = true

  try {
    const payload = {
      username: form.value.username,
    }

    if (form.value.newPassword) {
      payload.oldPassword = form.value.oldPassword
      payload.newPassword = form.value.newPassword
    }

    const response = await $fetch('/api/v1/auth/me', {
      baseURL: config.public.apiBaseUrl,
      method: 'PUT',
      headers: {
        'Authorization': `${authToken.value}`,
        'Content-Type': 'application/json'
      },
      body: payload
    })

    toast.add({ title: 'Berhasil', description: 'Profil Admin berhasil diperbarui!', color: 'success' })
    
    // Update state lokal agar nama di Header Admin langsung berubah
    if (response?.data) {
      setAuthUser({
        ...user.value,
        username: response.data.username
      }, authToken.value)
    }

    // Reset form password
    form.value.oldPassword = ''
    form.value.newPassword = ''
    form.value.confirmPassword = ''

  } catch (err) {
    const errorMsg = err.data?.message || 'Gagal memperbarui profil.'
    toast.add({ title: 'Gagal', description: errorMsg, color: 'red' })
    console.error(err)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-200">
    <div class="flex items-center gap-3 mb-8 border-b border-gray-100 pb-4">
      <div class="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xl font-bold">
        <i class="pi pi-user"></i>
      </div>
      <div>
        <h2 class="text-2xl font-bold text-gray-800">Pengaturan Profil Admin</h2>
        <p class="text-sm text-gray-500">Kelola identitas dan kredensial login administrator.</p>
      </div>
    </div>

    <form @submit.prevent="handleUpdateProfile" class="space-y-8">
      
      <div>
        <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <i class="pi pi-id-card text-indigo-600"></i> Informasi Dasar
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-lg border border-gray-100">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">Email Administrator</label>
            <input 
              type="email" 
              v-model="form.email" 
              disabled 
              class="w-full px-4 py-2.5 bg-gray-200 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed" 
            />
            <p class="text-xs text-gray-400 mt-1">Email sistem tidak dapat diubah.</p>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">Username</label>
            <input 
              type="text" 
              v-model="form.username" 
              required 
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white" 
            />
          </div>
        </div>
      </div>

      <div>
        <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <i class="pi pi-lock text-indigo-600"></i> Ganti Kata Sandi
        </h3>
        <div class="bg-gray-50 p-6 rounded-lg border border-gray-100 space-y-4">
          <p class="text-sm text-gray-500 mb-2">Kosongkan bagian ini jika Anda tidak ingin mengubah kata sandi.</p>
          
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">Kata Sandi Saat Ini</label>
            <input 
              type="password" 
              v-model="form.oldPassword" 
              placeholder="Masukkan password lama..."
              class="w-full md:w-1/2 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white" 
            />
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">Kata Sandi Baru</label>
              <input 
                type="password" 
                v-model="form.newPassword" 
                placeholder="Minimal 6 karakter..."
                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white" 
              />
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">Konfirmasi Kata Sandi Baru</label>
              <input 
                type="password" 
                v-model="form.confirmPassword" 
                placeholder="Ketik ulang password baru..."
                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white" 
              />
            </div>
          </div>
        </div>
      </div>

      <div class="pt-4 border-t border-gray-100 flex justify-end">
        <button 
          type="submit" 
          :disabled="isLoading" 
          class="px-8 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold flex items-center gap-2 disabled:opacity-50 transition-colors shadow-sm"
        >
          <i v-if="isLoading" class="pi pi-spin pi-spinner"></i>
          <i v-else class="pi pi-save"></i>
          {{ isLoading ? 'Menyimpan...' : 'Simpan Profil Admin' }}
        </button>
      </div>

    </form>
  </div>
</template>