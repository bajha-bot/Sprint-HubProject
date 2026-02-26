import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { canAccessClient, canAccessProject, filterEmployeesByRole } from '../utils/roleBasedAccess';
import { CLIENT_SHEETS } from '../constants/roles';
import { authFetch } from '../api/authFetch';
import { setTempToken } from '../constants/apiToken';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { openFileLink } from '../features/openFileSlice';
import { changeBreadcrumb } from '../features/breadcrumbSlice';
import './EmployeeStatsCard.css';
import folderImg from '/folder.webp';
import fileImg from '/file.webp';

const RoleBasedClientBrowser = () => {
  const { user, loading } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [openedClients, setOpenedClients] = useState([]);
  const [openedProjects, setOpenedProjects] = useState([]);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    navigate('/role-based-login');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setTempToken();
        const response = await authFetch('/myTeam/open-apis/getAllEmployees');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        const filteredEmployees = filterEmployeesByRole(user, data.records || []);
        setEmployees(filteredEmployees);
      } catch (error) {
        console.error('Failed to fetch employees:', error);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const handleClientToggle = (clientName) => {
    const sheetUrl = CLIENT_SHEETS[clientName];
    if (sheetUrl && !sheetUrl.includes('example')) {
      window.open(sheetUrl, '_blank');
    }
    
    if (openedClients.includes(clientName)) {
      setOpenedClients(openedClients.filter(c => c !== clientName));
    } else {
      setOpenedClients([...openedClients, clientName]);
    }
  };

  const handleProjectToggle = (projectName) => {
    if (openedProjects.includes(projectName)) {
      setOpenedProjects(openedProjects.filter(p => p !== projectName));
    } else {
      setOpenedProjects([...openedProjects, projectName]);
    }
  };

  const handleProjectDashboard = (clientName, projectName) => {
    navigate("/browse");
    dispatch(openFileLink(`/project-dashboard/${clientName}/${projectName}`));
    dispatch(changeBreadcrumb(`${projectName} - Dashboard`));
  };

  if (loading) return <div className="stats-card">Loading...</div>;
  if (!user) {
    navigate('/role-based-login');
    return null;
  }

  const clientsMap = new Map();
  employees.forEach(emp => {
    const account = emp.employeeAllocationDataDTO?.parentAccount;
    if (account?.accountName && canAccessClient(user, account.accountName)) {
      if (!clientsMap.has(account.accountName)) {
        clientsMap.set(account.accountName, {
          accountId: account.accountId,
          accountName: account.accountName,
          projects: new Map()
        });
      }
      const project = emp.employeeAllocationDataDTO?.project;
      if (project?.projectName && canAccessProject(user, account.accountName, project.projectName)) {
        clientsMap.get(account.accountName).projects.set(project.projectName, project);
      }
    }
  });

  console.log('User:', user);
  console.log('Filtered Employees:', employees.length);
  console.log('Clients Map:', Array.from(clientsMap.entries()));

  const clients = Array.from(clientsMap.values()).sort((a, b) => a.accountName.localeCompare(b.accountName));

  return (
    <div className="stats-card" style={{ padding: '20px', minHeight: '80vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 className="stats-title">My Teams Dashboard</h2>
        <button
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>
      {/* <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <p><strong>Role:</strong> {user.role}</p>
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
      </div> */}
      
      <h3 style={{ marginBottom: '15px' }}>Accessible Clients & Projects</h3>
      
      <div style={{ marginBottom: '1rem' }}>
        {clients.length === 0 ? (
          <div style={{ padding: '15px', color: '#666' }}>No accessible clients found</div>
        ) : (
          clients.map(client => {
            const projects = Array.from(client.projects.values());
            return (
              <div key={client.accountName}>
                <div 
                  style={{ display: 'flex', cursor: 'pointer', marginBottom: '0.5rem', alignItems: 'center' }}
                  onClick={() => handleClientToggle(client.accountName)}
                >
                  <img src={folderImg} height={20} alt="folder" />
                  <h5 style={{ marginLeft: '10px', marginBottom: 0 }}>{client.accountName}</h5>
                </div>
                
                {openedClients.includes(client.accountName) && (
                  <div style={{ marginLeft: '1rem' }}>
                    {projects.length > 0 ? (
                      projects.map(project => (
                        <div key={project.projectName}>
                          <div 
                            style={{ display: 'flex', cursor: 'pointer', marginBottom: '0.3rem', alignItems: 'center' }}
                            onClick={() => handleProjectToggle(project.projectName)}
                          >
                            <img src={folderImg} height={20} alt="folder" />
                            <h6 style={{ marginLeft: '10px', fontSize: '0.9rem', marginBottom: 0 }}>{project.projectName}</h6>
                          </div>
                          {openedProjects.includes(project.projectName) && (
                            <div style={{ marginLeft: '1rem' }}>
                              <div 
                                style={{ display: 'flex', cursor: 'pointer', marginBottom: '0.2rem', alignItems: 'center' }}
                                onClick={() => handleProjectDashboard(client.accountName, project.projectName)}
                              >
                                <img src={fileImg} height={16} alt="file" />
                                <span style={{ marginLeft: '8px', fontSize: '0.8rem' }}>Project Dashboard</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div style={{ marginLeft: '10px', color: '#666', fontSize: '0.8rem' }}>No projects available</div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RoleBasedClientBrowser;
