import { useEffect, useState, useCallback, useRef } from "react";
import { authFetch } from "../api/authFetch";
import { STORAGE_KEYS } from "../constants/storageKeys";
import { API_ENDPOINTS } from "../constants/apiConfig";

const API_URL = API_ENDPOINTS.GET_ALL_EMPLOYEES;

const CACHE_VERSION = 'v2';

const useGetAllEmployees = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const hasFetched = useRef(false);

  const fetchEmployees = useCallback(async () => {
    const cachedData = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    const cacheTime = localStorage.getItem(STORAGE_KEYS.EMPLOYEES + '_time');
    const cacheVersion = localStorage.getItem(STORAGE_KEYS.EMPLOYEES + '_version');
    const now = Date.now();

    if (cachedData && cacheTime && cacheVersion === CACHE_VERSION && (now - parseInt(cacheTime)) < 300000) {
      setData(JSON.parse(cachedData));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await authFetch(API_URL);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      const normalized = result.success ? result.data : result;

      localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(normalized));
      localStorage.setItem(STORAGE_KEYS.EMPLOYEES + '_time', now.toString());
      localStorage.setItem(STORAGE_KEYS.EMPLOYEES + '_version', CACHE_VERSION);
      setData(normalized);
    } catch (err) {
      console.error('API Error:', err);
      setError(err.message);
      // Try to use cached data even if expired
      if (cachedData) {
        console.log('Using expired cache due to API error');
        setData(JSON.parse(cachedData));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchEmployees();
    }
  }, []);

  return { data, loading, error, refetch: fetchEmployees };
};

export default useGetAllEmployees;
