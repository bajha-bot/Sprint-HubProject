import React, { useState } from "react";
import "../browse/Browse.css";
import ContentSection1 from "../../components/browser/contentSection/ContentSection1";
import ClientProjectTree from "../../components/ClientProjectTree";
import ProjectPlanSheetNew from "../../components/ProjectPlanSheetNew";
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

  const handleProjectPlanClick = (clientName, projectName) => {
    setSelectedProject(projectName);
    setActiveTab('browser');
    dispatch(openFileLink('project-plan'));
    dispatch(changeBreadcrumb(`${projectName} - Project Plan`));
  };

  const handleProjectDashboard = (clientName, projectName) => {
    console.log('handleProjectDashboard called:', clientName, projectName);
    setSelectedProject(projectName);
    setActiveTab('browser');
    dispatch(openFileLink('project-dashboard'));
    dispatch(changeBreadcrumb(`${projectName} - Dashboard`));
    console.log('Dispatched project-dashboard');
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
        <ClientProjectTree showActions={true} onProjectTeamClick={() => {}} onProjectPlanClick={handleProjectPlanClick} onProjectDashboardClick={handleProjectDashboard} />
        <div style={{ marginTop: "1rem" }}>
          {/* Project Dashboard links will be handled by ClientProjectTree */}
        </div>
      </div>
      {activeTab === 'all-projects' ? (
        <AllProjectsSheet />
      ) : (selectedFileUrl === 'project-dashboard' || selectedFileUrl?.includes('/project-dashboard/')) && selectedProject ? (
        <PowerBIDashboard projectName={selectedProject} />
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
