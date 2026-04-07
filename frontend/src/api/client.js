import axios from 'axios';

// Base URL for the backend API.
// In production this is set via the VITE_API_URL environment variable
// (injected at build time by Vite). In development the Vite dev server
// proxies /api/* to the local backend, so an empty string is correct.
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Pre-configured axios instance for all backend API calls.
 *
 * Usage:
 *   import apiClient from '../api/client';
 *   const { data } = await apiClient.get('/api/products');
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Attach the stored admin token to every request when present
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Normalise error responses so callers always get a useful message
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

/**
 * Returns the full URL for a given API path, respecting VITE_API_URL.
 * Useful when you need to pass a URL string rather than use the axios
 * instance (e.g. native fetch calls in legacy code).
 *
 * Example:
 *   apiUrl('/api/products')  →  'https://api.example.com/api/products'
 */
export function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

export default apiClient;
