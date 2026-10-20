import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to get cookie value
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

// Request interceptor to attach fallback Bearer token and CSRF header
api.interceptors.request.use(
  (config) => {
    // Attach token from sessionStorage if present as fallback
    const token = sessionStorage.getItem('yms_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Attach CSRF token if cookie is present
    const xsrfToken = getCookie('XSRF-TOKEN');
    if (xsrfToken) {
      config.headers['X-CSRF-Token'] = xsrfToken;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle session expiration cleanly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/login')
    ) {
      sessionStorage.removeItem('yms_token');
      sessionStorage.removeItem('yms_user');
      if (window.location.pathname !== '/login' && !window.location.pathname.startsWith('/track')) {
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
