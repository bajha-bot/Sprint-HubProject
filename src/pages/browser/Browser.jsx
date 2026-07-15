import React, { useState } from "react";
import "../browse/Browse.css";
import ContentSection1 from "../../components/browser/contentSection/ContentSection1";
import ClientProjectTree from "../../components/ClientProjectTree";
import ProjectPlanSheetNew from "../../components/ProjectPlanSheetNew";
import ProjectTeamSheetNew from "../../components/ProjectTeamSheetNew";
import RaidLogSheetNew from "../../components/RaidLogSheetNew";
import AllProjectsSheet from "../../components/AllProjectsSheet";
import GoogleSheetSetupGuide from "../../components/GoogleSheetSetupGuide";
import MonthlyHealthDashboard from "../../components/MonthlyHealthDashboard";
import { syncConsolidatedSheet } from "../../utils/projectPlanSheetService";
import MainLogo from "/nisum-technologies-logo.webp";
import { useSelector, useDispatch } from "react-redux";
import { openFileLink } from "../../features/openFileSlice";
import { changeBreadcrumb } from "../../features/breadcrumbSlice";
import useGetAllEmployees from "../../hooks/useGetAllEmployees";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import ProjectShowDashboard from "../../components/ProjectShowdashboard";

function Browser() {
  const selectedFileUrl = useSelector((state) => state.changeFileLink.link);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedClientProjects, setSelectedClientProjects] = useState([]);
  const [activeTab, setActiveTab] = useState("browser");
  const [showContent, setShowContent] = useState(false);
  const dispatch = useDispatch();
  const { data: employeeData } = useGetAllEmployees();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [cleaning, setCleaning] = useState(false);
  const deletedProjects = useSelector(
    (state) => state.clientProjectTree.deletedProjects,
  );

  const handleCleanMergedSheet = async () => {
    try {
      setCleaning(true);
      if (!window.gapi?.client?.getToken()) {
        const { initializeGoogleAPI, initializeGIS, authenticate } =
          await import("../../utils/googleSheetsService");
        await Promise.all([initializeGoogleAPI(), initializeGIS()]);
        await authenticate();
      }
      await syncConsolidatedSheet(deletedProjects);
      alert("✅ Merged sheet cleaned successfully!");
    } catch (err) {
      alert("❌ Failed: " + err.message);
    } finally {
      setCleaning(false);
    }
  };

  if (!user) {
    navigate("/role-based-login");
    return null;
  }

  const handleProjectTeamClick = (clientName, projectName) => {
    setSelectedProject(projectName);
    setSelectedClient(null);
    setActiveTab("browser");
    setShowContent(true);
    dispatch(openFileLink("project-team"));
    dispatch(changeBreadcrumb(`${projectName} - Project Team`));
  };

  const handleProjectPlanClick = (clientName, projectName) => {
    setSelectedProject(projectName);
    setSelectedClient(clientName);
    setActiveTab("browser");
    setShowContent(true);
    dispatch(openFileLink("project-plan"));
    dispatch(changeBreadcrumb(`${projectName} - Project Plan`));
  };

  const handleProjectDashboard = (clientName, projectName) => {
    setSelectedProject(projectName);
    setSelectedClient(clientName);
    setActiveTab("browser");
    setShowContent(true);
    dispatch(openFileLink("monthly-dashboard"));
    dispatch(changeBreadcrumb(`${projectName} - Monthly Health Dashboard`));
  };

  const handleRaidLogClick = (clientName, projectName) => {
    setSelectedProject(projectName);
    setSelectedClient(clientName);
    setActiveTab("browser");
    setShowContent(true);
    dispatch(openFileLink("raid-log"));
    dispatch(changeBreadcrumb(`${projectName} - RAID Log`));
  };

  const handleAccountDashboard = (clientName, clientProjects) => {
    setSelectedClient(clientName);
    setSelectedProject(null);
    setSelectedClientProjects(clientProjects);
    setActiveTab("browser");
    setShowContent(true);
    dispatch(openFileLink("account-dashboard"));
    dispatch(changeBreadcrumb(`${clientName} - Account Dashboard`));
  };

  const getProjectStats = (clientName, projectName) => {
    if (!employeeData?.records) return {};
    return employeeData.records
      .filter(
        (emp) =>
          emp.employeeAllocationDataDTO?.project?.projectName === projectName &&
          emp.employeeAllocationDataDTO?.parentAccount?.accountName ===
            clientName,
      )
      .reduce((acc, emp) => {
        const status = emp.employeeAllocationDataDTO?.allocationStatus || "";
        acc.totalEmployees = (acc.totalEmployees || 0) + 1;
        if (status === "BILLABLE") acc.billable = (acc.billable || 0) + 1;
        if (status === "CONFIRMED") acc.confirmed = (acc.confirmed || 0) + 1;
        if (status === "RESERVED") acc.reserved = (acc.reserved || 0) + 1;
        return acc;
      }, {});
  };

  return (
    <div className="browseScreen">
        {/* <img
          src={MainLogo}
          alt="Nisum Logo"
          width={160}
          height={55}
          className="nisum-logo"
          style={{
            position: "absolute",
            right: "1.5rem",
            top: "1.5rem",
            backgroundColor: "white",
            boxShadow: "-2px 2px 6px grey",
            padding: "15px",
            borderRadius: "5px",
          }}
        /> */}
      <div
      
        className={`browser-tree-panel${showContent ? " browser-tree-hidden" : ""}`}
      >
      
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          <h5>Account dashboard</h5>
          <div style={{ display: "flex", gap: "5px" }}>
            <button
              onClick={() => setActiveTab("all-projects")}
              style={{
                padding: "4px 8px",
                fontSize: "12px",
                background:
                  activeTab === "all-projects" ? "#1a6d8c" : "#2a89ac",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              All Projects
            </button>
            <button
              onClick={handleCleanMergedSheet}
              disabled={cleaning}
              style={{
                padding: "4px 8px",
                fontSize: "12px",
                background: cleaning ? "#999" : "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: cleaning ? "not-allowed" : "pointer",
              }}
            >
              {cleaning ? "Cleaning..." : "🧹 Clean Merged"}
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
        <ClientProjectTree
          showActions={true}
          user={user}
          onProjectTeamClick={handleProjectTeamClick}
          onProjectPlanClick={handleProjectPlanClick}
          onProjectDashboardClick={handleProjectDashboard}
          onAccountDashboardClick={handleAccountDashboard}
          onRaidLogClick={handleRaidLogClick}
        />
        <div style={{ marginTop: "1rem" }}>
          {/* Project Dashboard links will be handled by ClientProjectTree */}
        </div>
      </div>
      {activeTab === "all-projects" ? (
        <AllProjectsSheet />
      ) : selectedFileUrl === "account-dashboard" && selectedClient ? (
        <div
          className={`browser-content-panel${showContent ? " browser-content-visible" : ""}`}
          style={{ flex: 1, minWidth: 0, height: "100%", overflowY: "auto" }}
        >
          <button
            className="browser-back-btn"
            onClick={() => setShowContent(false)}
          >
            ← Back
          </button>
          <MonthlyHealthDashboard
            key={`${selectedClient}_${selectedProject || ""}`}
            projectName={selectedProject || undefined}
            clientName={selectedClient}
            clientProjects={selectedClientProjects}
            employeeData={employeeData}
            projectStats={{}}
          />
        </div>
      ) : selectedFileUrl === "monthly-dashboard" && selectedProject ? (
        <div
          className={`browser-content-panel${showContent ? " browser-content-visible" : ""}`}
          style={{ flex: 1, minWidth: 0, height: "100%", overflowY: "auto" }}
        >
          <button
            className="browser-back-btn"
            onClick={() => setShowContent(false)}
          >
            ← Back
          </button>
          <ProjectShowDashboard
            projectName={selectedProject}
            clientName={selectedClient}
            projectStats={getProjectStats(selectedClient, selectedProject)}
            onProjectPlan={() => {
              dispatch(openFileLink("project-plan"));
              dispatch(changeBreadcrumb(`${selectedProject} - Project Plan`));
            }}
            onProjectTeam={() => {
              dispatch(openFileLink("project-team"));
              dispatch(changeBreadcrumb(`${selectedProject} - Project Team`));
            }}
            onRaidLog={() =>
              handleRaidLogClick(selectedClient, selectedProject)
            }
            onAccountDashboard={() =>
              handleAccountDashboard(selectedClient, [])
            }
          />
        </div>
      ) : selectedFileUrl === "project-team" && selectedProject ? (
        <div
          className={`browser-content-panel${showContent ? " browser-content-visible" : ""}`}
          style={{ flex: 1, minWidth: 0, height: "100%", overflowY: "auto" }}
        >
          <button
            className="browser-back-btn"
            onClick={() => setShowContent(false)}
          >
            ← Back
          </button>
          <ProjectTeamSheetNew projectName={selectedProject} />
        </div>
      ) : selectedFileUrl === "project-plan" && selectedProject ? (
        <div
          className={`browser-content-panel${showContent ? " browser-content-visible" : ""}`}
          style={{ flex: 1, minWidth: 0, height: "100%", overflowY: "auto" }}
        >
          <button
            className="browser-back-btn"
            onClick={() => setShowContent(false)}
          >
            ← Back
          </button>
          <ProjectPlanSheetNew
            projectName={selectedProject}
            clientName={selectedClient}
          />
        </div>
      ) : selectedFileUrl === "raid-log" && selectedProject ? (
        <div
          className={`browser-content-panel${showContent ? " browser-content-visible" : ""}`}
          style={{ flex: 1, minWidth: 0, height: "100%", overflowY: "auto" }}
        >
          <button
            className="browser-back-btn"
            onClick={() => setShowContent(false)}
          >
            ← Back
          </button>
          <RaidLogSheetNew
            projectName={selectedProject}
            clientName={selectedClient}
          />
        </div>
      ) : selectedFileUrl === "sheet-setup" ? (
        <GoogleSheetSetupGuide />
      ) : (
        <ContentSection1 selectedFileUrl={selectedFileUrl} />
      )}
    </div>
  );
}

export default Browser;
