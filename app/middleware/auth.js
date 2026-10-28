// middleware/auth.js
export default defineNuxtRouteMiddleware((to, from) => {
    const { isLoggedIn, user } = useAuthUser(); 
    
    // ✅ Debug log (bisa dihapus nanti)
    // console.log('Auth Check:', {
    //     isLoggedIn: isLoggedIn.value,
    //     user: user.value,
    //     path: to.path
    // });
    
    // Jika user BELUM login, redirect ke halaman login
    if (!isLoggedIn.value) {
        return navigateTo('/auth/sign-in', { replace: true }); 
    }
    
    // Jika sudah login, izinkan akses
});