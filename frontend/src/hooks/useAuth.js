import { useAuthStore } from '../stores/authStore';

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const loading = useAuthStore((state) => state.loading);
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const logout = useAuthStore((state) => state.logout);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const updateUser = useAuthStore((state) => state.updateUser);
  
  // Compute these here instead of in selectors
  const isAuthenticated = !!(user && token);
  const isAdmin = user?.is_admin || false;

  return {
    user,
    token,
    loading,
    login,
    register,
    logout,
    checkAuth,
    updateUser,
    isAuthenticated,
    isAdmin,
  };
}
