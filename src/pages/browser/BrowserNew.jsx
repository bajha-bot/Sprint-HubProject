import React, { useState } from "react";
import "../browse/Browse.css";
import ContentSection1 from "../../components/browser/contentSection/ContentSection1";
import ClientProjectTree from "../../components/ClientProjectTree";
import ProjectPlanSheetNew from "../../components/ProjectPlanSheetNew";
import GoogleSheetSetupGuide from "../../components/GoogleSheetSetupGuide";
import { useSelector, useDispatch } from "react-redux";
import { openFileLink } from "../../features/openFileSlice";
import { changeBreadcrumb } from "../../features/breadcrumbSlice";

function BrowserNew() {
  const selectedFileUrl = useSelector((state) => state.changeFileLink.link);
  const [selectedProject, setSelectedProject] = useState(null);
  const dispatch = useDispatch();

  const handleProjectPlanClick = (clientName, projectName) => {
    setSelectedProject(projectName);
    dispatch(openFileLink('project-plan-new'));
    dispatch(changeBreadcrumb(`${projectName} - Project Plan`));
  };

  return (
    <div className="browseScreen">
      <div style={{ background: "#ecfaff", width: "25rem", height: "100vh", paddingTop: "1rem", paddingLeft: "1rem", paddingRight: "1rem", borderRight: "1px solid #2a89ac", borderTop: "1px solid #2a89ac", overflowY: "scroll" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h5>Browser</h5>
          <button 
            onClick={() => {
              dispatch(openFileLink('sheet-setup'));
              dispatch(changeBreadcrumb('Google Sheet Setup'));
            }}
            style={{ padding: "4px 8px", fontSize: "12px", background: "#2a89ac", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
          >
            Setup
          </button>
        </div>
        <ClientProjectTree showActions={false} onProjectTeamClick={() => {}} onProjectPlanClick={handleProjectPlanClick} />
      </div>
      {selectedFileUrl === 'project-plan-new' && selectedProject ? (
        <ProjectPlanSheetNew projectName={selectedProject} />
      ) : selectedFileUrl === 'sheet-setup' ? (
        <GoogleSheetSetupGuide />
      ) : (
        <ContentSection1 selectedFileUrl={selectedFileUrl} />
      )}
    </div> 
  );
}

export default BrowserNew;
