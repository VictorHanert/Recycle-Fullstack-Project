import { apiClient } from './base';

/**
 * Activity and History API
 * Handles view history and recent activity endpoints
 */
const activityAPI = {
  /**
   * Get current user's view history
   * @param {number} limit - Number of items to fetch (default: 20)
   * @returns {Promise} View history data
   */
  getViewHistory: async (limit = 20) => {
    return apiClient.get(`/api/activity/history/views?limit=${limit}`);
  },

  /**
   * Get popular products
   * @param {number} limit - Number of products to fetch (default: 10)
   * @returns {Promise} Popular products data
   */
  getPopularProducts: async (limit = 10) => {
    return apiClient.get(`/api/activity/popular-products?limit=${limit}`);
  },

  /**
   * Get recent activity feed (admin only)
   * @param {number} limit - Number of items per category (default: 5)
   * @returns {Promise} Recent activity data
   */
  getRecentActivityFeed: async (limit = 5) => {
    return apiClient.get(`/api/activity/admin/recent-activity?limit=${limit}`);
  },

  /**
   * Get product recommendations
   * @param {number} productId - Product ID
   * @param {number} limit - Number of recommendations (default: 5)
   * @returns {Promise} Product recommendations
   */
  getProductRecommendations: async (productId, limit = 5) => {
    return apiClient.get(`/api/activity/products/${productId}/recommendations?limit=${limit}`);
  }
};

export { activityAPI };
