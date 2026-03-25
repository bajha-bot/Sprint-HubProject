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

  const DASHBOARD_URLS = {
    'Tokenizacion': 'https://app.powerbi.com/groups/me/reports/7c43af94-4751-4aa7-be8c-31ddcf2f102f/ed063bcd01028b032c80?ctid=06408ebc-5eb8-4b0d-827f-76dd3b58bc84&experience=power-bi&clientSideAuth=0',
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

  const handleFileClick = (projectName, fileName, manageKey) => {
    const storageKey = `sprintHub_${projectName}_${manageKey}`;
    const storedUrl = localStorage.getItem(storageKey)
      || getLegacyUrl(projectName, manageKey)
      || (manageKey === 'Project Dashboard14' ? DASHBOARD_URLS[projectName] : null)
      || (manageKey === 'Project Plan13' ? getProjectPlanSheetUrl(projectName) : null);

    if (storedUrl) {
      if (manageKey === 'Project Dashboard14') {
        window.open(storedUrl, '_blank');
        dispatch(changeBreadcrumb(`${projectName} - ${fileName}`));
      } else {
        dispatch(openFileLink(storedUrl));
        dispatch(changeBreadcrumb(`${projectName} - ${fileName}`));
      }
    } else {
      const newUrl = window.prompt(`Enter the ${fileName} URL for ${projectName}:`);
      if (newUrl && newUrl.trim()) {
        localStorage.setItem(storageKey, newUrl.trim());
        dispatch(openFileLink(newUrl.trim()));
        dispatch(changeBreadcrumb(`${projectName} - ${fileName}`));
      }
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


