import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Attach JWT token to every request
axiosClient.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('pos_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {}
  return config;
});

// Handle 401 → auto logout, unwrap response data
axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('pos_token');
      localStorage.removeItem('pos_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
