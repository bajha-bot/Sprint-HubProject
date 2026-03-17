import React, { useMemo } from "react";
import useGetAllEmployees from "../hooks/useGetAllEmployees";
import { getAllProjectNames, PROJECT_SHEET_MAPPING } from "../utils/googleSheetHelper";

function GoogleSheetSetupGuide() {
  const { data, loading } = useGetAllEmployees();

  const allProjects = useMemo(() => {
    return getAllProjectNames(data);
  }, [data]);

  const unmappedProjects = useMemo(() => {
    return allProjects.filter(project => !(project in PROJECT_SHEET_MAPPING));
  }, [allProjects]);

  if (loading) return <div style={{ padding: "2rem" }}>Loading projects...</div>;

  return (
    <div style={{ padding: "2rem", maxWidth: "800px" }}>
      <h2>Google Sheet Setup Guide</h2>
      
      <div style={{ background: "#f0f8ff", padding: "1rem", borderRadius: "8px", marginBottom: "2rem" }}>
        <h3>Steps to Configure:</h3>
        <ol>
          <li>Open the Google Sheet: <a href="https://docs.google.com/spreadsheets/d/1tUO5g6odx8j1_wCYe6_qFrTc67p2PXPNVHlQ8iwhj3o/edit" target="_blank" rel="noopener noreferrer">Click here</a></li>
          <li>Create a new tab for each project (click "+" at bottom left)</li>
          <li>Name each tab with the exact project name</li>
          <li>Click on each tab and copy the <code>gid</code> from the URL</li>
          <li>Update <code>src/utils/googleSheetHelper.js</code> with the gid values</li>
        </ol>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <h3>All Projects ({allProjects.length})</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#2a89ac", color: "white" }}>
              <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Project Name</th>
              <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Status</th>
              <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Current GID</th>
            </tr>
          </thead>
          <tbody>
            {allProjects.map((project, idx) => {
              const isMapped = project in PROJECT_SHEET_MAPPING;
              return (
                <tr key={idx} style={{ background: idx % 2 === 0 ? "#f9f9f9" : "white" }}>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>{project}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    {isMapped ? (
                      <span style={{ color: "green", fontWeight: "bold" }}>✓ Configured</span>
                    ) : (
                      <span style={{ color: "red", fontWeight: "bold" }}>✗ Not Configured</span>
                    )}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    {isMapped ? PROJECT_SHEET_MAPPING[project] : "N/A"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {unmappedProjects.length > 0 && (
        <div style={{ background: "#fff3cd", padding: "1rem", borderRadius: "8px" }}>
          <h3>⚠️ Unmapped Projects ({unmappedProjects.length})</h3>
          <p>Add these projects to <code>PROJECT_SHEET_MAPPING</code> in <code>src/utils/googleSheetHelper.js</code>:</p>
          <pre style={{ background: "#f5f5f5", padding: "1rem", borderRadius: "4px", overflow: "auto" }}>
{`export const PROJECT_SHEET_MAPPING = {
${allProjects.map((project, idx) => `  "${project}": ${PROJECT_SHEET_MAPPING[project] ?? idx},`).join('\n')}
};`}
          </pre>
        </div>
      )}
    </div>
  );
}

export default GoogleSheetSetupGuide;
