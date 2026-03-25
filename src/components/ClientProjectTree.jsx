import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toggleClient, toggleProject } from '../features/clientProjectTreeSlice';
import { openFileLink } from '../features/openFileSlice';
import { changeBreadcrumb } from '../features/breadcrumbSlice';
import { getProjectPlanSheetUrl, storeProjectPlanSheet } from '../utils/projectPlanSheetService';
import useGetAllEmployees from '../hooks/useGetAllEmployees';
import folderImg from '/folder.webp';
import fileImg from '/file.webp';

const ClientProjectTree = ({ onProjectTeamClick, onProjectPlanClick, onProjectDashboardClick, showActions = true }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { data: employeeData } = useGetAllEmployees();
  const { openedClients, openedProjects } = useSelector(state => state.clientProjectTree);

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

  return (
    <div style={{ marginBottom: "1rem" }}>
      {[...new Set(employeeData.records.map(emp => 
        emp.employeeAllocationDataDTO?.parentAccount?.accountName || emp.employeeLocation || 'Unassigned'
      ))].sort().map(clientName => {
        // Get all employees for this client
        const clientEmployees = employeeData.records.filter(emp => 
          (emp.employeeAllocationDataDTO?.parentAccount?.accountName || emp.employeeLocation || 'Unassigned') === clientName
        );
        
        // Extract project names from allocation data
        const clientProjects = [...new Set(clientEmployees
          .map(emp => emp.employeeAllocationDataDTO?.project?.projectName)
          .filter(project => project && project.trim() !== '')
        )];
        
        return (
          <div key={clientName}>
            <div 
              style={{ display: "flex", cursor: "pointer", marginBottom: "0.5rem" }}
              onClick={() => handleClientToggle(clientName)}
            >
              <img src={folderImg} height={20} />
              <h5 style={{ marginLeft: "10px" }}>{clientName}</h5>
            </div>
            
            {openedClients.includes(clientName) && (
              <div style={{ marginLeft: "1rem" }}>
                {clientProjects.length > 0 ? (
                  clientProjects.map(projectName => (
                    <div key={projectName}>
                      <div 
                        style={{ display: "flex", cursor: "pointer", marginBottom: "0.3rem" }}
                        onClick={() => handleProjectToggle(projectName)}
                      >
                        <img src={folderImg} height={20} />
                        <h6 style={{ marginLeft: "10px", fontSize: "0.9rem" }}>{projectName}</h6>
                      </div>
                      {openedProjects.includes(projectName) && (
                        <div style={{ marginLeft: "1rem" }}>
                          <div 
                            style={{ display: "flex", cursor: "pointer", marginBottom: "0.2rem" }}
                            onClick={() => onProjectTeamClick?.(clientName, projectName)}
                          >
                            <img src={fileImg} height={16} />
                            <span style={{ marginLeft: "8px", fontSize: "0.8rem" }}>Project Team1</span>
                          </div>
                          <div 
                            style={{ display: "flex", cursor: "pointer", marginBottom: "0.2rem" }}
                            onClick={() => onProjectPlanClick?.(clientName, projectName)}
                          >
                            <img src={fileImg} height={16} />
                            <span style={{ marginLeft: "8px", fontSize: "0.8rem" }}>Project Plan1</span>
                          </div>
                          <div 
                            style={{ display: "flex", cursor: "pointer", marginBottom: "0.2rem" }}
                            onClick={() => onProjectDashboardClick ? onProjectDashboardClick(clientName, projectName) : handleFileClick(clientName, projectName, 'Project Dashboard', 'Project Dashboard14')}
                          >
                            <img src={fileImg} height={16} />
                            <span style={{ marginLeft: "8px", fontSize: "0.8rem" }}>Project Dashboard1</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div style={{ marginLeft: "10px", color: "#666", fontSize: "0.8rem" }}>No project names available</div>
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