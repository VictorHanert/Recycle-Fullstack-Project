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
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(data),
      ...options
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
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(data),
      ...options
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
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
  getAll: () => apiClient.get('/api/products/'),
  getById: (id) => apiClient.get(`/api/products/${id}`),
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
