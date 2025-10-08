import { createContext, useState, useEffect } from "react";
import { authAPI, profileAPI, apiClient } from "../api";
import { notify } from "../utils/notifications";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Update API client token when token changes
  useEffect(() => {
    apiClient.setToken(token);
  }, [token]);

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const userData = await profileAPI.getMyProfile(storedToken);
          setUser(userData);
          setToken(storedToken);
        } catch (error) {
          // Token is invalid, remove it
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { access_token, user } = response;
      
      // Store token in localStorage
      localStorage.setItem('token', access_token);
      setToken(access_token);
      
      // Set user data from the user object
      setUser(user);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      await authAPI.register(userData);
      notify.success("Account created successfully! Please log in.");
      return { success: true };
    } catch (error) {
      notify.error(error.message || "Registration failed");
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
    notify.info("You have been logged out");
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading,
    isAdmin: user?.is_admin || false,
    isAuthenticated: !!user && !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
