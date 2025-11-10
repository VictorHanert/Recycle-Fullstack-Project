import { create } from 'zustand';
import { favoritesAPI } from '../api';
import { notify } from '../utils/notifications';

export const useFavoritesStore = create((set, get) => ({
  favorites: [],
  favoriteIds: new Set(),
  loading: false,
  error: null,
  
  // Fetch all favorites
  fetchFavorites: async () => {
    try {
      set({ loading: true, error: null });
      const data = await favoritesAPI.getAll();
      set({ 
        favorites: data,
        favoriteIds: new Set(data.map(p => p.id)),
        loading: false 
      });
      return data;
    } catch (error) {
      set({ loading: false, error: error.message });
      notify.error('Failed to load favorites');
      throw error;
    }
  },
  
  // Check if a product is favorite
  isFavorite: (productId) => {
    return get().favoriteIds.has(productId);
  },
  
  // Check favorite status from API
  checkFavoriteStatus: async (productId) => {
    try {
      const response = await favoritesAPI.checkStatus(productId);
      const isFav = response.is_favorite;
      
      // Update local state
      set((state) => {
        const newFavoriteIds = new Set(state.favoriteIds);
        if (isFav) {
          newFavoriteIds.add(productId);
        } else {
          newFavoriteIds.delete(productId);
        }
        return { favoriteIds: newFavoriteIds };
      });
      
      return isFav;
    } catch (error) {
      // If error (e.g., not logged in), assume not favorite
      return false;
    }
  },
  
  // Toggle favorite status
  toggleFavorite: async (productId) => {
    const isFav = get().isFavorite(productId);
    
    try {
      await favoritesAPI.toggle(productId, isFav);
      
      set((state) => {
        const newFavoriteIds = new Set(state.favoriteIds);
        let newFavorites = state.favorites;
        
        if (isFav) {
          // Remove from favorites
          newFavoriteIds.delete(productId);
          newFavorites = state.favorites.filter(p => p.id !== productId);
        } else {
          // Add to favorites
          newFavoriteIds.add(productId);
          // Note: We don't add to favorites array here because we don't have full product data
          // It will be fetched when user visits favorites page
        }
        
        return { 
          favoriteIds: newFavoriteIds,
          favorites: newFavorites
        };
      });
      
      notify.success(isFav ? 'Removed from favorites' : 'Added to favorites');
      return !isFav;
    } catch (error) {
      notify.error('Failed to update favorites');
      throw error;
    }
  },
  
  // Add product to favorites (with full product data)
  addFavorite: (product) => {
    set((state) => {
      const newFavoriteIds = new Set(state.favoriteIds);
      newFavoriteIds.add(product.id);
      
      // Only add if not already in array
      const exists = state.favorites.some(p => p.id === product.id);
      const newFavorites = exists ? state.favorites : [...state.favorites, product];
      
      return {
        favoriteIds: newFavoriteIds,
        favorites: newFavorites
      };
    });
  },
  
  // Remove product from favorites
  removeFavorite: (productId) => {
    set((state) => {
      const newFavoriteIds = new Set(state.favoriteIds);
      newFavoriteIds.delete(productId);
      
      return {
        favoriteIds: newFavoriteIds,
        favorites: state.favorites.filter(p => p.id !== productId)
      };
    });
  },
  
  // Clear all favorites (on logout)
  clearFavorites: () => {
    set({
      favorites: [],
      favoriteIds: new Set(),
      loading: false,
      error: null
    });
  },
}));
