<script setup>
definePageMeta({
  layout: 'default' // Layout user biasa
})

const { user, authToken, setAuthUser } = useAuthUser()
const config = useRuntimeConfig()
const toast = useToast()

const isLoading = ref(false)
const showPasswords = ref(false) // State untuk mata password

const form = ref({
  email: user.value?.email || '',
  username: user.value?.username || '',
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const toggleShowPasswords = () => {
  showPasswords.value = !showPasswords.value
}

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
        'Authorization': `Bearer ${authToken.value}`, 
        'Content-Type': 'application/json'
      },
      body: payload
    })

    toast.add({ title: 'Berhasil', description: 'Profil berhasil diperbarui!', color: 'success' })
    
    // Update state lokal agar nama di Header langsung berubah
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
  <div class="max-w-4xl mx-auto bg-tryout-surface p-8 rounded-xl shadow-sm border border-tryout-border mt-8 mb-12">
    
    <div class="flex items-center gap-3 mb-8 border-b border-tryout-border pb-4">
      <div class="w-12 h-12 bg-tryout-primary/10 text-tryout-primary rounded-full flex items-center justify-center text-xl font-bold">
        <i class="pi pi-user"></i>
      </div>
      <div>
        <h2 class="text-2xl font-bold text-tryout-text">Pengaturan Profil</h2>
        <p class="text-sm text-tryout-muted">Kelola identitas dan kredensial login Anda.</p>
      </div>
    </div>

    <form @submit.prevent="handleUpdateProfile" class="space-y-8">
      
      <div>
        <h3 class="text-lg font-semibold text-tryout-text mb-4 flex items-center gap-2">
          <i class="pi pi-id-card text-tryout-primary"></i> Informasi Dasar
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 bg-tryout-bg/50 p-6 rounded-lg border border-tryout-border">
          <div>
            <label class="block text-sm font-semibold text-tryout-text mb-1">Email</label>
            <input 
              type="email" 
              v-model="form.email" 
              disabled 
              class="w-full px-4 py-2.5 bg-tryout-skeleton border border-tryout-border rounded-lg text-tryout-subtle cursor-not-allowed font-medium" 
            />
            <p class="text-xs text-tryout-muted mt-1">Email sistem tidak dapat diubah.</p>
          </div>

          <div>
            <label class="block text-sm font-semibold text-tryout-text mb-1">Username</label>
            <input 
              type="text" 
              v-model="form.username" 
              required 
              class="w-full px-4 py-2.5 border border-tryout-border rounded-lg focus:ring-2 focus:ring-tryout-primary outline-none bg-tryout-input text-tryout-text placeholder:text-tryout-subtle" 
            />
          </div>
        </div>
      </div>

      <div>
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-tryout-text flex items-center gap-2">
            <i class="pi pi-lock text-tryout-primary"></i> Ganti Kata Sandi
          </h3>
          <!-- <button 
            type="button" 
            @click="toggleShowPasswords" 
            class="text-sm text-tryout-primary font-medium hover:bg-tryout-hover px-3 py-1 rounded transition"
          >
            <i :class="showPasswords ? 'pi pi-eye-slash' : 'pi pi-eye'" class="mr-1"></i>
            {{ showPasswords ? 'Sembunyikan' : 'Lihat Password' }}
          </button> -->
        </div>

        <div class="bg-tryout-bg/50 p-6 rounded-lg border border-tryout-border space-y-4">
          <!-- <p class="text-sm text-tryout-muted mb-2">Kosongkan bagian ini jika Anda tidak ingin mengubah kata sandi.</p> -->
          
          <div class="bg-tryout-primary/5 border border-tryout-primary/20 p-4 rounded-lg flex items-start gap-3">
            <i class="pi pi-info-circle text-tryout-primary mt-0.5"></i>
            <p class="text-sm text-tryout-text leading-relaxed">
              <strong>Lupa kata sandi saat ini?</strong><br> 
              Silakan <strong>Logout</strong> (Keluar) terlebih dahulu, kemudian buka halaman <strong>Login</strong>, klik tulisan <strong>"Lupa password?"</strong> dan ikuti langkah-langkah yang dikirimkan ke email Anda.
            </p>
          </div>
<!--           
          <div>
            <label class="block text-sm font-semibold text-tryout-text mb-1 mt-4">Kata Sandi Saat Ini</label>
            <div class="relative w-full md:w-1/2">
              <input 
                :type="showPasswords ? 'text' : 'password'" 
                v-model="form.oldPassword" 
                placeholder="Masukkan password lama..."
                class="w-full px-4 py-2.5 border border-tryout-border rounded-lg focus:ring-2 focus:ring-tryout-primary outline-none bg-tryout-input text-tryout-text placeholder:text-tryout-subtle pr-10" 
              />
            </div>
          </div> -->
          
          <!-- <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div>
              <label class="block text-sm font-semibold text-tryout-text mb-1">Kata Sandi Baru</label>
              <div class="relative">
                <input 
                  :type="showPasswords ? 'text' : 'password'" 
                  v-model="form.newPassword" 
                  placeholder="Minimal 6 karakter..."
                  class="w-full px-4 py-2.5 border border-gray-300 dark:border-tryout-border rounded-lg focus:ring-2 focus:ring-tryout-primary outline-none bg-tryout-input text-tryout-text placeholder:text-tryout-subtle pr-10" 
                />
              </div>
            </div>
            <div>
              <label class="block text-sm font-semibold text-tryout-text mb-1">Konfirmasi Kata Sandi Baru</label>
              <div class="relative">
                <input 
                  :type="showPasswords ? 'text' : 'password'" 
                  v-model="form.confirmPassword" 
                  placeholder="Ketik ulang password baru..."
                  class="w-full px-4 py-2.5 border border-tryout-border rounded-lg focus:ring-2 focus:ring-tryout-primary outline-none bg-tryout-input text-tryout-text placeholder:text-tryout-subtle pr-10" 
                />
              </div>
            </div>
          </div> -->
        </div>
      </div>

      <div class="pt-4 border-t border-tryout-border flex justify-end">
        <button 
          type="submit" 
          :disabled="isLoading" 
          class="px-8 py-2.5 bg-tryout-primary text-white rounded-lg hover:opacity-90 font-semibold flex items-center gap-2 disabled:opacity-50 transition-all shadow-sm active:scale-[0.98]"
        >
          <i v-if="isLoading" class="pi pi-spin pi-spinner"></i>
          <i v-else class="pi pi-save"></i>
          {{ isLoading ? 'Menyimpan...' : 'Simpan Perubahan' }}
        </button>
      </div>

    </form>
  </div>
</template>