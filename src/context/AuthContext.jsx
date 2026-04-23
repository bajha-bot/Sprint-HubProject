import { createContext, useContext, useState, useEffect } from 'react';
import { authFetch } from '../api/authFetch';
import { setTempToken } from '../constants/apiToken';
import { API_ENDPOINTS } from '../constants/apiConfig';
import { STORAGE_KEYS } from '../constants/storageKeys';

const AuthContext = createContext(null);

const CACHE_VERSION = 'v2';
const CACHE_TTL = 300000; // 5 minutes

const getCachedEmployees = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    const time = localStorage.getItem(STORAGE_KEYS.EMPLOYEES + '_time');
    const version = localStorage.getItem(STORAGE_KEYS.EMPLOYEES + '_version');
    if (data && time && version === CACHE_VERSION && (Date.now() - parseInt(time)) < CACHE_TTL) {
      return JSON.parse(data);
    }
  } catch {}
  return null;
};

const setCachedEmployees = (normalized) => {
  try {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(normalized));
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES + '_time', Date.now().toString());
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES + '_version', CACHE_VERSION);
  } catch {}
};

const buildUser = (record) => ({
  employeeId: record.employeeId,
  name: record.employeeName,
  email: record.emailId,
  role: record.role,
  designation: record.designation,
  accountId: record.employeeAllocationDataDTO?.parentAccount?.accountId,
  accountName: record.employeeAllocationDataDTO?.parentAccount?.accountName,
  projectId: record.employeeAllocationDataDTO?.project?.projectId,
  projectName: record.employeeAllocationDataDTO?.project?.projectName,
  domainName: record.employeeAllocationDataDTO?.domain?.[0]?.domainName,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [allEmployees, setAllEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const initUser = async () => {
    try {
      const userEmail = localStorage.getItem('userEmail');
      if (!userEmail) { setLoading(false); return; }

      const cached = getCachedEmployees();
      if (cached?.records) {
        setAllEmployees(cached.records);
        const found = cached.records.find(emp => emp.emailId === userEmail);
        if (found) { setUser(buildUser(found)); setLoading(false); return; }
      }

      setTempToken();
      const response = await authFetch(API_ENDPOINTS.GET_ALL_EMPLOYEES);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      const normalized = result.success ? result.data : result;
      setCachedEmployees(normalized);
      setAllEmployees(normalized.records || []);
      const found = normalized.records?.find(emp => emp.emailId === userEmail);
      if (found) setUser(buildUser(found));
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      const cached = getCachedEmployees();
      if (cached?.records) {
        const userEmail = localStorage.getItem('userEmail');
        setAllEmployees(cached.records);
        const found = cached.records.find(emp => emp.emailId === userEmail);
        if (found) setUser(buildUser(found));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { initUser(); }, []);

  const login = async (email) => {
    localStorage.setItem('userEmail', email);
    setLoading(true);
    await initUser();
  };

  const logout = () => {
    localStorage.removeItem('userEmail');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, allEmployees, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
