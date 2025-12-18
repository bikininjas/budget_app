import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

function getApiBaseUrl(): string {
  // For client-side: use environment variable if available
  // NEXT_PUBLIC_* variables are replaced at build time by Next.js
  if (typeof window !== 'undefined') {
    // Client-side: use the build-time replaced variable
    // This is the most reliable method as it's baked into the JS bundle
    if (process.env.NEXT_PUBLIC_API_URL) {
      // Force HTTP for localhost URLs to avoid SSL issues
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      console.log('API Client - Environment URL:', apiUrl);
      if (apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1')) {
        console.warn('Forcing HTTP for localhost to avoid SSL issues');
        const httpUrl = apiUrl.replace('https://', 'http://');
        console.log('API Client - Converted to HTTP:', httpUrl);
        return httpUrl;
      }
      return apiUrl;
    }
    
    // Fallback for client-side when env var is not set
    // This should rarely happen if build is configured correctly
    const hostname = window.location.hostname;
    console.log('API Client - Hostname:', hostname);
    
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
      // Always use HTTP for localhost to avoid SSL issues in development
      console.log('API Client - Using HTTP for localhost development');
      return 'http://localhost:8000';
    }
    
    // For Docker containers or other local development environments
    // Check if we're running in a container with specific hostnames
    if (hostname.includes('docker') || hostname.includes('localhost')) {
      return 'http://localhost:8000';
    }
    
    // Production fallback - should only be used if all else fails
    console.warn('Using production API URL as fallback. Check your NEXT_PUBLIC_API_URL configuration.');
    return 'https://backend-budget.novacat.fr';
  }
  
  // For server-side rendering (SSR): use fallback logic
  // During SSR, process.env.NEXT_PUBLIC_* is not available
  // We need to use a safe fallback
  return 'http://localhost:8000';
}

export const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const baseUrl = getApiBaseUrl();
    config.baseURL = `${baseUrl}/api`;
    
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
