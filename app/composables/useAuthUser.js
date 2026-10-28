// composables/useAuthUser.js
export const useAuthUser = () => {

    // ✅ Simpan token DAN user data di cookie
    const authToken = useCookie('auth_token', {
        maxAge: 60 * 60 * 24 * 7, // 7 hari
        path: '/',
        sameSite: 'lax'
    });

    // ✅ Simpan user data di cookie (bukan useState saja)
    const userCookie = useCookie('auth_user', {
        maxAge: 60 * 60 * 24 * 7, // 7 hari
        path: '/',
        sameSite: 'lax'
    });

    // ✅ State untuk reactive UI (sync dengan cookie)
    const user = useState('auth_user', () => {
        // Initialize dari cookie jika ada
        return userCookie.value || null;
    });

    // ✅ Update: Simpan ke BOTH state dan cookie
    const setAuthUser = (userData, token) => {
        user.value = userData;
        userCookie.value = userData; // ✅ Simpan ke cookie
        authToken.value = token;
    };

    // ✅ Logout: Hapus BOTH state dan cookie
    const logout = () => {
        user.value = null;
        userCookie.value = null; // ✅ Hapus cookie
        authToken.value = null;
        
        // ✅ Force redirect dengan reload
        return navigateTo('/', { 
            replace: true,
            external: true // Force full page reload
        });
    };

    // ✅ FIXED: Check login dengan AND (&&), bukan OR (||)
    const isLoggedIn = computed(() => {
        // Harus ada user DAN token
        const hasUser = user.value !== null && user.value !== undefined;
        const hasToken = authToken.value !== null && authToken.value !== undefined;
        
        return hasUser && hasToken;
    });

    const userRole = computed(() => {
        const currentUser = user.value || userCookie.value;
        return currentUser?.role || 'GUEST';
    });

    return {
        user,
        authToken,
        isLoggedIn,
        setAuthUser,
        logout,
        userRole,
    };
};