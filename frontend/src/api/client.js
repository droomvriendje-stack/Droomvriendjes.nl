import axios from 'axios';

// Base URL for the backend API.
// In production this is set via the VITE_API_URL environment variable
// (injected at build time by Vite). Falls back to the production URL
// so API calls always reach the correct service even if the env var
// is not explicitly set at build time.
export const API_URL = import.meta.env.VITE_API_URL || 'https://web-production-3e5df6.up.railway.app';

// Base URL for the products API (separate service).
export const PRODUCTS_API_URL = import.meta.env.VITE_PRODUCTS_API_URL || 'https://web-production-3e5df6.up.railway.app';

/**
 * Pre-configured axios instance for all backend API calls.
 *
 * Usage:
 *   import apiClient from '../api/client';
 *   const { data } = await apiClient.get('/api/products');
 */
const apiClient = axios.create({
  baseURL: API_URL,
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
 *   apiUrl('/api/products')  →  'https://api.spoeddenhaag.nl/api/products'
 */
export function apiUrl(path) {
  return `${API_URL}${path}`;
}

/**
 * Fetch wrapper for the backend API.
 * Automatically prepends API_URL and sets Content-Type: application/json.
 */
export async function apiCall(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

/**
 * Fetch wrapper for the products API.
 * Automatically prepends PRODUCTS_API_URL and sets Content-Type: application/json.
 */
export async function productsApiCall(endpoint, options = {}) {
  const url = `${PRODUCTS_API_URL}${endpoint}`;
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

export default apiClient;
