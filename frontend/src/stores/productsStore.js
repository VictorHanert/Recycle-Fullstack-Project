import { create } from 'zustand';
import { productsAPI } from '../api';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useProductsStore = create((set, get) => ({
  products: {}, // Cache: { [id]: { data, timestamp } }
  categories: [],
  locations: [],
  filters: {
    search: "",
    category: "",
    minPrice: "",
    maxPrice: "",
    locationId: "",
    condition: "",
    sortBy: "newest"
  },
  loading: false,
  error: null,
  
  // Fetch single product with caching
  fetchProduct: async (id) => {
    const cached = get().products[id];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data; // Return cached data
    }
    
    try {
      set({ loading: true, error: null });
      const data = await productsAPI.getById(id);
      
      set((state) => ({
        products: {
          ...state.products,
          [id]: { data, timestamp: Date.now() }
        },
        loading: false
      }));
      
      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  // Get product from cache without fetching
  getProductFromCache: (id) => {
    const cached = get().products[id];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  },
  
  // Fetch categories (cached in state)
  fetchCategories: async () => {
    if (get().categories.length > 0) {
      return get().categories;
    }
    
    try {
      const data = await productsAPI.getCategories();
      set({ categories: data });
      return data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  },
  
  // Fetch locations (cached in state)
  fetchLocations: async () => {
    if (get().locations.length > 0) {
      return get().locations;
    }
    
    try {
      const data = await productsAPI.getLocations();
      set({ locations: data });
      return data;
    } catch (error) {
      console.error('Error fetching locations:', error);
      return [];
    }
  },
  
  // Update filters
  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters }
    }));
  },
  
  resetFilters: () => {
    set({
      filters: {
        search: "",
        category: "",
        minPrice: "",
        maxPrice: "",
        locationId: "",
        condition: "",
        sortBy: "newest"
      }
    });
  },
  
  // Invalidate cache for a product (after update/delete)
  invalidateProduct: (id) => {
    set((state) => {
      const { [id]: removed, ...rest } = state.products;
      return { products: rest };
    });
  },
  
  // Update product in cache (after edit)
  updateProductInCache: (id, updatedData) => {
    set((state) => ({
      products: {
        ...state.products,
        [id]: { data: updatedData, timestamp: Date.now() }
      }
    }));
  },
  
  // Clear all cache
  clearCache: () => {
    set({ products: {} });
  },
  
  // Clear old cache entries
  cleanupCache: () => {
    const now = Date.now();
    set((state) => {
      const cleanedProducts = {};
      Object.entries(state.products).forEach(([id, cached]) => {
        if (now - cached.timestamp < CACHE_DURATION) {
          cleanedProducts[id] = cached;
        }
      });
      return { products: cleanedProducts };
    });
  },
}));
