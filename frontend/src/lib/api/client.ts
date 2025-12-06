import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// ✅ SOLUTION RADICALE: Hardcoder les URLs par environnement
// Plus de NEXT_PUBLIC_API_URL qui peut être HTTP/HTTPS incohérent
const API_URLS = {
  // Local development
  localhost: 'http://localhost:8001',
  '127.0.0.1': 'http://localhost:8001',
  
  // Production - TOUJOURS HTTPS avec domaine custom
  production: 'https://backend-budget.novacat.fr',
} as const;

// Determine API URL dynamically based on hostname ONLY
function getApiBaseUrl(): string {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  
  // Local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return API_URLS.localhost;
  }
  
  // Production - TOUJOURS HTTPS
  return API_URLS.production;
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
