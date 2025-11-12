import { apiClient } from './base.js';

// Products API calls
export const productsAPI = {
  getAll: (params = {}) => {
    // Remove undefined/null values
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== "")
    );
    const queryString = new URLSearchParams(filteredParams).toString();
    return apiClient.get(`/api/products/${queryString ? `?${queryString}` : ""}`);
  },
  getById: (id) => apiClient.get(`/api/products/${id}`),
  getCategories: () => apiClient.get('/api/products/categories'),
  getLocations: () => apiClient.get('/api/products/locations'),
  getCurrencies: () => apiClient.get('/api/products/currencies'),
  getProductDetails: () => apiClient.get('/api/products/productdetails'),
  
  create: (productData, images = []) => {
    const formData = new FormData();
    formData.append('product_data', JSON.stringify(productData));
    
    images.forEach((image) => {
      if (image instanceof File) {
        formData.append('images', image);
      }
    });
    
    return apiClient.post('/api/products/', formData);
  },
  
  update: (id, productData, images = []) => {
    const formData = new FormData();
    formData.append('product_data', JSON.stringify(productData));
    
    images.forEach((image) => {
      formData.append('images', image);
    });
    
    return apiClient.put(`/api/products/${id}`, formData);
  },
  
  delete: (id) => apiClient.delete(`/api/products/${id}`)
};
