import React, { useState } from "react";
import "../browse/Browse.css";
import ContentSection1 from "../../components/browser/contentSection/ContentSection1";
import ClientProjectTree from "../../components/ClientProjectTree";
import ProjectPlanSheetNew from "../../components/ProjectPlanSheetNew";
import ProjectTeamSheetNew from "../../components/ProjectTeamSheetNew";
import AllProjectsSheet from "../../components/AllProjectsSheet";
import GoogleSheetSetupGuide from "../../components/GoogleSheetSetupGuide";
import { useSelector, useDispatch } from "react-redux";
import { openFileLink } from "../../features/openFileSlice";
import { changeBreadcrumb } from "../../features/breadcrumbSlice";

function Browser() {
  const selectedFileUrl = useSelector((state) => state.changeFileLink.link);
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeTab, setActiveTab] = useState('browser');
  const dispatch = useDispatch();

  const handleProjectTeamClick = (clientName, projectName) => {
    setSelectedProject(projectName);
    setActiveTab('browser');
    dispatch(openFileLink('project-team'));
    dispatch(changeBreadcrumb(`${projectName} - Project Team`));
  };

  const handleProjectPlanClick = (clientName, projectName) => {
    setSelectedProject(projectName);
    setActiveTab('browser');
    dispatch(openFileLink('project-plan'));
    dispatch(changeBreadcrumb(`${projectName} - Project Plan`));
  };

  const handleProjectDashboard = (clientName, projectName) => {
    const DASHBOARD_URLS = {
      'Tokenizacion': 'https://app.powerbi.com/groups/me/reports/7c43af94-4751-4aa7-be8c-31ddcf2f102f/ed063bcd01028b032c80?ctid=06408ebc-5eb8-4b0d-827f-76dd3b58bc84&experience=power-bi&clientSideAuth=0',
    };
    const storageKey = `sprintHub_${projectName}_Project Dashboard14`;
    const storedUrl = localStorage.getItem(storageKey) || DASHBOARD_URLS[projectName];
    if (storedUrl) {
      window.open(storedUrl, '_blank');
    } else {
      const newUrl = window.prompt(`Enter the Project Dashboard URL for ${projectName}:`);
      if (newUrl && newUrl.trim()) {
        localStorage.setItem(storageKey, newUrl.trim());
        window.open(newUrl.trim(), '_blank');
      }
    }
    dispatch(changeBreadcrumb(`${projectName} - Dashboard`));
  };

  return (
    <div className="browseScreen">
      <div style={{ background: "#ecfaff", width: "25rem", height: "100vh", paddingTop: "1rem", paddingLeft: "1rem", paddingRight: "1rem", borderRight: "1px solid #2a89ac", borderTop: "1px solid #2a89ac", overflowY: "scroll" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h5>Browser</h5>
          <div style={{ display: 'flex', gap: '5px' }}>
            <button 
              onClick={() => setActiveTab('all-projects')}
              style={{ padding: "4px 8px", fontSize: "12px", background: activeTab === 'all-projects' ? "#1a6d8c" : "#2a89ac", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
            >
              All Projects
            </button>
            {/* <button 
              onClick={() => {
                dispatch(openFileLink('sheet-setup'));
                dispatch(changeBreadcrumb('Google Sheet Setup'));
              }}
              style={{ padding: "4px 8px", fontSize: "12px", background: "#2a89ac", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
            >
              Setup
            </button> */}
          </div>
        </div>
        <ClientProjectTree showActions={true} onProjectTeamClick={handleProjectTeamClick} onProjectPlanClick={handleProjectPlanClick} onProjectDashboardClick={handleProjectDashboard} />
        <div style={{ marginTop: "1rem" }}>
          {/* Project Dashboard links will be handled by ClientProjectTree */}
        </div>
      </div>
      {activeTab === 'all-projects' ? (
        <AllProjectsSheet />
      ) : (selectedFileUrl === 'project-dashboard' || selectedFileUrl?.includes('/project-dashboard/')) && selectedProject ? (
        <ContentSection1 selectedFileUrl={selectedFileUrl} />
      ) : selectedFileUrl === 'project-team' && selectedProject ? (
        <ProjectTeamSheetNew projectName={selectedProject} />
      ) : selectedFileUrl === 'project-plan' && selectedProject ? (
        <ProjectPlanSheetNew projectName={selectedProject} />
      ) : selectedFileUrl === 'sheet-setup' ? (
        <GoogleSheetSetupGuide />
      ) : (
        <ContentSection1 selectedFileUrl={selectedFileUrl} />
      )}
    </div> 
  );
}

export default Browser;
