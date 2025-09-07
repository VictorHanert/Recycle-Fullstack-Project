// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// API client utility
export const apiClient = {
  // GET request
  get: async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },

  // POST request
  post: async (endpoint, data, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(data)
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 422 && errorData.details) {
        // Handle validation errors
        const errorMessages = errorData.details.map(detail => detail.message).join('. ');
        throw new Error(errorMessages);
      } else if (errorData.message) {
        throw new Error(errorData.message);
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }
    
    return response.json();
  },

  // PUT request
  put: async (endpoint, data, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(data)
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 422 && errorData.details) {
        // Handle validation errors
        const errorMessages = errorData.details.map(detail => detail.message).join('. ');
        throw new Error(errorMessages);
      } else if (errorData.message) {
        throw new Error(errorData.message);
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }
    
    return response.json();
  },

  // DELETE request
  delete: async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }
};

// Auth API calls
export const authAPI = {
  login: (credentials) => apiClient.post('/api/auth/login', credentials),
  register: (userData) => apiClient.post('/api/auth/register', userData),
  getProfile: (token) => apiClient.get('/api/auth/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
};

// Products API calls
export const productsAPI = {
  getAll: (params = {}) => {
    // Remove undefined/null values
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== "")
    );
    const queryString = new URLSearchParams(filteredParams).toString();
    return apiClient.get(`/api/products${queryString ? `?${queryString}` : ""}`);
  },
  getById: (id) => apiClient.get(`/api/products/${id}`),
  getCategories: () => apiClient.get('/api/products/categories'),
  create: (product) => apiClient.post('/api/products/', product),
  update: (id, product) => apiClient.put(`/api/products/${id}`, product),
  delete: (id) => apiClient.delete(`/api/products/${id}`)
};

// Users API calls (admin only)
export const usersAPI = {
  getAll: () => apiClient.get('/api/admin/users'),
  getById: (id) => apiClient.get(`/api/admin/users/${id}`),
  update: (id, userData) => apiClient.put(`/api/admin/users/${id}`, userData),
  delete: (id) => apiClient.delete(`/api/admin/users/${id}`)
};

// Profile API calls
export const profileAPI = {
  getMyProfile: (token) => apiClient.get('/api/profile/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }),
  updateMyProfile: (data, token) => apiClient.put('/api/profile/me', data, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }),
  deleteMyAccount: (token) => apiClient.delete('/api/profile/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }),
  addMyLocation: (locationData, token) => apiClient.post('/api/profile/me/location', locationData, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }),
  removeMyLocation: (token) => apiClient.delete('/api/profile/me/location', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }),
  getMyProducts: (params, token) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiClient.get(`/api/profile/me/products?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },
  getPublicProfile: (userId) => apiClient.get(`/api/profile/${userId}`),
  getUserProducts: (userId, params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiClient.get(`/api/profile/${userId}/products?${queryParams}`);
  },
  searchLocations: (query) => apiClient.get(`/api/profile/locations/search?q=${encodeURIComponent(query)}`),
  getLocations: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiClient.get(`/api/profile/locations?${queryParams}`);
  },
  createLocation: (locationData, token) => apiClient.post('/api/profile/locations', locationData, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
};
