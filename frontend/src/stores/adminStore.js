import { create } from 'zustand';
import { adminAPI } from '../api/admin';

/**
 * Admin Store
 * Manages admin statistics and data with caching
 */
export const useAdminStore = create((set, get) => ({
  // State
  stats: null,
  statsLoading: false,
  statsError: null,
  lastFetched: null,
  
  // Cache duration: 2 minutes for stats (they change frequently)
  CACHE_DURATION: 2 * 60 * 1000,

  /**
   * Fetch platform statistics
   * @param {boolean} forceRefresh - Skip cache and fetch fresh data
   */
  fetchStats: async (forceRefresh = false) => {
    const state = get();
    
    // Check if we have cached data and it's still valid
    if (!forceRefresh && state.stats && state.lastFetched) {
      const cacheAge = Date.now() - state.lastFetched;
      if (cacheAge < state.CACHE_DURATION) {
        return state.stats;
      }
    }

    set({ statsLoading: true, statsError: null });

    try {
      const response = await adminAPI.getStats();
      // The apiClient returns the data directly, not wrapped in a response object
      const statsData = response.data || response;
      set({
        stats: statsData,
        statsLoading: false,
        statsError: null,
        lastFetched: Date.now()
      });
      return statsData;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to fetch statistics';
      set({
        statsLoading: false,
        statsError: errorMessage
      });
      throw error;
    }
  },

  /**
   * Get cached stats without fetching
   */
  getCachedStats: () => {
    return get().stats;
  },

  /**
   * Check if cache is valid
   */
  isCacheValid: () => {
    const { stats, lastFetched, CACHE_DURATION } = get();
    if (!stats || !lastFetched) return false;
    return (Date.now() - lastFetched) < CACHE_DURATION;
  },

  /**
   * Clear stats cache (useful after major data changes)
   */
  clearCache: () => {
    set({
      stats: null,
      lastFetched: null,
      statsError: null
    });
  },

  /**
   * Invalidate and refresh stats
   * Useful after creating/deleting users or products
   */
  refreshStats: async () => {
    return get().fetchStats(true);
  }
}));
