const serverGet = async (key) => {
  try {
    const res = await fetch(`/api/sheet-ids`);
    const data = await res.json();
    const serverValue = data[key];
    const localValue = localStorage.getItem(key);
    const result = serverValue ?? localValue ?? null;
    if (serverValue && !localValue) {
      localStorage.setItem(key, serverValue);
    }
    return result;
  } catch (e) {
    console.warn('[serverGet] fetch failed, using localStorage for key:', key);
    return localStorage.getItem(key);
  }
};

const serverSet = async (key, value) => {
  try {
    const res = await fetch(`/api/sheet-ids`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: value })
    });
    const result = await res.json();
    // console.log('[serverSet] key:', key, 'response:', result);
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn('[serverSet] fetch failed, saving to localStorage only:', e.message);
    localStorage.setItem(key, value);
  }
};

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

const sanitizeProjectName = (name) => name?.replace(/[\r\n\t]+/g, ' ').trim() ?? '';

export const getStoredProjectPlanSheets = async () => {
  const stored = await serverGet(PROJECT_PLAN_SHEETS_KEY);
  if (!stored) return {};
  const raw = typeof stored === 'string' ? JSON.parse(stored) : stored; 
  // Normalize all keys on read to eliminate any newline-keyed duplicates
  const normalized = {};
  for (const [key, val] of Object.entries(raw)) {
    const clean = sanitizeProjectName(key);
    // If duplicate after sanitize, keep the one with a valid spreadsheetId
    if (!normalized[clean] || (!normalized[clean].spreadsheetId && val.spreadsheetId)) {
      normalized[clean] = val;
    }
  }
  return normalized;
};

export const storeProjectPlanSheet = async (projectName, sheetUrl, spreadsheetId) => {
  const cleanName = sanitizeProjectName(projectName);
  const sheets = await getStoredProjectPlanSheets();
  const resolvedId = spreadsheetId || sheetUrl?.split('/d/')[1]?.split('/')[0] || null;
  sheets[cleanName] = { sheetUrl, spreadsheetId: resolvedId, createdAt: new Date().toISOString() };
  const value = JSON.stringify(sheets);
  localStorage.setItem(PROJECT_PLAN_SHEETS_KEY, value);
  await serverSet(PROJECT_PLAN_SHEETS_KEY, value);
  // console.log('[storeProjectPlanSheet] saved:', cleanName, resolvedId);
};

export const deleteProjectPlanSheet = async (projectName) => {
  const cleanName = sanitizeProjectName(projectName);
  const sheets = await getStoredProjectPlanSheets();
  delete sheets[cleanName];
  const value = JSON.stringify(sheets);
  localStorage.setItem(PROJECT_PLAN_SHEETS_KEY, value);
  await serverSet(PROJECT_PLAN_SHEETS_KEY, value);
  console.log('[deleteProjectPlanSheet] removed:', cleanName);
};

export const getProjectPlanSheetUrl = async (projectName) => {
  const sheets = await getStoredProjectPlanSheets();
  return sheets[sanitizeProjectName(projectName)]?.sheetUrl || null;
};

export const getConsolidatedSheetUrl = async () => {
  const stored = await serverGet(CONSOLIDATED_SHEET_KEY);
  if (!stored) return null;
  const parsed = typeof stored === 'string' ? JSON.parse(stored) : stored;
  return parsed.sheetUrl;
};

export const getConsolidatedSheetId = async () => {
  const stored = await serverGet(CONSOLIDATED_SHEET_KEY);
  // console.log('[getConsolidatedSheetId] raw stored value:', stored);
  if (!stored) return null;
  const parsed = typeof stored === 'string' ? JSON.parse(stored) : stored;
  return parsed.spreadsheetId;
};

export const storeConsolidatedSheet = async (sheetUrl, spreadsheetId) => {
  console.log('[storeConsolidatedSheet] saving:', spreadsheetId, sheetUrl);
  const value = JSON.stringify({ sheetUrl, spreadsheetId, createdAt: new Date().toISOString() });
  localStorage.setItem(CONSOLIDATED_SHEET_KEY, value);
  await serverSet(CONSOLIDATED_SHEET_KEY, value);
  console.log('[storeConsolidatedSheet] saved successfully');
};

const sleep = (ms) => new Promise(res => setTimeout(res, ms));

