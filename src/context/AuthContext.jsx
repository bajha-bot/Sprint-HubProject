import { createContext, useContext, useState, useEffect } from 'react';
import { authFetch } from '../api/authFetch';
import { setTempToken } from '../constants/apiToken';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [allEmployees, setAllEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userEmail = localStorage.getItem('userEmail');
        if (!userEmail) {
          setLoading(false);
          return;
        }

        setTempToken();
        const response = await authFetch('/myTeam/open-apis/getAllEmployees');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setAllEmployees(data.records || []);
        
        const currentUser = data.records?.find(emp => emp.emailId === userEmail);
        
        if (currentUser) {
          setUser({
            employeeId: currentUser.employeeId,
            name: currentUser.employeeName,
            email: currentUser.emailId,
            role: currentUser.role,
            accountId: currentUser.employeeAllocationDataDTO?.parentAccount?.accountId,
            accountName: currentUser.employeeAllocationDataDTO?.parentAccount?.accountName,
            projectId: currentUser.employeeAllocationDataDTO?.project?.projectId,
            projectName: currentUser.employeeAllocationDataDTO?.project?.projectName,
            domainName: currentUser.employeeAllocationDataDTO?.domain?.[0]?.domainName
          });
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  return (
    <AuthContext.Provider value={{ user, allEmployees, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
