import { apiClient } from './base.js';

// Users admin CRUD operations
export const usersAPI = {
  getAllUsers: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const url = queryParams ? `/api/admin/users?${queryParams}` : '/api/admin/users';
    return apiClient.get(url);
  },
  getById: (id) => apiClient.get(`/api/admin/users/${id}`),
  create: (userData) => apiClient.post('/api/admin/users', userData),
  update: (id, userData) => apiClient.put(`/api/admin/users/${id}`, userData),
  delete: (id) => apiClient.delete(`/api/admin/users/${id}`)
};


// Products admin CRUD operations
export const productsAPI = {
  getAllProducts: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiClient.get(`/api/admin/products?${queryParams}`);
  },
  getById: (id) => apiClient.get(`/api/admin/products/${id}`),
  create: (productData) => apiClient.post('/api/admin/products', productData),
  update: (id, productData) => apiClient.put(`/api/admin/products/${id}`, productData),
  delete: (id) => apiClient.delete(`/api/admin/products/${id}`)
};

// others
export const adminAPI = {
  getStats: () => apiClient.get('/api/admin/stats'),
  getRecentActivity: () => apiClient.get('/api/admin/activity')
};