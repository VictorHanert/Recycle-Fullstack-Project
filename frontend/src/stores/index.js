// Export all stores
export { useAuthStore } from './authStore';
export { useProductsStore } from './productsStore';
export { useFavoritesStore } from './favoritesStore';
export { useMessagesStore } from './messagesStore';
export { useAdminStore } from './adminStore';

// Cleanup function to clear all stores on logout
export const clearAllStores = () => {
  // This will be called on logout to clear all cached data
  const { useFavoritesStore } = require('./favoritesStore');
  const { useMessagesStore } = require('./messagesStore');
  const { useProductsStore } = require('./productsStore');
  const { useAdminStore } = require('./adminStore');
  
  useFavoritesStore.getState().clearFavorites();
  useMessagesStore.getState().clearMessages();
  useProductsStore.getState().clearCache();
  useAdminStore.getState().clearCache();
};
