import { apiClient } from './base.js';

// Profile API calls
export const profileAPI = {
  getMyProfile: () => apiClient.get('/api/profile/me'),
  updateMyProfile: (data) => apiClient.put('/api/profile/me', data),
  deleteMyAccount: () => apiClient.delete('/api/profile/me'),
  addMyLocation: (locationData) => apiClient.post('/api/profile/me/location', locationData),
  removeMyLocation: () => apiClient.delete('/api/profile/me/location'),
  getMyProducts: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiClient.get(`/api/profile/me/products/${queryParams ? '?' + queryParams : ''}`);
  },

  // Public profile
  getPublicProfile: (userId) => apiClient.get(`/api/profile/${userId}`),
  getUserProducts: (userId, params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiClient.get(`/api/profile/${userId}/products/${queryParams ? '?' + queryParams : ''}`);
  }
};
