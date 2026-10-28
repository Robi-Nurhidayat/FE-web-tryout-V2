// middleware/role.global.js
export default defineNuxtRouteMiddleware((to, from) => {
  // Hanya jalankan di sisi client untuk menghindari error SSR dengan state auth
  if (process.client) {
    const { userRole, isLoggedIn } = useAuthUser()

    const role = userRole.value
    const isAuth = isLoggedIn.value
    const path = to.path

    // 1. BLOKIR USER DARI HALAMAN ADMIN
    if (path.startsWith('/admin')) {
      // Jika belum login atau bukan ADMIN, tendang ke Beranda atau Login
      if (!isAuth) {
        return navigateTo('/auth/sign-in')
      }
      if (role !== 'ADMIN') {
        return navigateTo('/') 
      }
    }

    // 2. BLOKIR ADMIN DARI HALAMAN KHUSUS USER (Dashboard User)
    // Daftarkan URL apa saja yang khusus untuk murid/peserta
    const userOnlyPaths = ['/overview', '/my-packets', '/tryout']
    const isTryingToAccessUserPage = userOnlyPaths.some(p => path.startsWith(p))

    if (isTryingToAccessUserPage && role === 'ADMIN') {
      // Tendang admin kembali ke wilayahnya
      return navigateTo('/admin/dashboard')
    }
  }
})