const PROJECT_TEAM_SHEETS_KEY = 'sprintHub_projectTeam_sheets';
const TEAM_CONSOLIDATED_SHEET_KEY = 'sprintHub_team_consolidated_sheet';

export const getStoredProjectTeamSheets = () => {
  const stored = localStorage.getItem(PROJECT_TEAM_SHEETS_KEY);
  return stored ? JSON.parse(stored) : {};
};

export const storeProjectTeamSheet = (projectName, sheetUrl, spreadsheetId) => {
  const sheets = getStoredProjectTeamSheets();
  const resolvedId = spreadsheetId || sheetUrl?.split('/d/')[1]?.split('/')[0] || null;
  sheets[projectName] = { sheetUrl, spreadsheetId: resolvedId, createdAt: new Date().toISOString() };
  localStorage.setItem(PROJECT_TEAM_SHEETS_KEY, JSON.stringify(sheets));
};

export const getProjectTeamSheetUrl = (projectName) => {
  const sheets = getStoredProjectTeamSheets();
  return sheets[projectName]?.sheetUrl || null;
};

export const getTeamConsolidatedSheetUrl = () => {
  const stored = localStorage.getItem(TEAM_CONSOLIDATED_SHEET_KEY);
  return stored ? JSON.parse(stored).sheetUrl : null;
};

export const getTeamConsolidatedSheetId = () => {
  const stored = localStorage.getItem(TEAM_CONSOLIDATED_SHEET_KEY);
  return stored ? JSON.parse(stored).spreadsheetId : null;
};

export const storeTeamConsolidatedSheet = (sheetUrl, spreadsheetId) => {
  localStorage.setItem(TEAM_CONSOLIDATED_SHEET_KEY, JSON.stringify({ sheetUrl, spreadsheetId, createdAt: new Date().toISOString() }));
};

const TEAM_HEADERS = [
  'Project Name',
  'Project Owner',
  'Project Manager',
  'Team Lead',
  'BE Developer (Backend Developer)',
  'FE Developer (Frontend Developer)',
  'FS Developer (Full Stack Developer)',
  'Quality Engineer',
  'Scrum Master',
  'QA Lead',
  'UX Designer',
  'Data Engineer'
];

const applySheetFormatting = async (gapi, spreadsheetId) => {
  await gapi.client.sheets.spreadsheets.batchUpdate({
    spreadsheetId,
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
          dimensions: { sheetId: 0, dimension: 'COLUMNS', startIndex: 0, endIndex: TEAM_HEADERS.length }
        }
      }]
    }
  });
};

const setPublicPermissions = async (gapi, spreadsheetId) => {
  try {
    await gapi.client.request({
      path: `https://www.googleapis.com/drive/v3/files/${spreadsheetId}/permissions`,
      method: 'POST',
      body: { role: 'writer', type: 'anyone' }
    });
  } catch (e) {
    console.warn('Could not set public edit permissions:', e);
  }
};

export const syncTeamConsolidatedSheet = async (gapi) => {
  try {
    const consolidatedSheetId = getTeamConsolidatedSheetId();
    if (!consolidatedSheetId) return;

    const allSheets = getStoredProjectTeamSheets();
    const allRows = [];

    for (const [projectName, sheetData] of Object.entries(allSheets)) {
      const spreadsheetId = sheetData.spreadsheetId || sheetData.sheetUrl?.split('/d/')[1]?.split('/')[0];
      if (!spreadsheetId || spreadsheetId === 'null') {
        console.warn(`Skipping ${projectName} - invalid spreadsheetId`);
        continue;
      }
      try {
        const res = await gapi.client.sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `A2:K`
        });
        const rows = (res.result.values || []).filter(row => row.some(cell => cell && cell.toString().trim() !== ''));
        allRows.push(...rows);
      } catch (e) {
        console.warn(`Skipping ${projectName} due to fetch error:`, e?.result?.error?.message || e);
      }
    }

    if (allRows.length === 0) {
      console.warn('No team data found across all project sheets');
      return;
    }

    await gapi.client.sheets.spreadsheets.values.clear({
      spreadsheetId: consolidatedSheetId,
      range: 'A2:K'
    });

    await gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: consolidatedSheetId,
      range: 'A2',
      valueInputOption: 'RAW',
      resource: { values: allRows }
    });

    console.log('Team consolidated sheet synced successfully');
  } catch (error) {
    console.error('Error syncing team consolidated sheet:', error);
    throw error;
  }
};

export const createProjectTeamSheet = async (projectName, gapi) => {
  try {
    const consolidatedSheetId = getTeamConsolidatedSheetId();
    if (!consolidatedSheetId) {
      throw new Error('Please create the consolidated team sheet first by clicking "All Projects" button');
    }

    const existingUrl = getProjectTeamSheetUrl(projectName);
    if (existingUrl) {
      return { sheetUrl: existingUrl, isNew: false };
    }

    const createResponse = await gapi.client.sheets.spreadsheets.create({
      properties: { title: `${projectName}_Project_Team` }
    });

    const spreadsheetId = createResponse.result.spreadsheetId;

    await gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'A1',
      valueInputOption: 'RAW',
      resource: { values: [TEAM_HEADERS] }
    });

    await applySheetFormatting(gapi, spreadsheetId);
    await setPublicPermissions(gapi, spreadsheetId);

    const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
    storeProjectTeamSheet(projectName, sheetUrl, spreadsheetId);
    await syncTeamConsolidatedSheet(gapi);

    return { sheetUrl, spreadsheetId, isNew: true };
  } catch (error) {
    console.error('Error creating project team sheet:', error);
    throw error;
  }
};

export const createTeamConsolidatedSheet = async (gapi) => {
  try {
    const existingUrl = getTeamConsolidatedSheetUrl();
    if (existingUrl) {
      return { sheetUrl: existingUrl, isNew: false };
    }

    const createResponse = await gapi.client.sheets.spreadsheets.create({
      properties: { title: 'All_Projects-Teams_merge-Sheet' }
    });

    const spreadsheetId = createResponse.result.spreadsheetId;

    await gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'A1',
      valueInputOption: 'RAW',
      resource: { values: [TEAM_HEADERS] }
    });

    await applySheetFormatting(gapi, spreadsheetId);
    await setPublicPermissions(gapi, spreadsheetId);

    const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
    storeTeamConsolidatedSheet(sheetUrl, spreadsheetId);

    return { sheetUrl, spreadsheetId, isNew: true };
  } catch (error) {
    console.error('Error creating team consolidated sheet:', error);
    throw error;
  }
};
