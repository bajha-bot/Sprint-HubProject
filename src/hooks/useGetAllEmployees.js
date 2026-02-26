import { useEffect, useState, useCallback, useRef } from "react";
import { authFetch } from "../api/authFetch";
import { setTempToken } from "../constants/apiToken";
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
    setLoading(true);
    setError(null);

    try {
      // Set token before making request
      setTempToken();
      
      const response = await authFetch(API_URL);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('API Response:', result);

      localStorage.setItem(
        STORAGE_KEYS.EMPLOYEES,
        JSON.stringify(result)
      );
      setData(result);
    } catch (err) {
      console.error('API Error:', err);
      setError(err.message);
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
