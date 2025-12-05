import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Production backend URL - Custom domain (always HTTPS)
const PRODUCTION_API_URL = 'https://backend-budget.novacat.fr';

// Determine API URL dynamically
function getApiBaseUrl(): string {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  
  // Local development - use env var or localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
  }
  
  // Production - use custom domain
  return PRODUCTION_API_URL;
}

export const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    config.baseURL = `${getApiBaseUrl()}/api`;
    
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
