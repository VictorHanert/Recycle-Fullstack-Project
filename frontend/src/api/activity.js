import { apiClient } from './base';

const activityAPI = {
  getViewHistory: async (limit = 20) => {
    return apiClient.get(`/api/activity/history/views?limit=${limit}`);
  },

  getPopularProducts: async (limit = 10) => {
    return apiClient.get(`/api/activity/popular-products?limit=${limit}`);
  },

  getRecentActivityFeed: async (limit = 5) => {
    return apiClient.get(`/api/activity/admin/recent-activity?limit=${limit}`);
  },

  getProductRecommendations: async (productId, limit = 5) => {
    return apiClient.get(`/api/activity/recommendations/${productId}?limit=${limit}`);
  },

  recordView: async (productId) => {
    return apiClient.post(`/api/activity/views/${productId}`);
  }
};

export { activityAPI };
