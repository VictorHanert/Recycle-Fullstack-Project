import { apiClient } from './base.js';

// Users API calls (admin only)
export const usersAPI = {
  getAll: () => apiClient.get('/api/admin/users'),
  getById: (id) => apiClient.get(`/api/admin/users/${id}`),
  update: (id, userData) => apiClient.put(`/api/admin/users/${id}`, userData),
  delete: (id) => apiClient.delete(`/api/admin/users/${id}`)
};

// Admin stats API calls
export const adminAPI = {
  getStats: () => apiClient.get('/api/admin/stats'),
  getAllProducts: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiClient.get(`/api/admin/products?${queryParams}`);
  }
};
