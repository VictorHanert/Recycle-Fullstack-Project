import { useState, useEffect } from "react";
import { apiClient } from "../api/base";
import { notify } from "../utils/notifications";

export function useFetch(endpoint, options = {}) {
  const { showErrorNotification = false, ...requestOptions } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!endpoint) return;

      try {
        setLoading(true);
        setError(null);

        const result = await apiClient.request(endpoint, requestOptions);
        setData(result);
      } catch (err) {
        const errorMessage = err.message;
        setError(errorMessage);
        if (showErrorNotification) {
          notify.error(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [endpoint, JSON.stringify(requestOptions), showErrorNotification]);

  const refetch = async () => {
    if (!endpoint) return;

    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.request(endpoint, requestOptions);
      setData(result);
    } catch (err) {
      const errorMessage = err.message;
      setError(errorMessage);
      if (showErrorNotification) {
        notify.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch };
}
