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

export const useAuthStore = create((set, get) => ({
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
      let msg = 'Invalid username or password';
      if (!err.response) {
        msg = `Backend server unreachable at http://${window.location.hostname}:5000. Please allow Port 5000 in Windows Firewall.`;
      } else if (err.response?.data?.detail) {
        msg = err.response.data.detail;
      } else if (err.response?.data?.title) {
        msg = err.response.data.title;
      }
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
    const user = get().user;
    return user?.role === role;
  },
}));

