// Google Sheet configuration
const SHEET_ID = '1tUO5g6odx8j1_wCYe6_qFrTc67p2PXPNVHlQ8iwhj3o';

// Project to Sheet Tab (gid) mapping
// You need to manually create tabs in Google Sheets and update the gids here
export const PROJECT_SHEET_MAPPING = {
  "UMA FF": 1313310631,
  "Digital Payments": 917146666,
  "BCI Bench": 268173958,
  "Tailored Shared Services LLCBench": 243103851,
  "Albertsons Media": 3,
  // Add more projects as needed
};

// Generate Google Sheet URL for a specific project
export const getProjectSheetUrl = (projectName) => {
  const gid = PROJECT_SHEET_MAPPING[projectName] || 0;
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit?gid=${gid}#gid=${gid}`;
};

// Get all unique project names from API data
export const getAllProjectNames = (apiData) => {
  if (!apiData?.records) return [];
  
  const projectNames = new Set();
  apiData.records.forEach(emp => {
    const project = emp.projectName || emp.project || emp.Project;
    if (project) projectNames.add(project);
  });
  
  return Array.from(projectNames).sort();
};
