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
  sheets[projectName] = { sheetUrl, spreadsheetId, createdAt: new Date().toISOString() };
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
      'Duration', 'Start Date', 'End Date', 'Leaves Taken', 'Assigned to',
      'Tasks Assigned (Current Sprint)', 'Risks','Any Comments'
    ];

    const initialRow = [projectName, '', '', '', '', '', '', '', '', '', '', '', '', '', ''];

    await gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: 'A1',
      valueInputOption: 'RAW',
      resource: { values: [headers, initialRow] }
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

    const allSheetIds = getAllProjectSheetIds();
    const formulas = allSheetIds.map(id => 
      `QUERY(IMPORTRANGE("${id}","Sheet1!A2:Q"),"SELECT * WHERE Col1 IS NOT NULL")`
    );
    
    formulas.push(`QUERY(IMPORTRANGE("${spreadsheetId}","Sheet1!A2:Q"),"SELECT * WHERE Col1 IS NOT NULL")`);
    
    const combinedFormula = `={${formulas.join(';')}}`;
    
    await gapi.client.sheets.spreadsheets.values.clear({
      spreadsheetId: consolidatedSheetId,
      range: 'A2:Q'
    });
    
    await gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: consolidatedSheetId,
      range: 'A2',
      valueInputOption: 'USER_ENTERED',
      resource: { values: [[combinedFormula]] }
    });

    const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
    storeProjectPlanSheet(projectName, sheetUrl, spreadsheetId);

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
      properties: { title: 'All_Projects_Consolidated' }
    });

    const spreadsheetId = createResponse.result.spreadsheetId;

    const headers = [
      'Project Name', 'Sprint', 'Tasks Completed (Last Sprint task - Story Points)',
      'Story Points', 'Health', 'Emp status', 'Sprint Status', '%Complete','%Code Coverage',
      'Duration', 'Start Date', 'End Date', 'Leaves Taken', 'Assigned to',
      'Tasks Assigned (Current Sprint)','Risks', 'Any Comments'
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
