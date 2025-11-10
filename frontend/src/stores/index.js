// Export all stores
export { useAuthStore } from './authStore';
export { useProductsStore } from './productsStore';
export { useFavoritesStore } from './favoritesStore';
export { useMessagesStore } from './messagesStore';

// Cleanup function to clear all stores on logout
export const clearAllStores = () => {
  // This will be called on logout to clear all cached data
  const { useFavoritesStore } = require('./favoritesStore');
  const { useMessagesStore } = require('./messagesStore');
  const { useProductsStore } = require('./productsStore');
  
  useFavoritesStore.getState().clearFavorites();
  useMessagesStore.getState().clearMessages();
  useProductsStore.getState().clearCache();
};
