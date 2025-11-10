// Base API client with authentication handling
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  getAuthHeaders() {
    return this.token ? { 'Authorization': `Bearer ${this.token}` } : {};
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Don't set Content-Type for FormData - let browser set it automatically
    const isFormData = options.body instanceof FormData;
    const config = {
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...this.getAuthHeaders(),
        ...options.headers
      },
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

    // Handle 204 No Content responses (no body to parse)
    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  // HTTP methods
  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, data, options = {}) {
    const isFormData = data instanceof FormData;
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: isFormData ? data : JSON.stringify(data)
    });
  }

  put(endpoint, data, options = {}) {
    const isFormData = data instanceof FormData;
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: isFormData ? data : JSON.stringify(data)
    });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

// Create singleton instance
export const apiClient = new ApiClient();