const fetchSheetWithRetry = async (gapi, spreadsheetId, range, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await gapi.client.sheets.spreadsheets.values.get({ spreadsheetId, range });
      return res.result.values || [];
    } catch (e) {
      const status = e?.result?.error?.code || e?.status;
      if (status === 429 && i < retries - 1) {
        await sleep(1500 * (i + 1)); // 1.5s, 3s, 4.5s
        continue;
      }
      throw e;
    }
  }
};

export const syncConsolidatedSheet = async (deletedProjects = []) => {
  console.log('[syncConsolidatedSheet] called');
  const consolidatedSheetId = await getConsolidatedSheetId();
  if (!consolidatedSheetId) {
    console.warn('[syncConsolidatedSheet] No consolidated sheet ID found - returning early');
    return;
  }

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

  const allSheets = await getStoredProjectPlanSheets();

  const validEntries = Object.entries(allSheets).filter(([projectName, sheetData]) => {
    if (deletedProjects.some(d => d.toLowerCase() === projectName.toLowerCase())) return false;
    const id = sheetData.spreadsheetId || sheetData.sheetUrl?.split('/d/')[1]?.split('/')[0];
    return id && id !== 'null' && id !== 'undefined';
  });

  const allRows = [];
  for (const [projectName, sheetData] of validEntries) {
    const spreadsheetId = sheetData.spreadsheetId || sheetData.sheetUrl?.split('/d/')[1]?.split('/')[0];
    if (!spreadsheetId || spreadsheetId === 'null') {
      console.warn(`[Sync] Skipping ${projectName}: no valid spreadsheetId`);
      continue;
    }
    try {
      const values = await fetchSheetWithRetry(gapi, spreadsheetId, 'A2:W');
      allRows.push(...values.filter(row => row.some(cell => cell?.toString().trim())));
    } catch (e) {
      console.warn(`[Sync] Failed to read ${projectName}:`, e?.result?.error?.message || e);
    }
    await sleep(300);
  }

  console.log('[Sync] Total rows to write:', allRows.length);

  // Always clear and rewrite so deleted projects are removed from the sheet
  await gapi.client.sheets.spreadsheets.values.clear({
    spreadsheetId: consolidatedSheetId,
    range: 'A2:W'
  });

  if (allRows.length === 0) {
    console.warn('[Sync] No rows found — sheet cleared');
    return;
  }

  await gapi.client.sheets.spreadsheets.values.update({
    spreadsheetId: consolidatedSheetId,
    range: 'A2',
    valueInputOption: 'RAW',
    resource: { values: allRows }
  });
  console.log('[Sync] Successfully wrote', allRows.length, 'rows to consolidated sheet');
};

export const createProjectPlanSheet = async (projectName, gapi) => {
  try {
    let consolidatedSheetId = await getConsolidatedSheetId();
    if (!consolidatedSheetId) {
      const result = await createConsolidatedProjectSheet([], gapi);
      consolidatedSheetId = result.spreadsheetId;
    }

    const existingUrl = await getProjectPlanSheetUrl(projectName);
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
    console.log('[createProjectPlanSheet] storing sheet:', projectName, spreadsheetId);
    await storeProjectPlanSheet(projectName, sheetUrl, spreadsheetId);
    // Skip sync on creation — sheet is empty, sync after adding data

    return { sheetUrl, spreadsheetId, isNew: true };
  } catch (error) {
    console.error('Error creating project plan sheet:', error);
    throw error;
  }
};

const CLIENT_CONSOLIDATED_KEY = 'sprintHub_client_consolidated_sheets';

export const getClientConsolidatedSheetUrl = async (clientName) => {
  const stored = await serverGet(CLIENT_CONSOLIDATED_KEY);
  const all = stored ? (typeof stored === 'string' ? JSON.parse(stored) : stored) : {};
  return all[clientName]?.sheetUrl || null;
};

export const getClientConsolidatedSheetId = async (clientName) => {
  const stored = await serverGet(CLIENT_CONSOLIDATED_KEY);
  const all = stored ? (typeof stored === 'string' ? JSON.parse(stored) : stored) : {};
  return all[clientName]?.spreadsheetId || null;
};

const storeClientConsolidatedSheet = async (clientName, sheetUrl, spreadsheetId) => {
  const stored = await serverGet(CLIENT_CONSOLIDATED_KEY);
  const all = stored ? (typeof stored === 'string' ? JSON.parse(stored) : stored) : {};
  all[clientName] = { sheetUrl, spreadsheetId, createdAt: new Date().toISOString() };
  await serverSet(CLIENT_CONSOLIDATED_KEY, JSON.stringify(all));
};

