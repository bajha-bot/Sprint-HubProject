import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toggleClient, toggleProject } from '../features/clientProjectTreeSlice';
import { openFileLink } from '../features/openFileSlice';
import { changeBreadcrumb } from '../features/breadcrumbSlice';
import { getProjectPlanSheetUrl, storeProjectPlanSheet } from '../utils/projectPlanSheetService';
import { canAccessClient, canAccessProject } from '../utils/roleBasedAccess';
import useGetAllEmployees from '../hooks/useGetAllEmployees';
import folderImg from '/folder.webp';
import fileImg from '/file.webp';

const ClientProjectTree = ({ onProjectTeamClick, onProjectPlanClick, onProjectDashboardClick, onAccountDashboardClick, showActions = true, user, filterClient, filterProject }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { data: employeeData } = useGetAllEmployees();
  const { openedClients, openedProjects } = useSelector(state => state.clientProjectTree);
  const [openedProjectFolders, setOpenedProjectFolders] = useState({});

  const toggleProjectFolder = (clientName) => {
    setOpenedProjectFolders(prev => ({ ...prev, [clientName]: !prev[clientName] }));
  };

  const handleClientToggle = (clientName) => {
    dispatch(toggleClient(clientName));
  };

  const handleProjectToggle = (projectName) => {
    dispatch(toggleProject(projectName));
  };

  const getLegacyUrl = (projectName, manageKey) => {
    const legacyKeyMap = {
      'Project Team12': 'sprintHub_projectTeam_sheets',
      'Project Plan13': 'sprintHub_projectPlan_sheets',
      'Project Dashboard14': 'sprintHub_projectDashboard_sheets',
    };
    const legacyKey = legacyKeyMap[manageKey];
    if (!legacyKey) return null;
    try {
      const data = JSON.parse(localStorage.getItem(legacyKey));
      return data?.[projectName]?.sheetUrl || null;
    } catch { return null; }
  };

  const handleFileClick = (clientName, projectName, fileName, manageKey) => {
    const storageKey = `sprintHub_${projectName}_${manageKey}`;
    const storedUrl = localStorage.getItem(storageKey)
      || getLegacyUrl(projectName, manageKey)
      || (manageKey === 'Project Plan13' ? getProjectPlanSheetUrl(projectName) : null);
    if (storedUrl) {
      dispatch(openFileLink(storedUrl));
      dispatch(changeBreadcrumb(`${projectName} - ${fileName}`));
    } else {
      const newUrl = prompt(`Enter the ${fileName} URL for ${projectName}:`);
      if (newUrl) {
        localStorage.setItem(storageKey, newUrl);
        if (manageKey === 'Project Plan13') storeProjectPlanSheet(projectName, newUrl, null);
        dispatch(openFileLink(newUrl));
        dispatch(changeBreadcrumb(`${projectName} - ${fileName}`));
      }
    }
  };

  if (!employeeData?.records) return null;

  const allClients = [...new Set(employeeData.records.map(emp =>
    emp.employeeAllocationDataDTO?.parentAccount?.accountName || emp.employeeLocation || 'Unassigned'
  ))].sort();

  const visibleClients = user
    ? allClients.filter(clientName => canAccessClient(user, clientName))
    : allClients;

  // Apply search filters
  const filteredClients = filterClient
    ? visibleClients.filter(c => c.toLowerCase().includes(filterClient.toLowerCase()))
    : filterProject
    ? visibleClients.filter(clientName => {
        const emps = employeeData.records.filter(emp =>
          (emp.employeeAllocationDataDTO?.parentAccount?.accountName || emp.employeeLocation || 'Unassigned') === clientName
        );
        return emps.some(emp => emp.employeeAllocationDataDTO?.project?.projectName?.toLowerCase().includes(filterProject.toLowerCase()));
      })
    : visibleClients;

  return (
    <div style={{ marginBottom: '1rem' }}>
      {filteredClients.map(clientName => {
        const clientEmployees = employeeData.records.filter(emp =>
          (emp.employeeAllocationDataDTO?.parentAccount?.accountName || emp.employeeLocation || 'Unassigned') === clientName
        );
        const allProjects = [...new Set(clientEmployees
          .map(emp => emp.employeeAllocationDataDTO?.project?.projectName)
          .filter(project => project && project.trim() !== '')
        )];
        const clientProjects = user
          ? allProjects.filter(projectName => canAccessProject(user, clientName, projectName))
          : allProjects;

        // Auto-expand when filter matches
        const isClientOpen = openedClients.includes(clientName) || !!filterClient || !!filterProject;
        const isProjectFolderOpen = openedProjectFolders[clientName] || !!filterClient || !!filterProject;

        // Filter projects if searching by project name
        const visibleProjects = filterProject
          ? clientProjects.filter(p => p.toLowerCase().includes(filterProject.toLowerCase()))
          : clientProjects;

        return (
          <div key={clientName}>
            <div
              style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '0.5rem' }}
              onClick={() => handleClientToggle(clientName)}
            >
              <span style={{ fontSize: '10px', marginRight: '4px', transition: 'transform 0.2s', display: 'inline-block', transform: openedClients.includes(clientName) ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
              <img src={folderImg} height={20} />
              <h5 style={{ marginLeft: '6px', marginBottom: 0 }}>{clientName}</h5>
            </div>

            {isClientOpen && (
              <div style={{ marginLeft: '1rem' }}>
                <div
                  style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '0.5rem' }}
                  onClick={() => toggleProjectFolder(clientName)}
                >
                  <span style={{ fontSize: '10px', marginRight: '4px', display: 'inline-block', transform: isProjectFolderOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                  <img src={folderImg} height={20} />
                  <h6 style={{ marginLeft: '6px', marginBottom: 0, fontSize: '0.9rem', color: '#2a89ac', fontWeight: '600' }}>Portfolio Project Folder</h6>
                </div>

                {isProjectFolderOpen && (
                  <div style={{ marginLeft: '1rem' }}>
                    {/* Account Dashboard file */}
                    <div
                      style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '0.4rem' }}
                      onClick={() => onAccountDashboardClick?.(clientName, clientProjects)}
                    >
                      <img src={fileImg} height={16} />
                      <span style={{ marginLeft: '8px', fontSize: '0.8rem', color: '#1e3a5f', fontWeight: '600' }}>Account Dashboard</span>
                    </div>
                    {visibleProjects.length > 0 ? (
                      visibleProjects.map(projectName => (
                        <div key={projectName}>
                          <div
                            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '0.3rem' }}
                            onClick={() => handleProjectToggle(projectName)}
                          >
                            <span style={{ fontSize: '10px', marginRight: '4px', display: 'inline-block', transform: openedProjects.includes(projectName) ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                            <img src={folderImg} height={20} />
                            <h6 style={{ marginLeft: '6px', marginBottom: 0, fontSize: '0.9rem' }}>{projectName}</h6>
                          </div>
                          {openedProjects.includes(projectName) && (
                            <div style={{ marginLeft: '1.5rem' }}>
                              <div
                                style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '0.2rem' }}
                                onClick={() => onProjectTeamClick?.(clientName, projectName)}
                              >
                                <img src={fileImg} height={16} />
                                <span style={{ marginLeft: '8px', fontSize: '0.8rem' }}>Project Team</span>
                              </div>
                              <div
                                style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '0.2rem' }}
                                onClick={() => onProjectPlanClick?.(clientName, projectName)}
                              >
                                <img src={fileImg} height={16} />
                                <span style={{ marginLeft: '8px', fontSize: '0.8rem' }}>Project Plan</span>
                              </div>
                              <div
                                style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '0.2rem' }}
                                onClick={() => onProjectDashboardClick ? onProjectDashboardClick(clientName, projectName) : handleFileClick(clientName, projectName, 'Project Dashboard', 'Project Dashboard14')}
                              >
                                <img src={fileImg} height={16} />
                                <span style={{ marginLeft: '8px', fontSize: '0.8rem' }}>Project Dashboard</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div style={{ marginLeft: '10px', color: '#666', fontSize: '0.8rem' }}>No project names available</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ClientProjectTree;
