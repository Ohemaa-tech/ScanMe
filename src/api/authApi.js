import axiosClient from './axiosClient';

export const authApi = {
  // POST /api/auth/login → { token, userId, username, fullName, role, expiresInHours }
  login: (username, password) =>
    axiosClient.post('/auth/login', { username, password }),

  // GET /api/auth/me → { id, username, email, fullName, role, isActive }
  getMe: () => axiosClient.get('/auth/me'),

  // POST /api/auth/register-worker → created worker profile
  registerWorker: (data) => axiosClient.post('/auth/register-worker', data),
};
