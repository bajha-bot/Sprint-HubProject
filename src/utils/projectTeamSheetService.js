const serverGet = async (key) => {
  try {
    const res = await fetch(`/api/storage/${key}`);
    if (!res.ok) throw new Error('Server error');
    const { data } = await res.json();
    if (data !== null && data !== undefined) {
      localStorage.setItem(key, typeof data === 'string' ? data : JSON.stringify(data));
    }
    return data ?? localStorage.getItem(key);
  } catch (e) {
    console.warn('serverGet failed, falling back to localStorage:', e.message);
    return localStorage.getItem(key);
  }
};

const serverSet = async (key, value) => {
  localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  try {
    await fetch(`/api/storage/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(value)
    });
  } catch (e) {
    console.warn('serverSet failed, saving to localStorage only:', e.message);
  }
};

const PROJECT_TEAM_SHEETS_KEY = 'sprintHub_projectTeam_sheets';
const TEAM_CONSOLIDATED_SHEET_KEY = 'sprintHub_team_consolidated_sheet';

export const getStoredProjectTeamSheets = async () => {
  const stored = await serverGet(PROJECT_TEAM_SHEETS_KEY);
  if (!stored) return {};
  return typeof stored === 'string' ? JSON.parse(stored) : stored;
};

export const storeProjectTeamSheet = async (projectName, sheetUrl, spreadsheetId) => {
  const sheets = await getStoredProjectTeamSheets();
  const resolvedId = spreadsheetId || sheetUrl?.split('/d/')[1]?.split('/')[0] || null;
  sheets[projectName] = { sheetUrl, spreadsheetId: resolvedId, createdAt: new Date().toISOString() };
  const value = JSON.stringify(sheets);
  localStorage.setItem(PROJECT_TEAM_SHEETS_KEY, value);
  await serverSet(PROJECT_TEAM_SHEETS_KEY, value);
};

export const getProjectTeamSheetUrl = async (projectName) => {
  const sheets = await getStoredProjectTeamSheets();
  return sheets[projectName]?.sheetUrl || null;
};

export const getTeamConsolidatedSheetUrl = async () => {
  const stored = await serverGet(TEAM_CONSOLIDATED_SHEET_KEY);
  if (!stored) return null;
  const parsed = typeof stored === 'string' ? JSON.parse(stored) : stored;
  return parsed.sheetUrl;
};

export const getTeamConsolidatedSheetId = async () => {
  const stored = await serverGet(TEAM_CONSOLIDATED_SHEET_KEY);
  if (!stored) return null;
  const parsed = typeof stored === 'string' ? JSON.parse(stored) : stored;
  return parsed.spreadsheetId;
};

export const storeTeamConsolidatedSheet = async (sheetUrl, spreadsheetId) => {
  const value = JSON.stringify({ sheetUrl, spreadsheetId, createdAt: new Date().toISOString() });
  localStorage.setItem(TEAM_CONSOLIDATED_SHEET_KEY, value);
  await serverSet(TEAM_CONSOLIDATED_SHEET_KEY, value);
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

export const syncTeamConsolidatedSheet = async () => {
  const consolidatedSheetId = await getTeamConsolidatedSheetId();
  if (!consolidatedSheetId) return; // skip sync if no consolidated sheet yet

  const gapi = window.gapi;

  if (!gapi?.client?.sheets) {
    const { initializeGoogleAPI, initializeGIS } = await import('./googleSheetsService');
    await Promise.all([initializeGoogleAPI(), initializeGIS()]);
  }

  if (!gapi?.client?.sheets) throw new Error('Google Sheets API not loaded. Please refresh the page.');

  if (!gapi.client.getToken()) {
    const { authenticate } = await import('./googleSheetsService');
    await authenticate();
  }

  const allSheets = await getStoredProjectTeamSheets();
  const errors = [];
  const allRows = [];

  for (const [projectName, sheetData] of Object.entries(allSheets)) {
    const spreadsheetId = sheetData.spreadsheetId || sheetData.sheetUrl?.split('/d/')[1]?.split('/')[0];
    if (!spreadsheetId || spreadsheetId === 'null') {
      errors.push(`${projectName}: invalid spreadsheetId`);
      continue;
    }
    try {
      const res = await gapi.client.sheets.spreadsheets.values.get({ spreadsheetId, range: 'A2:L' });
      const rows = (res.result.values || []).filter(row => row.some(cell => cell?.toString().trim()));
      allRows.push(...rows);
    } catch (e) {
      const status = e?.result?.error?.code || e?.status;
      if (status === 403) {
        try {
          await gapi.client.request({
            path: `https://www.googleapis.com/drive/v3/files/${spreadsheetId}/permissions`,
            method: 'POST',
            body: { role: 'writer', type: 'anyone' }
          });
          const retry = await gapi.client.sheets.spreadsheets.values.get({ spreadsheetId, range: 'A2:L' });
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
    throw new Error('Could not read any team sheets:\n' + errors.join('\n'));
  }

  if (allRows.length === 0) {
    throw new Error('No data found in team sheets. Please add data to the project team sheet first.');
  }

  await gapi.client.sheets.spreadsheets.values.clear({ spreadsheetId: consolidatedSheetId, range: 'A2:L' });

  await gapi.client.sheets.spreadsheets.values.update({
    spreadsheetId: consolidatedSheetId,
    range: 'A2',
    valueInputOption: 'RAW',
    resource: { values: allRows }
  });
};

export const createProjectTeamSheet = async (projectName, gapi) => {
  try {
    let consolidatedSheetId = await getTeamConsolidatedSheetId();
    if (!consolidatedSheetId) {
      const result = await createTeamConsolidatedSheet(gapi);
      consolidatedSheetId = result.spreadsheetId;
    }

    const existingUrl = await getProjectTeamSheetUrl(projectName);
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
    await storeProjectTeamSheet(projectName, sheetUrl, spreadsheetId);
    // Skip sync on creation — sheet is empty, sync after adding data

    return { sheetUrl, spreadsheetId, isNew: true };
  } catch (error) {
    console.error('Error creating project team sheet:', error);
    throw error;
  }
};

export const createTeamConsolidatedSheet = async (gapi) => {
  try {
    const existingUrl = await getTeamConsolidatedSheetUrl();
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
    await storeTeamConsolidatedSheet(sheetUrl, spreadsheetId);

    return { sheetUrl, spreadsheetId, isNew: true };
  } catch (error) {
    console.error('Error creating team consolidated sheet:', error);
    throw error;
  }
};
