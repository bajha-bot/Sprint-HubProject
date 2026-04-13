import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import MainLogo from "/nisum-technologies-logo.webp";
import CreateFileImg from "/add-document.webp";
import CreateFolderImg from "/add-folder.webp";
import { useDispatch, useSelector } from "react-redux";
import { createFile, createFolder } from "../../features/createFolderFilesSlice";
import folderImg from "/folder.webp";
import openFolderImg from "/open-folder.webp";
import fileImg from "/file.webp";
import { openFileLink } from "../../features/openFileSlice";
import { changeBreadcrumb } from "../../features/breadcrumbSlice";
import SprintHubLogo from "/SprintHubLogo.png";
import EmployeeStatsCard from "../../components/EmployeeStatsCard";
import ProjectStatsCard from "../../components/ProjectStatsCard";
import ClientProjectTree from "../../components/ClientProjectTree";
import useGetAllEmployees from "../../hooks/useGetAllEmployees";
import MonthlyHealthDashboard from "../../components/MonthlyHealthDashboard";
import ProjectShowDashboard from "../../components/ProjectShowdashboard";
import ProjectPlanSheetNew from "../../components/ProjectPlanSheetNew";
import ProjectTeamSheetNew from "../../components/ProjectTeamSheetNew";
import { useAuth } from "../../context/AuthContext";

function Home() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [openedFolder, setOpenedFolder] = useState([]);
  const [searchOutput, setSearchOutput] = useState([]);
  const [searchFilter, setSearchFilter] = useState({ client: null, project: null });
  const [selectedView, setSelectedView] = useState(null);
  const objValue = useSelector((state) => state.create.value);
  const { data: employeeData } = useGetAllEmployees();
  const { user, loading: authLoading } = useAuth();

  if (authLoading) return <div style={{ padding: '2rem' }}>Loading...</div>;
  if (!user) { navigate('/role-based-login'); return null; }

  // Debug logging
  // useEffect(() => {
  //   console.log('Employee data:', employeeData);
  //   if (employeeData?.records) {
  //     console.log('Records count:', employeeData.records.length);
  //     console.log('Sample record:', employeeData.records[0]);
  //     console.log('Sample record keys:', Object.keys(employeeData.records[0]));
  //     // Check if any record has allocation data
  //     const recordWithAllocation = employeeData.records.find(emp => emp.employeeAllocationDataDTO);
  //     console.log('Record with allocation:', recordWithAllocation);
  //     if (recordWithAllocation?.employeeAllocationDataDTO) {
  //       console.log('Allocation data keys:', Object.keys(recordWithAllocation.employeeAllocationDataDTO));
  //       console.log('Full allocation data:', recordWithAllocation.employeeAllocationDataDTO);
  //     }
  //     console.log('Opened clients:', openedClients);
  //   }
  // }, [employeeData, openedClients]);

  const searchRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOutput([]); 
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

