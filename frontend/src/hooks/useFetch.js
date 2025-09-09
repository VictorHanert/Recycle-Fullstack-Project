import { useState, useEffect } from "react";
import { apiClient } from "../api/base";

export function useFetch(endpoint, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!endpoint) return;

      try {
        setLoading(true);
        setError(null);

        const result = await apiClient.request(endpoint, options);
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [endpoint, JSON.stringify(options)]);

  const refetch = async () => {
    if (!endpoint) return;

    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.request(endpoint, options);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch };
}
