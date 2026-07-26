import { useAuthStore } from '../store/authStore';

/**
 * Custom hook providing simplified access to Auth state and actions.
 */
export function useAuth() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);

  const role = user?.role || null;
  const isOwner = role === 'Owner';
  const isWorker = role === 'Worker';

  const hasRole = (requiredRole) => {
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(role);
    }
    return role === requiredRole;
  };

  return {
    token,
    user,
    role,
    isOwner,
    isWorker,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    hasRole,
  };
}

export default useAuth;
