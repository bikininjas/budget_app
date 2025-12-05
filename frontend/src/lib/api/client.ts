import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Production backend URL (Cloud Run) - ALWAYS HTTPS
// Last updated: 2025-12-05 13:00 - Force cache bust
const PRODUCTION_API_URL = 'https://budget-backend-5rvijcshfq-ew.a.run.app';

// Determine API URL dynamically for network access
function getApiBaseUrl(): string {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  
  // Local development ONLY - use env var or localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
  }
  
  // Production: ALWAYS use hardcoded HTTPS URL
  // NEVER use NEXT_PUBLIC_API_URL in production (causes http:// issues)
  return PRODUCTION_API_URL;
}

// Log API URL on client side for debugging
if (typeof window !== 'undefined') {
  console.log('🔧 API Client v2025-12-05 - Base URL:', getApiBaseUrl());
}

export const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

// Set baseURL dynamically on every request to force HTTPS
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Always recalculate baseURL to ensure HTTPS
    const baseUrl = getApiBaseUrl();
    config.baseURL = `${baseUrl}/api`;
    
    // Debug log (remove after fix confirmed)
    if (typeof window !== 'undefined' && !baseUrl.startsWith('https://')) {
      console.error('❌ HTTPS ERROR: baseURL is', baseUrl, 'but should be HTTPS!');
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
