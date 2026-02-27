import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleClient, toggleProject } from '../features/clientProjectTreeSlice';
import { renameFile, deleteFile, createFolder, createFile } from '../features/createFolderFilesSlice';
import useGetAllEmployees from '../hooks/useGetAllEmployees';
import FolderImg from '/folder.webp';
import FolderOpenImg from '/open-folder.webp';
import FileImg from '/file.webp';
import AddFolderImg from '/add-folder.webp';
import AddFileImg from '/add-document.webp';
import DeleteImg from '/deleteImg.webp';
import RenameImg from '/rename.webp';
import AddUser from '/adduser.webp';

const ManageClientProjectTree = () => {
  const dispatch = useDispatch();
  const { data: employeeData } = useGetAllEmployees();
  const { openedClients, openedProjects } = useSelector(state => state.clientProjectTree);

  const handleClientToggle = (clientName) => {
    dispatch(toggleClient(clientName));
  };

  const handleProjectToggle = (projectName) => {
    dispatch(toggleProject(projectName));
  };

  if (!employeeData?.records) return null;

  return (
    <div style={{ marginLeft: "2rem" }}>
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
          <div key={clientName} className="folderContainer">
            <div className="subFolderTabs" style={{ justifyContent: "flex-start" }}>
              <div
                className="isFolder"
                style={{
                  display: "flex",
                  width: "80%",
                  alignItems: "center",
                  cursor: "pointer",
                  border: "1px solid #0583ff",
                  borderRadius: "5px",
                }}
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
                <p>{clientName}</p>

                <div style={{ marginLeft: "auto", display: "flex" }}>
                  <div
                    style={{ display: "flex" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Add user functionality for client
                    }}
                  >
                    <img src={AddUser} width="20" />
                    <p style={{ marginLeft: 5 }}>Add User</p>
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
              <div className="subFolderChildren" style={{ marginLeft: "20px" }}>
                {clientProjects.map(projectName => (
                  <div key={projectName} className="folderContainer">
                    <div className="subFolderTabs" style={{ justifyContent: "flex-start" }}>
                      <div
                        className="isFolder"
                        style={{
                          display: "flex",
                          width: "80%",
                          alignItems: "center",
                          cursor: "pointer",
                          border: "1px solid #0583ff",
                          borderRadius: "5px",
                        }}
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
                        <p>{projectName}</p>

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

                    {/* Render project files */}
                    {openedProjects.includes(projectName) && (
                      <div className="subFolderChildren" style={{ marginLeft: "20px" }}>
                        {['Project Team', 'Project Plan', 'Project Dashboard'].map(fileName => (
                          <div key={fileName} className="folderContainer">
                            <div className="subFolderTabs" style={{ justifyContent: "flex-start" }}>
                              <div
                                className="isFile"
                                style={{
                                  display: "flex",
                                  width: "80%",
                                  alignItems: "center",
                                  cursor: "pointer",
                                  border: "1px solid #0583ff",
                                  borderRadius: "5px",
                                }}
                              >
                                <img src={FileImg} alt="File" width="17" />
                                <p>{fileName}</p>

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
                                    <p>Delete</p>
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