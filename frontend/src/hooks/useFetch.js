import { useState, useEffect } from "react";

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function useFetch(endpoint, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Construct full URL
        const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
        
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          },
          ...options
        });

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

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (endpoint) {
      fetchData();
    }
  }, [endpoint, JSON.stringify(options)]);

  const refetch = async () => {
    if (endpoint) {
      const fetchData = async () => {
        try {
          setLoading(true);
          setError(null);
          
          const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
          
          const response = await fetch(url, {
            headers: {
              'Content-Type': 'application/json',
              ...options.headers
            },
            ...options
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            
            if (response.status === 422 && errorData.details) {
              const errorMessages = errorData.details.map(detail => detail.message).join('. ');
              throw new Error(errorMessages);
            } else if (errorData.message) {
              throw new Error(errorData.message);
            } else {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
          }

          const result = await response.json();
          setData(result);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      
      await fetchData();
    }
  };

  return { data, loading, error, refetch };
}
