export const getNextProjectPosition = () => {
  const POSITION_KEY = 'sprintHub_next_position';
  const stored = localStorage.getItem(POSITION_KEY);
  const nextPosition = stored ? parseInt(stored) : 1;
  localStorage.setItem(POSITION_KEY, (nextPosition + 1).toString());
  return nextPosition;
};

export const getAllProjectSheetIds = () => {
  const sheets = getStoredProjectPlanSheets();
  return Object.values(sheets).map(s => s.spreadsheetId);
};

export const getNextAvailableRow = async (consolidatedSheetId, gapi) => {
  try {
    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: consolidatedSheetId,
      range: 'A:A'
    });
    const values = response.result.values || [];
    return values.length + 1;
  } catch (error) {
    return 2;
  }
};

export const getOrAssignProjectRowPosition = (projectName) => {
  const POSITION_KEY = 'sprintHub_project_positions';
  const stored = localStorage.getItem(POSITION_KEY);
  const positions = stored ? JSON.parse(stored) : {};
  
  if (!positions[projectName]) {
    const existingPositions = Object.values(positions);
    const maxPosition = existingPositions.length > 0 ? Math.max(...existingPositions) : 0;
    positions[projectName] = maxPosition + 1;
    localStorage.setItem(POSITION_KEY, JSON.stringify(positions));
  }
  
  return positions[projectName];
};

const PROJECT_PLAN_SHEETS_KEY = 'sprintHub_projectPlan_sheets';
const CONSOLIDATED_SHEET_KEY = 'sprintHub_consolidated_sheet';

export const getStoredProjectPlanSheets = () => {
  const stored = localStorage.getItem(PROJECT_PLAN_SHEETS_KEY);
  return stored ? JSON.parse(stored) : {};
};

export const storeProjectPlanSheet = (projectName, sheetUrl, spreadsheetId) => {
  const sheets = getStoredProjectPlanSheets();
  const resolvedId = spreadsheetId || sheetUrl?.split('/d/')[1]?.split('/')[0] || null;
  sheets[projectName] = { sheetUrl, spreadsheetId: resolvedId, createdAt: new Date().toISOString() };
  localStorage.setItem(PROJECT_PLAN_SHEETS_KEY, JSON.stringify(sheets));
};

export const getProjectPlanSheetUrl = (projectName) => {
  const sheets = getStoredProjectPlanSheets();
  return sheets[projectName]?.sheetUrl || null;
};

export const getConsolidatedSheetUrl = () => {
  const stored = localStorage.getItem(CONSOLIDATED_SHEET_KEY);
  return stored ? JSON.parse(stored).sheetUrl : null;
};

export const getConsolidatedSheetId = () => {
  const stored = localStorage.getItem(CONSOLIDATED_SHEET_KEY);
  return stored ? JSON.parse(stored).spreadsheetId : null;
};

export const storeConsolidatedSheet = (sheetUrl, spreadsheetId) => {
  localStorage.setItem(CONSOLIDATED_SHEET_KEY, JSON.stringify({ sheetUrl, spreadsheetId, createdAt: new Date().toISOString() }));
};

export const syncConsolidatedSheet = async () => {
  const consolidatedSheetId = getConsolidatedSheetId();
  if (!consolidatedSheetId) throw new Error('Consolidated sheet not found. Please open "All Projects" first.');

  const gapi = window.gapi;

  // Only initialize if gapi.client.sheets is not already loaded
  if (!gapi?.client?.sheets) {
    const { initializeGoogleAPI, initializeGIS } = await import('./googleSheetsService');
    await Promise.all([initializeGoogleAPI(), initializeGIS()]);
  }

  if (!gapi?.client?.sheets) throw new Error('Google Sheets API not loaded. Please refresh the page.');

  // Only authenticate if there is no token — do NOT re-init which would wipe the token
  if (!gapi.client.getToken()) {
    const { authenticate } = await import('./googleSheetsService');
    await authenticate();
  }

  const allSheets = getStoredProjectPlanSheets();
  const errors = [];
  const allRows = [];

  for (const [projectName, sheetData] of Object.entries(allSheets)) {
    const spreadsheetId = sheetData.spreadsheetId || sheetData.sheetUrl?.split('/d/')[1]?.split('/')[0];
    if (!spreadsheetId || spreadsheetId === 'null') {
      errors.push(`${projectName}: invalid spreadsheetId`);
      continue;
    }
    try {
      const res = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'A2:W'
      });
      const rows = (res.result.values || []).filter(row => row.some(cell => cell?.toString().trim()));
      allRows.push(...rows);
    } catch (e) {
      const status = e?.result?.error?.code || e?.status;
      if (status === 403) {
        // Sheet missing public permission — fix it then retry
        try {
          await gapi.client.request({
            path: `https://www.googleapis.com/drive/v3/files/${spreadsheetId}/permissions`,
            method: 'POST',
            body: { role: 'writer', type: 'anyone' }
          });
          const retry = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'A2:W'
          });
          const rows = (retry.result.values || []).filter(row => row.some(cell => cell?.toString().trim()));
          allRows.push(...rows);
        } catch (retryErr) {
          errors.push(`${projectName}: ${retryErr?.result?.error?.message || String(retryErr)}`);
        }
      } else {
        errors.push(`${projectName}: ${e?.result?.error?.message || String(e)}`);
      }
    }
  }

  if (errors.length > 0 && allRows.length === 0) {
    throw new Error('Could not read any project sheets:\n' + errors.join('\n'));
  }

  if (allRows.length === 0) {
    throw new Error('No data found in project sheets. Please add data to the project plan first.');
  }

  await gapi.client.sheets.spreadsheets.values.clear({
    spreadsheetId: consolidatedSheetId,
    range: 'A2:W'
  });

  await gapi.client.sheets.spreadsheets.values.update({
    spreadsheetId: consolidatedSheetId,
    range: 'A2',
    valueInputOption: 'RAW',
    resource: { values: allRows }
  });
};

