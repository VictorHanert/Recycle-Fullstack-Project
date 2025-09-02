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
      throw new Error(`HTTP error! status: ${response.status}`);
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
  getAll: () => apiClient.get('/products'),
  getById: (id) => apiClient.get(`/products/${id}`),
  create: (product) => apiClient.post('/products', product),
  update: (id, product) => apiClient.put(`/products/${id}`, product),
  delete: (id) => apiClient.delete(`/products/${id}`)
};

// Users API calls (admin only)
export const usersAPI = {
  getAll: () => apiClient.get('/admin/users'),
  getById: (id) => apiClient.get(`/admin/users/${id}`),
  update: (id, userData) => apiClient.put(`/admin/users/${id}`, userData),
  delete: (id) => apiClient.delete(`/admin/users/${id}`)
};
