import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// ✅ SOLUTION ULTRA-RADICALE: TOUJOURS HTTPS EN PRODUCTION
// Forcer HTTPS partout sauf localhost explicite
function getApiBaseUrl(): string {
  // Client-side: Check if we're on localhost
  if (globalThis.window !== undefined) {
    const hostname = globalThis.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8001';
    }
  }
  
  // Server-side SSR or any production client: ALWAYS HTTPS
  return 'https://backend-budget.novacat.fr';
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
    
    // Add API key if configured (optional security layer)
    const apiKey = process.env.NEXT_PUBLIC_API_KEY;
    if (apiKey && config.headers) {
      config.headers['X-API-Key'] = apiKey;
    }
    
    if (globalThis.window !== undefined) {
      const token = globalThis.localStorage.getItem('access_token');
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
      if (globalThis.window !== undefined) {
        globalThis.localStorage.removeItem('access_token');
        globalThis.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
