import axios from 'axios';

// Live Render Backend API URL
const renderBackendUrl = 'https://mini-erp-crm-portal-4bg4.onrender.com';

const baseURL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : import.meta.env.PROD
  ? `${renderBackendUrl}/api`
  : '/api';

const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