function searchByName(searchText) {
  if (!searchText.trim()) {
    setSearchOutput([]);
    setSearchFilter({ client: null, project: null });
    return;
  }

  const safe = escapeRegex(searchText);
  const regex = new RegExp(safe, "i");
  let results = [];

  // Search Redux static folder/file structure
  function recurse(node) {
    if (Array.isArray(node)) {
      node.forEach((item) => recurse(item));
    } else if (typeof node === "object" && node !== null) {
      if (node.name && regex.test(node.name)) {
        results.push({ name: node.name, type: node.type, url: node.url || null });
      }
      Object.values(node).forEach((value) => recurse(value));
    }
  }
  recurse(objValue);

  // Search client and project names from employee API
  if (employeeData?.records) {
    const clients = [...new Set(employeeData.records.map(emp =>
      emp.employeeAllocationDataDTO?.parentAccount?.accountName
    ).filter(Boolean))];
    clients.forEach(clientName => {
      if (regex.test(clientName)) results.push({ name: clientName, type: 'client' });
    });

    const projects = [...new Set(employeeData.records.map(emp =>
      emp.employeeAllocationDataDTO?.project?.projectName
    ).filter(Boolean))];
    projects.forEach(projectName => {
      if (regex.test(projectName)) results.push({ name: projectName, type: 'project' });
    });
  }

  // Deduplicate by name
  const seen = new Set();
  results = results.filter(r => { if (seen.has(r.name)) return false; seen.add(r.name); return true; });
  setSearchOutput(results);
}


  const getProjectStats = (clientName, projectName) => {
    if (!employeeData?.records) return {};
    return employeeData.records
      .filter(emp => emp.employeeAllocationDataDTO?.project?.projectName === projectName && emp.employeeAllocationDataDTO?.parentAccount?.accountName === clientName)
      .reduce((acc, emp) => {
        const status = emp.employeeAllocationDataDTO?.allocationStatus || '';
        acc.totalEmployees = (acc.totalEmployees || 0) + 1;
        if (status === 'BILLABLE') acc.billable = (acc.billable || 0) + 1;
        if (status === 'CONFIRMED') acc.confirmed = (acc.confirmed || 0) + 1;
        if (status === 'RESERVED') acc.reserved = (acc.reserved || 0) + 1;
        return acc;
      }, {});
  };

  function toggleFolder(id) {
    if (openedFolder.includes(id)) {
      const tempArr = [...openedFolder];
      const tempId = tempArr.indexOf(id);
      tempArr.splice(tempId, 1);
      setOpenedFolder(tempArr);
    } else {
      setOpenedFolder((prev) => [...prev, id]);
    }
  }
  const fileClicked = (link, name) => {
    navigate("/browse");

    //change content section with the file link

    dispatch(openFileLink(link));

    // change breadcrumb accordingly
    dispatch(changeBreadcrumb(name));

    // change folder structure to save opened file when visited browse page from home
  };

  function viewFolder(x = objValue) {
    return x.map((val) => {
      return (
        <div
          key={val.name}
          onClick={(e) => {
            e.stopPropagation();
            val.type === "folder"
              ? toggleFolder(val.id)
              : fileClicked(val.url, val.name);
          }}
        >
          <div style={{ display: "flex", cursor: "pointer" }}>
            {val.type === "folder" ? (
              <img src={folderImg} height={20} />
            ) : (
              <img src={fileImg} height={20} />
            )}
            <h5 style={{ marginLeft: "10px" }}>{val.name}</h5>
          </div>

          {openedFolder.includes(val.id) && val.children.length > 0 && (
            <div style={{ marginLeft: "1rem" }}>
              <h6>{viewFolder(val.children)}</h6>
            </div>
          )}
        </div>
      );
    });
  }

  return (
    <div className="home">
             <img src={MainLogo} alt="Nisum Logo" width={160} height={55} 
             style={{position:'absolute',right:'1.5rem',top:'1.5rem',backgroundColor:'white',boxShadow:'-2px 2px 6px grey',padding: '15px',borderRadius:'5px'}}/>

      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          margin: "1.5rem 0rem 2rem 0rem",
        }}
      >
        <img src={SprintHubLogo} alt="SprintHub Logo" width={300} />
       
      </div>
      <div ref={searchRef}>
        <input
        type="text"
        className="searchBar"
        placeholder="  🔍︎  Search File/Folder here"
        onChange={(e) => searchByName(e.target.value)}
      />

      {searchOutput.length > 0 && (
        <div className="searchItems">
          {searchOutput.map((val, i) => (
            <div
              key={i}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}
              onClick={() => {
                if (val.type === 'file' && val.url) {
                  fileClicked(val.url, val.name);
                } else if (val.type === 'project') {
                  setSearchFilter({ client: null, project: val.name });
                } else if (val.type === 'client') {
                  setSearchFilter({ client: val.name, project: null });
                }
                setSearchOutput([]);
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span>{val.type === 'folder' || val.type === 'client' ? '📁' : val.type === 'project' ? '📂' : '📄'}</span>
              <span style={{ fontSize: '13px', color: '#1e3a5f' }}>{val.name}</span>
              <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: 'auto', textTransform: 'capitalize' }}>{val.type}</span>
            </div>
          ))}
        </div>
      )}
      </div>

      {/* <div className="createSection">
        <div
          className="createSomething"
          onClick={() => dispatch(createFolder(0))}
        >
          <img src={CreateFolderImg} alt="Create New Folder" />
          <h6>Create New Project</h6>
        </div>
        <div
          className="createSomething"
          onClick={() => dispatch(createFile(0))}
        >
          <img src={CreateFileImg} alt="Create New File" />
          <h6>Create New File</h6>
        </div>
      </div> */}
      {/* <EmployeeStatsCard /> */}
      
      <div className="existingProjects">
        <h4
          style={{
            marginBottom: "1rem",
            fontWeight: "bold",
            textDecoration: "underline",
            color: "rgb(36 66 198)",
            cursor: "pointer",
          }}
        >
          All Projects And Files
        </h4>
        
        {/* Client Names as Folders */}
        {(searchFilter.client || searchFilter.project) && (
          <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#2a89ac', fontWeight: '600' }}>
              🔍 Showing results for: <strong>{searchFilter.client || searchFilter.project}</strong>
            </span>
            <button
              onClick={() => setSearchFilter({ client: null, project: null })}
              style={{ fontSize: '11px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer' }}
            >✕ Clear</button>
          </div>
        )}
        <ClientProjectTree
          user={user}
          filterClient={searchFilter.client}
          filterProject={searchFilter.project}
          onProjectPlanClick={(clientName, projectName) => setSelectedView({ type: 'project-plan', projectName, clientName })}
          onProjectTeamClick={(clientName, projectName) => setSelectedView({ type: 'project-team', projectName, clientName })}
          onProjectDashboardClick={(clientName, projectName) => setSelectedView({ type: 'project-dashboard', projectName, clientName })}
          onAccountDashboardClick={(clientName, clientProjects) => setSelectedView({ type: 'account-dashboard', clientName, clientProjects })}
        />

        {/* Render selected view inline */}
        {selectedView && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#f8fafc', zIndex: 1000, overflowY: 'auto' }}>
            <div style={{ padding: '10px 16px', backgroundColor: '#1e3a5f', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#fff', fontWeight: '600', fontSize: '14px' }}>
                {selectedView.type === 'account-dashboard' ? `📊 ${selectedView.clientName} - Account Dashboard` :
                 selectedView.type === 'project-dashboard' ? `📊 ${selectedView.projectName} - Project Dashboard` :
                 selectedView.type === 'project-plan' ? `📋 ${selectedView.projectName} - Project Plan` :
                 `👥 ${selectedView.projectName} - Project Team`}
              </span>
              <button onClick={() => setSelectedView(null)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 12px', cursor: 'pointer', fontSize: '13px' }}>← Back</button>
            </div>
            {selectedView.type === 'account-dashboard' && (
              <MonthlyHealthDashboard clientName={selectedView.clientName} clientProjects={selectedView.clientProjects} employeeData={employeeData} projectStats={{}} />
            )}
            {selectedView.type === 'project-dashboard' && (
              <ProjectShowDashboard projectName={selectedView.projectName} clientName={selectedView.clientName} projectStats={getProjectStats(selectedView.clientName, selectedView.projectName)} />
            )}
            {selectedView.type === 'project-plan' && (
              <ProjectPlanSheetNew projectName={selectedView.projectName} readOnly={true} />
            )}
            {selectedView.type === 'project-team' && (
              <ProjectTeamSheetNew projectName={selectedView.projectName} readOnly={true} />
            )}
          </div>
        )}
        
        {/* {viewFolder()} */}
      </div>
    </div>
  );
}

export default Home;
