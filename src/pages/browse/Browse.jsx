import React from "react";
import "./Browse.css";
import ContentSection from "../../components/browser/contentSection/ContentSection1";
import ClientProjectTree from "../../components/ClientProjectTree";
import { useSelector, useDispatch } from "react-redux";
import { openFileLink } from "../../features/openFileSlice";
import { changeBreadcrumb } from "../../features/breadcrumbSlice";
import { getProjectPlanSheetUrl } from "../../utils/projectPlanSheetService";

function Browse() {
  const selectedFileUrl = useSelector((state) => state.changeFileLink.link);
  const dispatch = useDispatch();

  const handleFileClick = (projectName, fileName, manageKey) => {
    const storageKey = `sprintHub_${projectName}_${manageKey}`;
    const storedUrl = localStorage.getItem(storageKey)
      || (fileName === 'Project Plan' ? getProjectPlanSheetUrl(projectName) : null);

    if (storedUrl) {
      dispatch(openFileLink(storedUrl));
      dispatch(changeBreadcrumb(`${projectName} - ${fileName}`));
    } else {
      alert(`No URL set for ${fileName} of ${projectName}. Please set it in Manage section first.`);
    }
  };

  return (
    <div className="browseScreen">
      <div style={{ background: "#ecfaff", width: "25rem", minWidth: "25rem", height: "100vh", overflowY: "scroll", paddingTop: "1rem", paddingLeft: "1rem", paddingRight: "1rem", borderRight: "1px solid #2a89ac", borderTop: "1px solid #2a89ac" }}>
        <h5 style={{ marginBottom: "1rem" }}>Browse</h5>
        <ClientProjectTree
          showActions={false}
          onProjectTeamClick={(clientName, projectName) => handleFileClick(projectName, 'Project Team', 'Project Team12')}
          onProjectPlanClick={(clientName, projectName) => handleFileClick(projectName, 'Project Plan', 'Project Plan13')}
          onProjectDashboardClick={(clientName, projectName) => handleFileClick(projectName, 'Project Dashboard', 'Project Dashboard14')}
        />
      </div>
      <ContentSection selectedFileUrl={selectedFileUrl}/>
    </div> 
  );
}

export default Browse;


