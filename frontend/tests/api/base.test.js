import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient } from '../../src/api/base';

describe('ApiClient', () => {
  // Save original fetch
  const originalFetch = global.fetch;

  beforeEach(() => {
    // Reset token before each test
    apiClient.setToken(null);
    // Mock fetch
    global.fetch = vi.fn();
  });

  afterEach(() => {
    // Restore fetch
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should set token correctly', () => {
      const token = 'test-token';
      apiClient.setToken(token);
      expect(apiClient.token).toBe(token);
    });

    it('should return correct auth headers when token is set', () => {
      const token = 'test-token';
      apiClient.setToken(token);
      const headers = apiClient.getAuthHeaders();
      expect(headers).toEqual({ 'Authorization': `Bearer ${token}` });
    });

    it('should return empty object for auth headers when no token is set', () => {
      const headers = apiClient.getAuthHeaders();
      expect(headers).toEqual({});
    });
  });

  describe('HTTP Methods', () => {
    it('should make a GET request correctly', async () => {
      const mockResponse = { data: 'test' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiClient.get('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should make a POST request correctly', async () => {
      const mockResponse = { success: true };
      const postData = { name: 'test' };
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiClient.post('/test', postData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postData),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should make a PUT request correctly', async () => {
      const mockResponse = { updated: true };
      const updateData = { name: 'updated' };
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiClient.put('/test', updateData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should make a DELETE request correctly', async () => {
      const mockResponse = { deleted: true };
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiClient.delete('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Error Handling', () => {
    it('should handle 422 validation errors', async () => {
      const errorResponse = {
        details: [
          { message: 'Field required' },
          { message: 'Invalid format' }
        ]
      };

      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => errorResponse,
      });

      await expect(apiClient.get('/test')).rejects.toThrow('Field required. Invalid format');
    });

    it('should handle generic API errors', async () => {
      const errorResponse = { message: 'Something went wrong' };

      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => errorResponse,
      });

      await expect(apiClient.get('/test')).rejects.toThrow('Something went wrong');
    });

    it('should handle HTTP errors without message', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({}),
      });

      await expect(apiClient.get('/test')).rejects.toThrow('HTTP error! status: 404');
    });

    it('should handle network errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiClient.get('/test')).rejects.toThrow('Network error');
    });
  });
});
