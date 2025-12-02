import { apiClient } from "./base.js";

// Users admin CRUD operations
export const adminAPI = {
  getAllUsers: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const url = queryParams
      ? `/api/admin/users?${queryParams}`
      : "/api/admin/users";
    return apiClient.get(url);
  },
  getUserById: (id) => apiClient.get(`/api/admin/users/${id}`),
  createUser: (userData) => apiClient.post("/api/admin/users", userData),
  updateUser: (id, userData) => apiClient.put(`/api/admin/users/${id}`, userData),
  deleteUser: (id) => apiClient.delete(`/api/admin/users/${id}`),

  // Products admin CRUD operations
  getAllProducts: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiClient.get(`/api/admin/products?${queryParams}`);
  },
  getProductById: (id) => apiClient.get(`/api/admin/products/${id}`),
  createProduct: (productData) => apiClient.post("/api/admin/products", productData),
  updateProduct: (id, productData) => apiClient.put(`/api/admin/products/${id}`, productData),
  deleteProduct: (id) => apiClient.delete(`/api/admin/products/${id}`),

  // Locations crud
  searchLocations: (query) =>
    apiClient.get(`/api/locations/search?q=${encodeURIComponent(query)}`),
  getLocations: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiClient.get(`/api/locations/${queryParams ? '?' + queryParams : ''}`);
  },
  createLocation: (locationData) =>
    apiClient.post("/api/locations", locationData),
  updateLocation: (id, locationData) =>
    apiClient.put(`/api/locations/${id}`, locationData),
  deleteLocation: (id) => apiClient.delete(`/api/locations/${id}`),

  // others
  getStats: () => apiClient.get("/api/admin/stats"),
  getRecentActivity: () => apiClient.get("/api/admin/activity"),
};
