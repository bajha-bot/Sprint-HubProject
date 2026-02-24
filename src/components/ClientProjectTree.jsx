import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toggleClient, toggleProject } from '../features/clientProjectTreeSlice';
import { openFileLink } from '../features/openFileSlice';
import { changeBreadcrumb } from '../features/breadcrumbSlice';
import useGetAllEmployees from '../hooks/useGetAllEmployees';
import folderImg from '/folder.webp';
import fileImg from '/file.webp';

const ClientProjectTree = ({ onProjectTeamClick, onProjectPlanClick, showActions = true }) => {
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

  const handleProjectDashboard = (clientName, projectName) => {
    navigate("/browse");
    dispatch(openFileLink(`/project-dashboard/${clientName}/${projectName}`));
    dispatch(changeBreadcrumb(`${projectName} - Dashboard`));
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
                            <span style={{ marginLeft: "8px", fontSize: "0.8rem" }}>Project Team</span>
                          </div>
                          <div 
                            style={{ display: "flex", cursor: "pointer", marginBottom: "0.2rem" }}
                            onClick={() => onProjectPlanClick?.(clientName, projectName)}
                          >
                            <img src={fileImg} height={16} />
                            <span style={{ marginLeft: "8px", fontSize: "0.8rem" }}>Project Plan</span>
                          </div>
                          {showActions && (
                            <div 
                              style={{ display: "flex", cursor: "pointer", marginBottom: "0.2rem" }}
                              onClick={() => handleProjectDashboard(clientName, projectName)}
                            >
                              <img src={fileImg} height={16} />
                              <span style={{ marginLeft: "8px", fontSize: "0.8rem" }}>Project Dashboard</span>
                            </div>
                          )}
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