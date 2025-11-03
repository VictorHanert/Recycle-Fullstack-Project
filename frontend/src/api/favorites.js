import { apiClient } from './base';

/**
 * Favorites API
 */
export const favoritesAPI = {
  /**
   * Add product to favorites
   */
  add: async (productId) => {
    return await apiClient.post(`/api/favorites/${productId}`);
  },

  /**
   * Remove product from favorites
   */
  remove: async (productId) => {
    return await apiClient.delete(`/api/favorites/${productId}`);
  },

  /**
   * Check if product is in favorites
   */
  checkStatus: async (productId) => {
    return await apiClient.get(`/api/favorites/${productId}/status`);
  },

  /**
   * Get all user's favorites
   */
  getAll: async () => {
    return await apiClient.get('/api/favorites/');
  },

  /**
   * Toggle favorite (add if not favorited, remove if favorited)
   */
  toggle: async (productId, isFavorite) => {
    if (isFavorite) {
      return await favoritesAPI.remove(productId);
    } else {
      return await favoritesAPI.add(productId);
    }
  }
};
