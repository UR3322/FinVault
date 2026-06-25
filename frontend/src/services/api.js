import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach stored token as Authorization header on every request.
// This is the fallback for mobile browsers (Safari iOS) that block
// cross-site cookies — the backend accepts either cookies or Bearer token.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fv_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect on the initial auth check (/auth/me) —
      // that 401 just means "not logged in", which is fine on public pages.
      // Only redirect when a protected action fails mid-session.
      const isAuthCheck = error.config?.url?.includes('/auth/me');
      if (!isAuthCheck && window.location.pathname !== '/login') {
        localStorage.removeItem('fv_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
