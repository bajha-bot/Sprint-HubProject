import { useEffect, useState, useCallback, useRef } from "react";
import { authFetch } from "../api/authFetch";
import { STORAGE_KEYS } from "../constants/storageKeys";

// Use full API URL for production, relative for development
const API_BASE_URL = import.meta.env.PROD 
  ? 'https://prodbe-myteam.mynisum.com' 
  : '';
const API_URL = `${API_BASE_URL}/myTeam/open-apis/getAllEmployees`;

const useGetAllEmployees = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const hasFetched = useRef(false);

  const fetchEmployees = useCallback(async () => {
    // Check cache first
    const cachedData = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    const cacheTime = localStorage.getItem(STORAGE_KEYS.EMPLOYEES + '_time');
    const now = Date.now();
    
    // Use cache if less than 5 minutes old
    if (cachedData && cacheTime && (now - parseInt(cacheTime)) < 300000) {
      console.log('Using cached employee data');
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
      console.log('API Response:', result);

      localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(result));
      localStorage.setItem(STORAGE_KEYS.EMPLOYEES + '_time', now.toString());
      setData(result);
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
