import React, { useState, useEffect } from "react";
import "./Browse.css";
import ContentSection from "../../components/browser/contentSection/ContentSection1";
import ClientProjectTree from "../../components/ClientProjectTree";
import MonthlyHealthDashboard from "../../components/MonthlyHealthDashboard";
import ProjectShowDashboard from "../../components/ProjectShowdashboard";
import ProjectPlanSheetNew from "../../components/ProjectPlanSheetNew";
import ProjectTeamSheetNew from "../../components/ProjectTeamSheetNew";
import RaidLogSheetNew from "../../components/RaidLogSheetNew";
import { useSelector, useDispatch } from "react-redux";
import { openFileLink } from "../../features/openFileSlice";
import { changeBreadcrumb } from "../../features/breadcrumbSlice";
import { getProjectPlanSheetUrl } from "../../utils/projectPlanSheetService";
import useGetAllEmployees from "../../hooks/useGetAllEmployees";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { canAccessClient, canAccessProject } from "../../utils/roleBasedAccess";

function Browse() {
  const selectedFileUrl = useSelector((state) => state.changeFileLink.link);
  const dispatch = useDispatch();
  const { data: employeeData } = useGetAllEmployees();
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedClientProjects, setSelectedClientProjects] = useState([]);
  const [showContent, setShowContent] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchClient = location.state?.searchClient || null;
  const searchProject = location.state?.searchProject || null;

  // Auto-open project when navigating from search
  useEffect(() => {
    if (searchProject && employeeData?.records) {
      const emp = employeeData.records.find(e => e.employeeAllocationDataDTO?.project?.projectName === searchProject);
      const clientName = emp?.employeeAllocationDataDTO?.parentAccount?.accountName || null;
      handleProjectPlanClick(clientName, searchProject);
    }
  }, [searchProject, employeeData]);

  if (authLoading) return <div style={{ padding: '2rem' }}>Loading...</div>;
  if (!user) { navigate('/role-based-login'); return null; }

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

  const handleFileClick = async (projectName, fileName, manageKey) => {
    const storageKey = `sprintHub_${projectName}_${manageKey}`;
    const legacyUrl = getLegacyUrl(projectName, manageKey);
    const planUrl = manageKey === 'Project Plan13' ? await getProjectPlanSheetUrl(projectName) : null;
    const storedUrl = localStorage.getItem(storageKey) || legacyUrl || planUrl;
    if (storedUrl) {
      dispatch(openFileLink(storedUrl));
      dispatch(changeBreadcrumb(`${projectName} - ${fileName}`));
    } else {
      const newUrl = window.prompt(`Enter the ${fileName} URL for ${projectName}:`);
      if (newUrl && newUrl.trim()) {
        localStorage.setItem(storageKey, newUrl.trim());
        dispatch(openFileLink(newUrl.trim()));
        dispatch(changeBreadcrumb(`${projectName} - ${fileName}`));
      }
    }
  };

  const handleProjectDashboard = (clientName, projectName) => {
    setSelectedProject(projectName);
    setSelectedClient(clientName);
    setShowContent(true);
    dispatch(openFileLink('monthly-dashboard'));
    dispatch(changeBreadcrumb(`${projectName} - Monthly Health Dashboard`));
  };

  const handleProjectPlanClick = (clientName, projectName) => {
    setSelectedProject(projectName);
    setSelectedClient(clientName);
    setShowContent(true);
    dispatch(openFileLink('project-plan'));
    dispatch(changeBreadcrumb(`${projectName} - Project Plan`));
  };

  const handleProjectTeamClick = (clientName, projectName) => {
    setSelectedProject(projectName);
    setSelectedClient(clientName);
    setShowContent(true);
    dispatch(openFileLink('project-team'));
    dispatch(changeBreadcrumb(`${projectName} - Project Team`));
  };

  const handleRaidLogClick = (clientName, projectName) => {
    setSelectedProject(projectName);
    setSelectedClient(clientName);
    setShowContent(true);
    dispatch(openFileLink('raid-log'));
    dispatch(changeBreadcrumb(`${projectName} - RAID Log`));
  };

  const handleAccountDashboard = (clientName, clientProjects) => {
    setSelectedClient(clientName);
    setSelectedProject(null);
    setSelectedClientProjects(clientProjects);
    setShowContent(true);
    dispatch(openFileLink('account-dashboard'));
    dispatch(changeBreadcrumb(`${clientName} - Account Dashboard`));
  };

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

  return (
    <div className="browseScreen">
      <div className={`browser-tree-panel${showContent ? ' browser-tree-hidden' : ''}`}>
        <h5 style={{ marginBottom: "1rem" }}>Browse</h5>
        <ClientProjectTree
          showActions={false}
          user={user}
          onProjectTeamClick={handleProjectTeamClick}
          onProjectPlanClick={handleProjectPlanClick}
          onProjectDashboardClick={handleProjectDashboard}
          onAccountDashboardClick={handleAccountDashboard}
          onRaidLogClick={handleRaidLogClick}
          filterClient={searchClient}
          filterProject={searchProject}
        />
      </div>
      {selectedFileUrl === 'account-dashboard' && selectedClient ? (
        <div className={`browser-content-panel${showContent ? ' browser-content-visible' : ''}`} style={{ flex: 1, minWidth: 0, height: '100%', overflowY: 'auto' }}>
          <button className="browser-back-btn" onClick={() => setShowContent(false)}>← Back</button>
          <MonthlyHealthDashboard
            key={`${selectedClient}`}
            clientName={selectedClient}
            clientProjects={selectedClientProjects}
            employeeData={employeeData}
            projectStats={{}}
          />
        </div>
      ) : selectedFileUrl === 'monthly-dashboard' && selectedProject ? (
        <div className={`browser-content-panel${showContent ? ' browser-content-visible' : ''}`} style={{ flex: 1, minWidth: 0, height: '100%', overflowY: 'auto' }}>
          <button className="browser-back-btn" onClick={() => setShowContent(false)}>← Back</button>
          <ProjectShowDashboard
            projectName={selectedProject}
            clientName={selectedClient}
            projectStats={getProjectStats(selectedClient, selectedProject)}
            onProjectPlan={() => handleProjectPlanClick(selectedClient, selectedProject)}
            onProjectTeam={() => handleProjectTeamClick(selectedClient, selectedProject)}
            onRaidLog={() => handleRaidLogClick(selectedClient, selectedProject)}
            onAccountDashboard={() => handleAccountDashboard(selectedClient, [])}
          />
        </div>
      ) : selectedFileUrl === 'project-plan' && selectedProject ? (
        <div className={`browser-content-panel${showContent ? ' browser-content-visible' : ''}`} style={{ flex: 1, minWidth: 0, height: '100%', overflowY: 'auto' }}>
          <button className="browser-back-btn" onClick={() => setShowContent(false)}>← Back</button>
          <ProjectPlanSheetNew projectName={selectedProject} readOnly={true} />
        </div>
      ) : selectedFileUrl === 'project-team' && selectedProject ? (
        <div className={`browser-content-panel${showContent ? ' browser-content-visible' : ''}`} style={{ flex: 1, minWidth: 0, height: '100%', overflowY: 'auto' }}>
          <button className="browser-back-btn" onClick={() => setShowContent(false)}>← Back</button>
          <ProjectTeamSheetNew projectName={selectedProject} readOnly={true} />
        </div>
      ) : selectedFileUrl === 'raid-log' && selectedProject ? (
        <div className={`browser-content-panel${showContent ? ' browser-content-visible' : ''}`} style={{ flex: 1, minWidth: 0, height: '100%', overflowY: 'auto' }}>
          <button className="browser-back-btn" onClick={() => setShowContent(false)}>← Back</button>
          <RaidLogSheetNew projectName={selectedProject} clientName={selectedClient} readOnly={true} />
        </div>
      ) : (
        <ContentSection selectedFileUrl={selectedFileUrl} />
      )}
    </div>
  );
}

export default Browse;