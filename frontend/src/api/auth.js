import { apiClient } from './base.js';

// Auth API calls
export const authAPI = {
  login: (credentials) => apiClient.post('/api/auth/login', credentials),
  register: (userData) => apiClient.post('/api/auth/register', userData),
  getProfile: (token) => apiClient.get('/api/auth/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
};
