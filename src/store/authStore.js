import { create } from 'zustand';
import { authApi } from '../api/authApi';

// Rehydrate from localStorage
const storedToken = localStorage.getItem('pos_token') || null;
const storedUser = (() => {
  try {
    return JSON.parse(localStorage.getItem('pos_user') || 'null');
  } catch {
    return null;
  }
})();

export const useAuthStore = create((set) => ({
  token: storedToken,
  user: storedUser,
  isAuthenticated: !!storedToken && !!storedUser,
  error: null,
  loading: false,

  login: async (username, password) => {
    set({ loading: true, error: null });
    try {
      // Response: { token, userId, username, fullName, role, expiresInHours }
      const response = await authApi.login(username, password);
      const { token, userId, username: userName, fullName, role } = response;

      const userObj = { id: userId, username: userName, fullName, role };

      localStorage.setItem('pos_token', token);
      localStorage.setItem('pos_user', JSON.stringify(userObj));

      set({ token, user: userObj, isAuthenticated: true, loading: false, error: null });
      return true;
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.title ||
        'Invalid username or password';
      set({ error: msg, loading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('pos_token');
    localStorage.removeItem('pos_user');
    set({ token: null, user: null, isAuthenticated: false, error: null });
  },

  // Helper: check if current user has a specific role
  hasRole: (role) => {
    const user = storedUser;
    return user?.role === role;
  },
}));
