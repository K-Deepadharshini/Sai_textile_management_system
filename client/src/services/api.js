// src/services/api.js
import axios from 'axios';

// Create axios instance
const api = axios.create({
  // Normalize VITE_API_URL: allow values like ':5000/api' by prefixing protocol and host
  baseURL: (() => {
    try {
      let envUrl = import.meta.env.VITE_API_URL;
      if (envUrl && typeof envUrl === 'string' && envUrl.startsWith(':')) {
        envUrl = `http://localhost${envUrl}`;
        console.warn('Normalized VITE_API_URL to', envUrl);
      }
      const finalUrl = envUrl || 'http://localhost:5000/api';
      console.info('API baseURL set to', finalUrl);
      return finalUrl;
    } catch (e) {
      console.error('Error reading VITE_API_URL, falling back to default', e);
      return 'http://localhost:5000/api';
    }
  })(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API response error:', error?.response?.status, error?.message);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;