// Simple auth utilities
export const authUtils = {
  // Store token in localStorage (in real app, consider httpOnly cookies)
  setToken: (token) => {
    localStorage.setItem('authToken', token);
  },
  
  getToken: () => {
    return localStorage.getItem('authToken');
  },
  
  removeToken: () => {
    localStorage.removeItem('authToken');
  },
  
  // Check if user is authenticated
  isAuthenticated: () => {
    const token = authUtils.getToken();
    return !!token;
  },
  
  // Mock JWT decode (in real app, use jwt-decode library)
  decodeToken: (token) => {
    try {
      // This is just a mock - don't do this in production
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch (error) {
      return null;
    }
  },
  
  // Check if token is expired
  isTokenExpired: (token) => {
    const decoded = authUtils.decodeToken(token);
    if (!decoded) return true;
    
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  }
};

// Route protection helper
export const requireAuth = (user, redirectTo = '/login') => {
  if (!user) {
    window.location.href = redirectTo;
    return false;
  }
  return true;
};

// Admin route protection
export const requireAdmin = (user, redirectTo = '/') => {
  if (!user || user.role !== 'admin') {
    window.location.href = redirectTo;
    return false;
  }
  return true;
};
