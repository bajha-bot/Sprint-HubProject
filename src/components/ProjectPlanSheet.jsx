import React, { useMemo } from "react";
import useGetAllEmployees from "../hooks/useGetAllEmployees";
import { getProjectSheetUrl } from "../utils/googleSheetHelper";

function ProjectPlanSheet({ projectName }) {
  const { data } = useGetAllEmployees();

  // Get employee names for this project to display count
  const filteredEmployees = useMemo(() => {
    if (!data?.records) return [];
    return data.records.filter(emp => 
      emp.projectName === projectName || 
      emp.project === projectName ||
      emp.Project === projectName
    );
  }, [data, projectName]);

  const sheetUrl = getProjectSheetUrl(projectName);

  return (
    <div style={{ width: "100%", height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ margin: 0, padding: "1rem", background: "#f5f5f5", borderBottom: "1px solid #ddd", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>{projectName} - Project Plan</h3>
        <span style={{ fontSize: "14px", color: "#666" }}>{filteredEmployees.length} employees</span>
      </div>
      <iframe 
        src={sheetUrl}
        style={{ width: "100%", height: "100%", border: "none", flex: 1 }}
        title="Project Plan"
      />
    </div>
  );
}

export default ProjectPlanSheet;
