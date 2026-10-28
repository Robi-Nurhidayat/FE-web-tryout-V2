// plugins/auth.client.js
export default defineNuxtPlugin(() => {
    const { user, authToken } = useAuthUser();
    const userCookie = useCookie('auth_user');
    
    // ✅ Restore user dari cookie saat app load
    if (authToken.value && userCookie.value && !user.value) {
        // console.log('🔐 Restoring user from cookie:', userCookie.value.username);
        user.value = userCookie.value;
    }
});