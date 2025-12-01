import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI, profileAPI, apiClient } from '../api';
import { notify } from '../utils/notifications';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: true, // Start as true since we need to check localStorage
      isHydrated: false, // Track if store has been rehydrated from localStorage
      
      // Computed values
      isAuthenticated: () => {
        const state = get();
        return !!(state.user && state.token);
      },
      
      isAdmin: () => {
        const state = get();
        return state.user?.is_admin || false;
      },
      
      // Actions
      setToken: (token) => {
        set({ token });
        if (token) {
          apiClient.setToken(token);
        }
      },
      
      login: async (credentials) => {
        try {
          const response = await authAPI.login(credentials);
          const { access_token, user } = response;
          
          set({ token: access_token, user, loading: false, isHydrated: true });
          apiClient.setToken(access_token);
          
          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },
      
      register: async (userData) => {
        try {
          const response = await authAPI.register(userData);
          const { access_token, user } = response;
          
          set({ token: access_token, user, loading: false, isHydrated: true });
          apiClient.setToken(access_token);
          
          notify.success("Account created successfully! Welcome!");
          return { success: true };
        } catch (error) {
          notify.error(error.message || "Registration failed");
          return { success: false, error: error.message };
        }
      },
      
      logout: () => {
        // Clear auth state
        set({ user: null, token: null });
        apiClient.setToken(null);
        
        // Clear localStorage (only auth-storage persists)
        localStorage.removeItem('auth-storage');
        
        notify.info("You have been logged out");
      },
      
      checkAuth: async () => {
        const { token, isHydrated } = get();
        
        // Wait a bit for hydration to complete if needed
        if (!isHydrated) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        const currentToken = get().token;
        
        if (!currentToken) {
          set({ loading: false, isHydrated: true });
          return;
        }
        
        try {
          set({ loading: true });
          apiClient.setToken(currentToken);
          const userData = await profileAPI.getMyProfile(currentToken);
          set({ user: userData, loading: false, isHydrated: true });
        } catch (error) {
          // Token is invalid
          console.error('Auth check failed:', error);
          set({ user: null, token: null, loading: false, isHydrated: true });
          apiClient.setToken(null);
        }
      },
      
      setHydrated: () => {
        set({ isHydrated: true });
      },
      
      updateUser: (userData) => {
        set({ user: userData });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        token: state.token, 
        user: state.user 
      }),
      onRehydrateStorage: () => (state) => {
        // Called after state is rehydrated from localStorage
        if (state) {
          state.isHydrated = true;
          // If we have a token, set it on the API client immediately
          if (state.token) {
            apiClient.setToken(state.token);
          }
        }
      },
    }
  )
);
