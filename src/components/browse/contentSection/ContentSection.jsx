import React, { useEffect, useState } from "react";
import "./ContentSection.css";
import { useSelector } from "react-redux";
import ProjectStatsCard from "../../ProjectStatsCard";

export default function ContentSection({selectedFileUrl}) {
  const breacrumbTitle = useSelector((state) => state.breacrumbTitle.value);
  const [isLoading, setIsLoading] = useState(false);
  const [isDashboard, setIsDashboard] = useState(false);
  const [projectData, setProjectData] = useState(null);

  useEffect(() => {
    if (selectedFileUrl) {
      if (selectedFileUrl.startsWith('/project-dashboard/')) {
        const parts = selectedFileUrl.split('/');
        const clientName = decodeURIComponent(parts[2]);
        const projectName = decodeURIComponent(parts[3]);
        setProjectData({ clientName, projectName });
        setIsDashboard(true);
        setIsLoading(false);
      } else {
        setIsDashboard(false);
        setProjectData(null);
        setIsLoading(true);
      }
    }
  }, [selectedFileUrl]);

  return (
    <div className="mainContentSection">
      <div className="breadCrumb">
        <h6>
          {" "}
          <i
            className="bi bi-file-earmark-check"
            style={{ marginRight: "5px" }}
          ></i>
          {breacrumbTitle}
        </h6>
      </div>
      <div className="contentSection">
        {isLoading && (
          <div
            className="loading-overlay"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255,255,255,0.8)",
              zIndex: 10,
            }}
          >
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}

        {isDashboard && projectData ? (
          <ProjectStatsCard 
            projectName={projectData.projectName}
            clientName={projectData.clientName}
          />
        ) : selectedFileUrl ? (
          <iframe
            className="contentSection"
            src={selectedFileUrl}
            title="Google Sheet Viewer"
            onLoad={() => setIsLoading(false)}
          ></iframe>
        ) : (
          <p style={{ textAlign: "center",marginTop:'25%' }}>No files selected.</p>
        )}
      </div>
    </div>
  );
}

// export default ContentSection;
