import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  toggleClient, toggleProject, addProject, addFile,
  renameClient, deleteClient, renameProject, deleteProject,
  renameFile, deleteFile,
} from '../features/clientProjectTreeSlice';
import { storeProjectPlanSheet } from '../utils/projectPlanSheetService';
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

const DEFAULT_FILES = ['Project Team', 'Project Plan', 'Project Dashboard'];
const isAdmin = (user) => user?.role === 'Admin' || user?.designation?.toLowerCase().includes('admin');

const ManageClientProjectTree = ({ user }) => {
  const dispatch = useDispatch();
  const { data: employeeData } = useGetAllEmployees();
  const { openedClients, openedProjects, customProjects, customFiles, deletedProjects, deletedClients } = useSelector(state => state.clientProjectTree);
  const admin = isAdmin(user);

  const handleFileClick = (projectName, fileName) => {
    const storageKey = `sprintHub_${projectName}_${fileName}`;
    const currentUrl = localStorage.getItem(storageKey) || 'Not set';
    const newUrl = prompt(`Current URL for ${fileName}:\n\n${currentUrl}\n\nEnter new URL:`);
    if (newUrl) {
      localStorage.setItem(storageKey, newUrl);
      if (fileName === 'Project Plan') {
        storeProjectPlanSheet(projectName, newUrl, null);
        dispatch(updateFileLinkByName({ projectName, url: newUrl }));
      }
    }
  };

  const ROW_STYLE = { display: 'flex', alignItems: 'center', marginBottom: '4px', width: '95%' };
  const FOLDER_STYLE = { display: 'flex', flex: 1, alignItems: 'center', cursor: 'pointer', border: '1px solid #0583ff', borderRadius: '5px', padding: '2px 8px' };
  const ACTIONS_STYLE = { display: 'flex', alignItems: 'center', marginLeft: '8px', gap: '6px', flexShrink: 0 };

  if (!employeeData?.records) return null;

  const allClients = [...new Set(employeeData.records.map(emp =>
    emp.employeeAllocationDataDTO?.parentAccount?.accountName || emp.employeeLocation || 'Unassigned'
  ))].sort();

  const mergedClients = [...new Set([...allClients, ...Object.keys(customProjects)])]
    .filter(c => !deletedClients.includes(c)).sort();

  const visibleClients = admin ? mergedClients : (user ? mergedClients.filter(c => canAccessClient(user, c)) : mergedClients);

  return (
    <div style={{ marginLeft: '2rem' }}>
      {visibleClients.map(clientName => {
        const clientEmployees = employeeData.records.filter(emp =>
          (emp.employeeAllocationDataDTO?.parentAccount?.accountName || emp.employeeLocation || 'Unassigned') === clientName
        );
        const apiProjects = [...new Set(clientEmployees
          .map(emp => emp.employeeAllocationDataDTO?.project?.projectName)
          .filter(p => p?.trim())
        )];
        const allProjects = [...new Set([...apiProjects, ...(customProjects[clientName] || [])])]
          .filter(p => !deletedProjects.some(d => d.toLowerCase() === p.toLowerCase())).sort();
        const clientProjects = admin ? allProjects : (user ? allProjects.filter(p => canAccessProject(user, clientName, p)) : allProjects);
        const isCustomClient = customProjects[clientName] !== undefined;

        return (
          <div key={clientName} style={{ marginBottom: '4px' }}>

            {/* Client row */}
            <div style={ROW_STYLE}>

              {/* Folder toggle area */}
              <div
                style={FOLDER_STYLE}
                onClick={() => dispatch(toggleClient(clientName))}
              >
                <i className={`bi ${openedClients.includes(clientName) ? 'bi-chevron-down' : 'bi-chevron-right'}`} style={{ fontSize: '12px', marginRight: '5px' }} />
                <img src={openedClients.includes(clientName) ? FolderOpenImg : FolderImg} alt="Folder" width="17" />
                <p style={{ margin: '0 0 0 5px', fontSize: '13px', fontWeight: 'bold' }}>{clientName}</p>
              </div>

              {/* Action buttons OUTSIDE the clickable div */}
              <div style={ACTIONS_STYLE}>
                <img src={AddUser} width="18" style={{ cursor: 'pointer' }} title="Add User" />
                {admin && isCustomClient && (
                  <>
                    <img src={RenameImg} width="18" style={{ cursor: 'pointer' }} title="Rename"
                      onClick={() => {
                        const newName = prompt(`Rename client "${clientName}" to:`, clientName);
                        if (newName?.trim() && newName.trim() !== clientName)
                          dispatch(renameClient({ oldName: clientName, newName: newName.trim() }));
                      }}
                    />
                    <img src={DeleteImg} width="20" style={{ cursor: 'pointer' }} title="Delete"
                      onClick={() => {
                        if (window.confirm(`Delete client "${clientName}"?`))
                          dispatch(deleteClient(clientName));
                      }}
                    />
                  </>
                )}
                {admin && (
                  <img src={AddFolderImg} width="18" title="Add Project" style={{ cursor: 'pointer' }}
                    onClick={() => {
                      const projectName = prompt(`New project name for "${clientName}":`);
                      if (projectName?.trim()) dispatch(addProject({ clientName, projectName: projectName.trim() }));
                    }}
                  />
                )}
              </div>
            </div>

            {/* Projects */}
            {openedClients.includes(clientName) && (
              <div style={{ marginLeft: '20px' }}>
                {clientProjects.length === 0 && (
                  <p style={{ fontSize: '12px', color: '#888', margin: '4px 0' }}>No projects yet. Click 📁 to add one.</p>
                )}
                {clientProjects.map(projectName => {
                  const isCustomProject = Object.values(customProjects).some(arr =>
                    arr.some(p => p.toLowerCase() === projectName.toLowerCase())
                  );
                  const extraFiles = customFiles[projectName] || [];
                  const allFiles = [...DEFAULT_FILES, ...extraFiles];

                  return (
                    <div key={projectName} style={{ marginBottom: '4px' }}>

                      {/* Project row */}
                      <div style={ROW_STYLE}>

                        {/* Folder toggle area */}
                        <div
                          style={FOLDER_STYLE}
                          onClick={() => dispatch(toggleProject(projectName))}
                        >
                          <i className={`bi ${openedProjects.includes(projectName) ? 'bi-chevron-down' : 'bi-chevron-right'}`} style={{ fontSize: '12px', marginRight: '5px' }} />
                          <img src={openedProjects.includes(projectName) ? FolderOpenImg : FolderImg} alt="Folder" width="17" />
                          <p style={{ margin: '0 0 0 5px', fontSize: '13px', fontWeight: 'bold' }}>{projectName}</p>
                        </div>

                        {/* Action buttons OUTSIDE the clickable div */}
                        <div style={ACTIONS_STYLE}>
                          <img src={AddUser} width="18" style={{ cursor: 'pointer' }} title="Add User" />
                          {admin && isCustomProject && (
                            <>
                              <img src={RenameImg} width="18" style={{ cursor: 'pointer' }} title="Rename"
                                onClick={() => {
                                  const newName = prompt(`Rename project "${projectName}" to:`, projectName);
                                  if (newName?.trim() && newName.trim() !== projectName)
                                    dispatch(renameProject({ oldName: projectName, newName: newName.trim() }));
                                }}
                              />
                              <img src={DeleteImg} width="20" style={{ cursor: 'pointer' }} title="Delete"
                                onClick={() => {
                                  if (window.confirm(`Delete project "${projectName}"?`))
                                    dispatch(deleteProject({ projectName }));
                                }}
                              />
                            </>
                          )}
                          {admin && (
                            <img src={AddFileImg} width="18" title="Add File" style={{ cursor: 'pointer' }}
                              onClick={() => {
                                const fileName = prompt(`New file name for "${projectName}":`);
                                if (fileName?.trim()) dispatch(addFile({ projectName, fileName: fileName.trim() }));
                              }}
                            />
                          )}
                        </div>
                      </div>

                      {/* Files */}
                      {openedProjects.includes(projectName) && (
                        <div style={{ marginLeft: '20px' }}>
                          {allFiles.map(fileName => {
                            const isCustomFile = extraFiles.includes(fileName);
                            return (
                              <div key={fileName} style={{ marginBottom: '4px' }}>
                                <div style={ROW_STYLE}>

                                  {/* File click area */}
                                  <div
                                    style={FOLDER_STYLE}
                                    onClick={() => handleFileClick(projectName, fileName)}
                                  >
                                    <img src={FileImg} alt="File" width="17" />
                                    <p style={{ margin: '0 0 0 5px', fontSize: '13px' }}>{fileName}</p>
                                  </div>

                                  {/* File action buttons OUTSIDE */}
                                  <div style={ACTIONS_STYLE}>
                                    <img src={AddUser} width="18" style={{ cursor: 'pointer' }} title="Add User" />
                                    {admin && isCustomFile && (
                                      <>
                                        <img src={RenameImg} width="18" style={{ cursor: 'pointer' }} title="Rename"
                                          onClick={() => {
                                            const newName = prompt(`Rename file "${fileName}" to:`, fileName);
                                            if (newName?.trim() && newName.trim() !== fileName)
                                              dispatch(renameFile({ projectName, oldName: fileName, newName: newName.trim() }));
                                          }}
                                        />
                                        <img src={DeleteImg} width="20" style={{ cursor: 'pointer' }} title="Delete"
                                          onClick={() => {
                                            if (window.confirm(`Delete file "${fileName}"?`))
                                              dispatch(deleteFile({ projectName, fileName }));
                                          }}
                                        />
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ManageClientProjectTree;