export const createProjectPlanSheet = async (projectName, gapi) => {
  try {
    const consolidatedSheetId = getConsolidatedSheetId();
    if (!consolidatedSheetId) {
      throw new Error('Please create the consolidated sheet first by clicking "All Projects" button');
    }

    const existingUrl = getProjectPlanSheetUrl(projectName);
    if (existingUrl) {
      console.log('Existing URL for', projectName, ':', existingUrl);
      return { sheetUrl: existingUrl, isNew: false };
    }

    const createResponse = await gapi.client.sheets.spreadsheets.create({
      properties: { title: `${projectName}_Project_Plan` }
    });

    const spreadsheetId = createResponse.result.spreadsheetId;

    const headers = [
      'Project Name', 'Sprint', 'Tasks Completed (Last Sprint task - Story Points)',
      'Story Points', 'Health', 'Emp status', 'Sprint Status', '%Complete','%Code Coverage',
      'Duration', 'Start Date', 'End Date', 'Leaves Taken', 'Employee Name','Project Manager','Project Owner','Project Sponsor','Achievemnets','Growth','Assigned to',
      'Tasks Assigned (Current Sprint)', 'Risks','Any Comments'
    ];

    await gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: 'A1',
      valueInputOption: 'RAW',
      resource: { values: [headers] }
    });

    await gapi.client.sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetId,
      resource: {
        requests: [{
          repeatCell: {
            range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1 },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0, green: 0, blue: 0 },
                textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                horizontalAlignment: 'CENTER'
              }
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
          }
        }, {
          autoResizeDimensions: {
            dimensions: { sheetId: 0, dimension: 'COLUMNS', startIndex: 0, endIndex: headers.length }
          }
        }]
      }
    });

    try {
      await gapi.client.request({
        path: `https://www.googleapis.com/drive/v3/files/${spreadsheetId}/permissions`,
        method: 'POST',
        body: { role: 'writer', type: 'anyone' }
      });
    } catch (permError) {
      console.warn('Could not set public edit permissions:', permError);
    }

    const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
    storeProjectPlanSheet(projectName, sheetUrl, spreadsheetId);
    await syncConsolidatedSheet();

    return { sheetUrl, spreadsheetId, isNew: true };
  } catch (error) {
    console.error('Error creating project plan sheet:', error);
    throw error;
  }
};

export const createConsolidatedProjectSheet = async (projects, gapi) => {
  try {
    const existingUrl = getConsolidatedSheetUrl();
    if (existingUrl) {
      return { sheetUrl: existingUrl, isNew: false };
    }

    const createResponse = await gapi.client.sheets.spreadsheets.create({
      properties: { title: 'All_Project-Plan_Consolidated Merge Sheet' }
    });

    const spreadsheetId = createResponse.result.spreadsheetId;

   const headers = [
      'Project Name', 'Sprint', 'Tasks Completed (Last Sprint task - Story Points)',
      'Story Points', 'Health', 'Emp status', 'Sprint Status', '%Complete','%Code Coverage',
      'Duration', 'Start Date', 'End Date', 'Leaves Taken', 'Employee Name','Project Manager','Project Owner','Project Sponsor','Achievemnets','Growth','Assigned to',
      'Tasks Assigned (Current Sprint)', 'Risks','Any Comments'
    ];

    const sheetData = [headers];

    await gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: 'A1',
      valueInputOption: 'RAW',
      resource: { values: sheetData }
    });

    await gapi.client.sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetId,
      resource: {
        requests: [{
          repeatCell: {
            range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1 },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0, green: 0, blue: 0 },
                textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                horizontalAlignment: 'CENTER'
              }
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
          }
        }, {
          autoResizeDimensions: {
            dimensions: { sheetId: 0, dimension: 'COLUMNS', startIndex: 0, endIndex: headers.length }
          }
        }]
      }
    });

    try {
      await gapi.client.request({
        path: `https://www.googleapis.com/drive/v3/files/${spreadsheetId}/permissions`,
        method: 'POST',
        body: { role: 'writer', type: 'anyone' }
      });
    } catch (permError) {
      console.warn('Could not set public edit permissions:', permError);
    }

    const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
    storeConsolidatedSheet(sheetUrl, spreadsheetId);

    return { sheetUrl, spreadsheetId, isNew: true };
  } catch (error) {
    console.error('Error creating consolidated sheet:', error);
    throw error;
  }
};
