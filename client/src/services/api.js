// src/services/api.js
import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: 'https://sai-textile-management-system-backend.onrender.com/api',
  // Do NOT set a default Content-Type header; allow axios to set it automatically (especially for FormData uploads)
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // When sending FormData (e.g., file uploads), allow axios to set the multipart boundary header.
    // If we leave a default Content-Type, it can prevent multipart parsing on the server.
    if (config.data instanceof FormData) {
      if (config.headers) {
        delete config.headers['Content-Type'];
      }
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