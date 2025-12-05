import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Production backend URL (Cloud Run)
const PRODUCTION_API_URL = 'https://budget-backend-5rvijcshfq-ew.a.run.app';

// Determine API URL dynamically for network access
function getApiBaseUrl(): string {
  // Server-side: use environment variable or production URL
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || PRODUCTION_API_URL;
  }
  
  const hostname = window.location.hostname;
  
  // Local development - use env var or localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
  }
  
  // Production: ALWAYS use HTTPS backend URL
  // Ignore NEXT_PUBLIC_API_URL if it contains http:// (build-time issue)
  return PRODUCTION_API_URL;
}

const API_BASE_URL = getApiBaseUrl();

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