export const syncClientConsolidatedSheet = async (clientName, clientProjects) => {
  const consolidatedSheetId = await getClientConsolidatedSheetId(clientName);
  if (!consolidatedSheetId) throw new Error(`Client sheet not found. Please create it first.`);

  const gapi = window.gapi;
  if (!gapi?.client?.sheets) {
    const { initializeGoogleAPI, initializeGIS } = await import('./googleSheetsService');
    await Promise.all([initializeGoogleAPI(), initializeGIS()]);
  }
  if (!gapi.client.getToken()) {
    const { authenticate } = await import('./googleSheetsService');
    await authenticate();
  }

  const allSheets = await getStoredProjectPlanSheets();
  const allRows = [];
  const errors = [];

  for (const projectName of clientProjects) {
    const sheetData = allSheets[projectName];
    const spreadsheetId = sheetData?.spreadsheetId || sheetData?.sheetUrl?.split('/d/')[1]?.split('/')[0];
    if (!spreadsheetId || spreadsheetId === 'null') continue;
    try {
      const values = await fetchSheetWithRetry(gapi, spreadsheetId, 'A2:W');
      const rows = values.filter(row => row.some(cell => cell?.toString().trim()));
      allRows.push(...rows);
    } catch (e) {
      errors.push(`${projectName}: ${e?.result?.error?.message || String(e)}`);
    }
    await sleep(300); // small delay between each sheet read
  }

  if (allRows.length === 0) throw new Error('No data found in any project sheets for this client.');

  // Guard against partial sync overwriting more complete data
  let existingCount = 0;
  try {
    const existing = await gapi.client.sheets.spreadsheets.values.get({ spreadsheetId: consolidatedSheetId, range: 'A2:A' });
    existingCount = (existing.result.values || []).length;
  } catch (_) {}
  if (existingCount > 0 && allRows.length < existingCount * 0.8) {
    console.warn(`[ClientSync] Skipping: collected ${allRows.length} rows but sheet has ${existingCount}`);
    return;
  }

  await gapi.client.sheets.spreadsheets.values.clear({ spreadsheetId: consolidatedSheetId, range: 'A2:W' });
  await gapi.client.sheets.spreadsheets.values.update({
    spreadsheetId: consolidatedSheetId,
    range: 'A2',
    valueInputOption: 'RAW',
    resource: { values: allRows }
  });
};

export const createClientConsolidatedSheet = async (clientName, clientProjects, gapi) => {
  const existingUrl = await getClientConsolidatedSheetUrl(clientName);
  if (existingUrl) return { sheetUrl: existingUrl, isNew: false };

  const headers = [
    'Project Name', 'Sprint', 'Tasks Completed (Last Sprint task - Story Points)',
    'Story Points', 'Health', 'Emp status', 'Sprint Status', '%Complete', '%Code Coverage',
    'Duration', 'Start Date', 'End Date', 'Leaves Taken', 'Employee Name', 'Project Manager',
    'Project Owner', 'Project Sponsor', 'Achievemnets', 'Growth', 'Assigned to',
    'Tasks Assigned (Current Sprint)', 'Risks', 'Any Comments'
  ];

  const createResponse = await gapi.client.sheets.spreadsheets.create({
    properties: { title: `${clientName}_All_Projects_Consolidated` }
  });
  const spreadsheetId = createResponse.result.spreadsheetId;

  await gapi.client.sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'A1',
    valueInputOption: 'RAW',
    resource: { values: [headers] }
  });

  await gapi.client.sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    resource: {
      requests: [{
        repeatCell: {
          range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1 },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.118, green: 0.227, blue: 0.373 },
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
  } catch (e) { console.warn('Permission error:', e); }

  const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  await storeClientConsolidatedSheet(clientName, sheetUrl, spreadsheetId);
  await syncClientConsolidatedSheet(clientName, clientProjects);

  return { sheetUrl, spreadsheetId, isNew: true };
};

export const createConsolidatedProjectSheet = async (projects, gapi) => {
  try {
    const existingUrl = await getConsolidatedSheetUrl();
    if (existingUrl) {
      // ensure it's also saved to localStorage as backup
      const stored = await serverGet(CONSOLIDATED_SHEET_KEY);
      if (stored) localStorage.setItem(CONSOLIDATED_SHEET_KEY, stored);
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
    await storeConsolidatedSheet(sheetUrl, spreadsheetId);

    return { sheetUrl, spreadsheetId, isNew: true };
  } catch (error) {
    console.error('Error creating consolidated sheet:', error);
    throw error;
  }
};
