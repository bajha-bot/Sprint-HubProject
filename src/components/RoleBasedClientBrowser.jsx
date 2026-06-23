import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { canAccessClient, canAccessProject, filterEmployeesByRole, isFullAccessRole } from '../utils/roleBasedAccess';
import { CLIENT_SHEETS } from '../constants/roles';
import { useNavigate } from 'react-router-dom';
import './EmployeeStatsCard.css';
import folderImg from '/folder.webp';
import fileImg from '/file.webp';
import ProjectStatsCard from './ProjectStatsCard';

const RoleBasedClientBrowser = () => {
  const { user, allEmployees, loading } = useAuth();
  const [openedClients, setOpenedClients] = useState([]);
  const [openedProjects, setOpenedProjects] = useState([]);
  const [showContent, setShowContent] = useState(false);
  const navigate = useNavigate();
  const [selectedDashboard, setSelectedDashboard] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    navigate('/role-based-login');
  };

  // Admin/CDH must use allEmployees directly — their own record may have no accountName
  const employees = isFullAccessRole(user) ? allEmployees : filterEmployeesByRole(user, allEmployees);

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
    setSelectedDashboard({ clientName, projectName });
    setShowContent(true);
  };

  if (loading) return <div className="stats-card">Loading...</div>;
  if (!user) {
    navigate('/role-based-login');
    return null;
  }

  // Temporary: remove after confirming role value
  console.log('[RoleCheck] user.role:', user.role, '| allEmployees count:', allEmployees.length);

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

  const clients = Array.from(clientsMap.values()).sort((a, b) => a.accountName.localeCompare(b.accountName));

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', flexDirection: 'row', overflowX: 'hidden', boxSizing: 'border-box' }}>
      <div className={`browser-tree-panel${showContent ? ' browser-tree-hidden' : ''}`} style={{ width: '300px', height: '100vh', overflowY: 'auto', boxSizing: 'border-box', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 className="stats-title">Teams Dashboard</h2>
          <button onClick={handleLogout}
            style={{ padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
        <h3 style={{ marginBottom: '15px' }}>Accessible Clients & Projects</h3>
        <div style={{ marginBottom: '1rem' }}>
          {clients.length === 0 ? (
            <div style={{ padding: '15px', color: '#666' }}>No accessible clients found</div>
          ) : (
            clients.map(client => {
              const projects = Array.from(client.projects.values());
              return (
                <div key={client.accountName}>
                  <div style={{ display: 'flex', cursor: 'pointer', marginBottom: '0.5rem', alignItems: 'center' }}
                    onClick={() => handleClientToggle(client.accountName)}>
                    <img src={folderImg} height={20} alt="folder" />
                    <h5 style={{ marginLeft: '10px', marginBottom: 0 }}>{client.accountName}</h5>
                  </div>
                  {openedClients.includes(client.accountName) && (
                    <div style={{ marginLeft: '1rem' }}>
                      {projects.length > 0 ? (
                        projects.map(project => (
                          <div key={project.projectName}>
                            <div style={{ display: 'flex', cursor: 'pointer', marginBottom: '0.3rem', alignItems: 'center' }}
                              onClick={() => handleProjectToggle(project.projectName)}>
                              <img src={folderImg} height={20} alt="folder" />
                              <h6 style={{ marginLeft: '10px', fontSize: '0.9rem', marginBottom: 0 }}>{project.projectName}</h6>
                            </div>
                            {openedProjects.includes(project.projectName) && (
                              <div style={{ marginLeft: '1rem' }}>
                                {['Project Team Data'].map(fileName => (
                                  <div key={fileName}
                                    style={{ display: 'flex', cursor: 'pointer', marginBottom: '0.2rem', alignItems: 'center', padding: '4px 8px', borderRadius: '4px', border: '1px solid #e0e0e0' }}
                                    onClick={() => handleProjectDashboard(client.accountName, project.projectName)}>
                                    <img src={fileImg} height={16} alt="file" />
                                    <span style={{ marginLeft: '8px', fontSize: '0.8rem' }}>{fileName}</span>
                                  </div>
                                ))}
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
      {selectedDashboard && (
        <div className={`browser-content-panel${showContent ? ' browser-content-visible' : ''}`} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', boxSizing: 'border-box', maxWidth: '100%' }}>
          <button className="browser-back-btn" onClick={() => setShowContent(false)}>← Back</button>
          <ProjectStatsCard projectName={selectedDashboard.projectName} clientName={selectedDashboard.clientName} />
        </div>
      )}
    </div>
  );
};

export default RoleBasedClientBrowser;
