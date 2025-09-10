import { apiClient } from './base.js';

// Products API calls
export const productsAPI = {
  getAll: (params = {}) => {
    // Remove undefined/null values
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== "")
    );
    const queryString = new URLSearchParams(filteredParams).toString();
    return apiClient.get(`/api/products${queryString ? `?${queryString}` : ""}`);
  },
  getById: (id) => apiClient.get(`/api/products/${id}`),
  getCategories: () => apiClient.get('/api/products/categories'),
  getLocations: () => apiClient.get('/api/products/locations'),
  getCurrencies: () => apiClient.get('/api/products/currencies'),
  getProductDetails: () => apiClient.get('/api/products/productdetails'),
  create: (product) => apiClient.post('/api/products/', product),
  update: (id, product) => apiClient.put(`/api/products/${id}`, product),
  delete: (id) => apiClient.delete(`/api/products/${id}`)
};
