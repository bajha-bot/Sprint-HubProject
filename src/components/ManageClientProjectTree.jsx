import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleClient, toggleProject } from '../features/clientProjectTreeSlice';
import { renameFile, deleteFile, createFolder, createFile } from '../features/createFolderFilesSlice';
import { openFileLink } from '../features/openFileSlice';
import { changeBreadcrumb } from '../features/breadcrumbSlice';
import { getProjectPlanSheetUrl, storeProjectPlanSheet } from '../utils/projectPlanSheetService';
import { updateFileLinkByName } from '../features/createFolderFilesSlice';
import { canAccessClient, canAccessProject } from '../utils/roleBasedAccess';
import useGetAllEmployees from '../hooks/useGetAllEmployees';
import FolderImg from '/folder.webp';
import FolderOpenImg from '/open-folder.webp';
import FileImg from '/file.webp';
import AddFolderImg from '/add-folder.webp';
import AddFileImg from '/add-document.webp';
import DeleteImg from '/deleteImg.webp';
import RenameImg from '/rename.webp';
import AddUser from '/adduser.webp';

const ManageClientProjectTree = ({ user }) => {
  const dispatch = useDispatch();
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

  const handleProjectPlanClick = (projectName, fileName) => {
    const storageKey = `sprintHub_${projectName}_${fileName}`;
    const storedUrl = localStorage.getItem(storageKey)
      || getLegacyUrl(projectName, fileName)
      || (fileName === 'Project Plan13' ? getProjectPlanSheetUrl(projectName) : null);
    const currentUrl = storedUrl || 'Not set';
    const newUrl = prompt(
      `Your current ${fileName} URL is:\n\n${currentUrl}\n\nEnter the New Link below and press OK to Update:`
    );
    if (newUrl) {
      localStorage.setItem(storageKey, newUrl);
      if (fileName === 'Project Plan13') {
        storeProjectPlanSheet(projectName, newUrl, null);
        dispatch(updateFileLinkByName({ projectName, url: newUrl }));
      }
    }
  };

  if (!employeeData?.records) return null;

  const allClients = [...new Set(employeeData.records.map(emp =>
    emp.employeeAllocationDataDTO?.parentAccount?.accountName || emp.employeeLocation || 'Unassigned'
  ))].sort();

  const visibleClients = user
    ? allClients.filter(c => canAccessClient(user, c))
    : allClients;

  return (
    <div style={{ marginLeft: "2rem" }}>
      {visibleClients.map(clientName => {
        const clientEmployees = employeeData.records.filter(emp =>
          (emp.employeeAllocationDataDTO?.parentAccount?.accountName || emp.employeeLocation || 'Unassigned') === clientName
        );
        const allProjects = [...new Set(clientEmployees
          .map(emp => emp.employeeAllocationDataDTO?.project?.projectName)
          .filter(p => p && p.trim() !== '')
        )];
        const clientProjects = user
          ? allProjects.filter(p => canAccessProject(user, clientName, p))
          : allProjects;
        
        return (
          <div key={clientName} style={{ marginBottom: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginBottom: '4px' }}>
              <div
                style={{ display: 'flex', width: '80%', alignItems: 'center', cursor: 'pointer', border: '1px solid #0583ff', borderRadius: '5px', padding: '2px 8px' }}
                onClick={() => handleClientToggle(clientName)}
              >
                <div>
                  <i
                    className={`bi ${
                      openedClients.includes(clientName)
                        ? "bi-chevron-down"
                        : "bi-chevron-right"
                    }`}
                    style={{ fontSize: "12px", marginRight: "5px" }}
                  ></i>
                  <img
                    src={openedClients.includes(clientName) ? FolderOpenImg : FolderImg}
                    alt="Folder"
                    width="17"
                    className="folderIcon"
                  />
                </div>
                <p style={{ margin: 0, paddingLeft: '5px', fontSize: '13px', fontWeight: 'bold' }}>{clientName}</p>

                <div style={{ marginLeft: "auto", display: "flex" }}>
                  <div
                    style={{ display: "flex" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Add user functionality for client
                    }}
                  >
                    <img src={AddUser} width="20" />
                    <p style={{ margin: 0, marginLeft: 5, fontSize: '12px' }}>Add User</p>
                  </div>

                  <div
                    style={{ display: "flex", marginLeft: "1rem" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Rename functionality for client
                    }}
                  >
                    <img src={RenameImg} width="20" />
                    <p style={{ marginLeft: 5 }}>Rename</p>
                  </div>

                  <div
                    style={{ display: "flex", marginLeft: "1rem" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Delete functionality for client
                    }}
                  >
                    <img src={DeleteImg} width="22" />
                    <p>Delete</p>
                  </div>
                </div>
              </div>
              
              <div>
                <img
                  src={AddFolderImg}
                  width="20"
                  style={{ marginLeft: "8px" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch(createFolder(0));
                  }}
                />
    
                <img
                  src={AddFileImg}
                  width="19"
                  style={{ marginLeft: "8px" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch(createFile(0));
                  }}
                />
              </div>
              
            </div>

            {/* Render projects */}
            {openedClients.includes(clientName) && clientProjects.length > 0 && (
              <div style={{ marginLeft: '20px' }}>
                {clientProjects.map(projectName => (
                  <div key={projectName} style={{ marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginBottom: '4px' }}>
                      <div
                        style={{ display: 'flex', width: '80%', alignItems: 'center', cursor: 'pointer', border: '1px solid #0583ff', borderRadius: '5px', padding: '2px 8px' }}
                        onClick={() => handleProjectToggle(projectName)}
                      >
                        <div>
                          <i
                            className={`bi ${
                              openedProjects.includes(projectName)
                                ? "bi-chevron-down"
                                : "bi-chevron-right"
                            }`}
                            style={{ fontSize: "12px", marginRight: "5px" }}
                          ></i>
                          <img
                            src={openedProjects.includes(projectName) ? FolderOpenImg : FolderImg}
                            alt="Folder"
                            width="17"
                            className="folderIcon"
                          />
                        </div>
                        <p style={{ margin: 0, paddingLeft: '5px', fontSize: '13px', fontWeight: 'bold' }}>{projectName}</p>

                        <div style={{ marginLeft: "auto", display: "flex" }}>
                          <div
                            style={{ display: "flex" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              // Add user functionality for project
                            }}
                          >
                            <img src={AddUser} width="20" />
                            <p style={{ marginLeft: 5 }}>Add User</p>
                          </div>

                          <div
                            style={{ display: "flex", marginLeft: "1rem" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              // Rename functionality for project
                            }}
                          >
                            <img src={RenameImg} width="20" />
                            <p style={{ marginLeft: 5 }}>Rename</p>
                          </div>

                          <div
                            style={{ display: "flex", marginLeft: "1rem" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              // Delete functionality for project
                            }}
                          >
                            <img src={DeleteImg} width="22" />
                            <p>Delete</p>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <img
                          src={AddFolderImg}
                          width="20"
                          style={{ marginLeft: "8px" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            dispatch(createFolder(0));
                          }}
                        />
            
                        <img
                          src={AddFileImg}
                          width="19"
                          style={{ marginLeft: "8px" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            dispatch(createFile(0));
                            
                          }}
                        />
                      </div>


                    </div>

                    {openedProjects.includes(projectName) && (
                      <div style={{ marginLeft: '20px' }}>
                        {['Project Team12', 'Project Plan13', 'Project Dashboard14'].map(fileName => (
                          <div key={fileName} style={{ marginBottom: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                              <div
                                style={{ display: 'flex', width: '80%', alignItems: 'center', cursor: 'pointer', border: '1px solid #0583ff', borderRadius: '5px', padding: '2px 8px' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleProjectPlanClick(projectName, fileName);
                                }}
                              >
                                <img src={FileImg} alt="File" width="17" />
                                <p style={{ margin: 0, paddingLeft: '5px', fontSize: '13px' }}>
                                  {fileName === 'Project Team12' ? 'Project Team' : fileName === 'Project Plan13' ? 'Project Plan' : 'Project Dashboard'}
                                </p>

                                <div style={{ marginLeft: "auto", display: "flex" }}>
                                  <div
                                    style={{ display: "flex" }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Add user functionality for file
                                    }}
                                  >
                                    <img src={AddUser} width="20" />
                                    <p style={{ marginLeft: 5 }}>Add User</p>
                                  </div>

                                  <div
                                    style={{ display: "flex", marginLeft: "1rem" }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Rename functionality for file
                                    }}
                                  >
                                    <img src={RenameImg} width="20" />
                                    <p style={{ marginLeft: 5 }}>Rename</p>
                                  </div>

                                  <div
                                    style={{ display: "flex", marginLeft: "1rem" }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Delete functionality for file
                                    }}
                                  >
                                    <img src={DeleteImg} width="22" />
                                    <p>Delete12</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ManageClientProjectTree;