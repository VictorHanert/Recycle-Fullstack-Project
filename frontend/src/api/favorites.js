import { apiClient } from './base';

export const favoritesAPI = {
  add: async (productId) => {
    return await apiClient.post(`/api/favorites/${productId}`);
  },

  remove: async (productId) => {
    return await apiClient.delete(`/api/favorites/${productId}`);
  },

  checkStatus: async (productId) => {
    return await apiClient.get(`/api/favorites/${productId}/status`);
  },

  getAll: async () => {
    return await apiClient.get('/api/favorites/');
  },

  toggle: async (productId, isFavorite) => {
    if (isFavorite) {
      return await favoritesAPI.remove(productId);
    } else {
      return await favoritesAPI.add(productId);
    }
  }
};
