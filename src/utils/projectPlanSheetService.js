const serverGet = async (key) => {
  try {
    const res = await fetch(`/api/sheet-ids`);
    const data = await res.json();
    const serverValue = data[key];
    const localValue = localStorage.getItem(key);
    const result = serverValue ?? localValue ?? null;
    // Always sync server value to localStorage so fallback is fresh
    if (serverValue !== undefined && serverValue !== null) {
      const toStore = typeof serverValue === 'string' ? serverValue : JSON.stringify(serverValue);
      localStorage.setItem(key, toStore);
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

const fuzzyFindKey = (sheets, projectName) => {
  const norm = s => sanitizeProjectName(s).toLowerCase();
  const target = norm(projectName);
  // 1. Exact normalized match
  const exact = Object.keys(sheets).find(k => norm(k) === target);
  if (exact) return exact;
  // 2. Prefix match (handles API-truncated names)
  const prefix = Object.keys(sheets).find(k => norm(k).startsWith(target) || target.startsWith(norm(k)));
  if (prefix) return prefix;
  // 3. Longest common prefix >= 10 chars
  return Object.keys(sheets).find(k => {
    const a = norm(k), b = target;
    let i = 0;
    while (i < a.length && i < b.length && a[i] === b[i]) i++;
    return i >= 10;
  }) || null;
};

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
  const key = fuzzyFindKey(sheets, projectName);
  console.log('[getProjectPlanSheetUrl] projectName:', JSON.stringify(projectName), '| matched key:', key, '| available keys:', Object.keys(sheets));
  return key ? sheets[key]?.sheetUrl || null : null;
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

const fetchSheetWithRetry = async (gapi, spreadsheetId, range, retries = 5) => {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await gapi.client.sheets.spreadsheets.values.get({ spreadsheetId, range });
      return res.result.values || [];
    } catch (e) {
      const status = e?.result?.error?.code || e?.status;
      if (status === 429 && i < retries - 1) {
        const delay = 2000 * Math.pow(2, i); // 2s, 4s, 8s, 16s
        console.warn(`[fetchSheetWithRetry] 429 rate limit, retrying in ${delay}ms...`);
        await sleep(delay);
        continue;
      }
      throw e;
    }
  }
};

const apiCallWithRetry = async (fn, retries = 5) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e) {
      const status = e?.result?.error?.code || e?.status;
      if (status === 429 && i < retries - 1) {
        const delay = 2000 * Math.pow(2, i);
        console.warn(`[apiCallWithRetry] 429 rate limit, retrying in ${delay}ms...`);
        await sleep(delay);
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

  // Ensure consolidated sheet header has Current Focus Areas
  const consolidatedHeaders = [
    'Project Name', 'Sprint', 'Tasks Completed (Last Sprint task - Story Points)',
    'Story Points', 'Health', 'Emp status', 'Sprint Status', '%Complete', '%Code Coverage',
    'Duration', 'Start Date', 'End Date', 'Leaves Taken', 'Employee Name', 'Project Manager',
    'Project Owner', 'Project Sponsor', 'Achievemnets', 'Current Focus Areas', 'Growth', 'Assigned to',
    'Tasks Assigned (Current Sprint)', 'Risks', 'Any Comments'
  ];
  const existingHeaderRes = await apiCallWithRetry(() => gapi.client.sheets.spreadsheets.values.get({ spreadsheetId: consolidatedSheetId, range: 'A1:Z1' }));
  const existingHeaders = existingHeaderRes.result.values?.[0] || [];
  if (!existingHeaders.includes('Current Focus Areas')) {
    await apiCallWithRetry(() => gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: consolidatedSheetId,
      range: 'A1',
      valueInputOption: 'RAW',
      resource: { values: [consolidatedHeaders] }
    }));
    // console.log('[syncConsolidatedSheet] Updated header row with Current Focus Areas');
  }
  await sleep(500);

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
      const values = await fetchSheetWithRetry(gapi, spreadsheetId, 'A2:Z');
      allRows.push(...values.filter(row => row.some(cell => cell?.toString().trim())));
    } catch (e) {
      console.warn(`[Sync] Failed to read ${projectName}:`, e?.result?.error?.message || e);
    }
    await sleep(600);
  }

  console.log('[Sync] Total rows to write:', allRows.length);

  // Always clear and rewrite so deleted projects are removed from the sheet
  await apiCallWithRetry(() => gapi.client.sheets.spreadsheets.values.clear({
    spreadsheetId: consolidatedSheetId,
    range: 'A2:Z'
  }));

  if (allRows.length === 0) {
    console.warn('[Sync] No rows found — sheet cleared');
    return;
  }

  await sleep(500);
  await apiCallWithRetry(() => gapi.client.sheets.spreadsheets.values.update({
    spreadsheetId: consolidatedSheetId,
    range: 'A2',
    valueInputOption: 'RAW',
    resource: { values: allRows }
  }));
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
      'Duration', 'Start Date', 'End Date', 'Leaves Taken', 'Employee Name','Project Manager','Project Owner','Project Sponsor','Achievemnets','Current Focus Areas','Growth','Assigned to',
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

  // Ensure client consolidated sheet header has Current Focus Areas
  const clientHeaders = [
    'Project Name', 'Sprint', 'Tasks Completed (Last Sprint task - Story Points)',
    'Story Points', 'Health', 'Emp status', 'Sprint Status', '%Complete', '%Code Coverage',
    'Duration', 'Start Date', 'End Date', 'Leaves Taken', 'Employee Name', 'Project Manager',
    'Project Owner', 'Project Sponsor', 'Achievemnets', 'Current Focus Areas', 'Growth', 'Assigned to',
    'Tasks Assigned (Current Sprint)', 'Risks', 'Any Comments'
  ];
  const existingClientHeaderRes = await apiCallWithRetry(() => gapi.client.sheets.spreadsheets.values.get({ spreadsheetId: consolidatedSheetId, range: 'A1:Z1' }));
  const existingClientHeaders = existingClientHeaderRes.result.values?.[0] || [];
  if (!existingClientHeaders.includes('Current Focus Areas')) {
    await apiCallWithRetry(() => gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: consolidatedSheetId,
      range: 'A1',
      valueInputOption: 'RAW',
      resource: { values: [clientHeaders] }
    }));
    console.log('[syncClientConsolidatedSheet] Updated header row with Current Focus Areas');
  }
  await sleep(500);

  const allSheets = await getStoredProjectPlanSheets();
  const allRows = [];
  const errors = [];

  for (const projectName of clientProjects) {
    const sheetData = allSheets[projectName];
    const spreadsheetId = sheetData?.spreadsheetId || sheetData?.sheetUrl?.split('/d/')[1]?.split('/')[0];
    if (!spreadsheetId || spreadsheetId === 'null') continue;
    try {
      const values = await fetchSheetWithRetry(gapi, spreadsheetId, 'A2:Z');
      const rows = values.filter(row => row.some(cell => cell?.toString().trim()));
      allRows.push(...rows);
    } catch (e) {
      errors.push(`${projectName}: ${e?.result?.error?.message || String(e)}`);
    }
    await sleep(600); // delay between each sheet read
  }

  if (allRows.length === 0) throw new Error('No data found in any project sheets for this client.');

  // Guard against partial sync overwriting more complete data
  let existingCount = 0;
  try {
    const existing = await apiCallWithRetry(() => gapi.client.sheets.spreadsheets.values.get({ spreadsheetId: consolidatedSheetId, range: 'A2:A' }));
    existingCount = (existing.result.values || []).length;
  } catch (_) {}
  if (existingCount > 0 && allRows.length < existingCount * 0.8) {
    console.warn(`[ClientSync] Skipping: collected ${allRows.length} rows but sheet has ${existingCount}`);
    return;
  }

  await apiCallWithRetry(() => gapi.client.sheets.spreadsheets.values.clear({ spreadsheetId: consolidatedSheetId, range: 'A2:Z' }));
  await sleep(500);
  await apiCallWithRetry(() => gapi.client.sheets.spreadsheets.values.update({
    spreadsheetId: consolidatedSheetId,
    range: 'A2',
    valueInputOption: 'RAW',
    resource: { values: allRows }
  }));
};

export const createClientConsolidatedSheet = async (clientName, clientProjects, gapi) => {
  const existingUrl = await getClientConsolidatedSheetUrl(clientName);
  if (existingUrl) return { sheetUrl: existingUrl, isNew: false };

  const headers = [
    'Project Name', 'Sprint', 'Tasks Completed (Last Sprint task - Story Points)',
    'Story Points', 'Health', 'Emp status', 'Sprint Status', '%Complete', '%Code Coverage',
    'Duration', 'Start Date', 'End Date', 'Leaves Taken', 'Employee Name', 'Project Manager',
    'Project Owner', 'Project Sponsor', 'Achievemnets','Current Focus Areas' ,'Growth', 'Assigned to',
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
      'Duration', 'Start Date', 'End Date', 'Leaves Taken', 'Employee Name','Project Manager','Project Owner','Project Sponsor','Achievemnets','Current Focus Areas','Growth','Assigned to',
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

export const migrateSheetHeaders = async () => {
  const gapi = window.gapi;
  if (!gapi?.client?.sheets) { console.warn('[migrateSheetHeaders] gapi not ready'); return; }
  const allSheets = await getStoredProjectPlanSheets();
  for (const [projectName, sheetData] of Object.entries(allSheets)) {
    const spreadsheetId = sheetData.spreadsheetId || sheetData.sheetUrl?.split('/d/')[1]?.split('/')[0];
    if (!spreadsheetId || spreadsheetId === 'null') continue;
    try {
      const res = await gapi.client.sheets.spreadsheets.values.get({ spreadsheetId, range: 'A1:Z1' });
      const existingHeaders = res.result.values?.[0] || [];
      if (existingHeaders.includes('Current Focus Areas')) {
        console.log(`[migrateSheetHeaders] Already has column: ${projectName}`);
        continue;
      }
      const insertAfter = existingHeaders.findIndex(h => h?.toLowerCase().includes('achievem'));
      const growthIdx = existingHeaders.findIndex(h => h?.toLowerCase() === 'growth');
      const insertIdx = insertAfter >= 0 ? insertAfter + 1 : growthIdx >= 0 ? growthIdx : existingHeaders.length;
      // Insert blank column at insertIdx to shift data right
      await gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: {
          requests: [{ insertDimension: { range: { sheetId: 0, dimension: 'COLUMNS', startIndex: insertIdx, endIndex: insertIdx + 1 }, inheritFromBefore: false } }]
        }
      });
      // Write header name into the new column cell
      const col = String.fromCharCode(65 + insertIdx);
      await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${col}1`,
        valueInputOption: 'RAW',
        resource: { values: [['Current Focus Areas']] }
      });
      // Style the new header cell to match others (black bg, white bold text)
      await gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: {
          requests: [{
            repeatCell: {
              range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1, startColumnIndex: insertIdx, endColumnIndex: insertIdx + 1 },
              cell: { userEnteredFormat: { backgroundColor: { red: 0, green: 0, blue: 0 }, textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } }, horizontalAlignment: 'CENTER' } },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
            }
          }]
        }
      });
      console.log(`[migrateSheetHeaders] Added 'Current Focus Areas' to ${projectName} at col ${col}`);
    } catch (e) {
      console.warn(`[migrateSheetHeaders] Skipped ${projectName}:`, e?.result?.error?.message || e);
    }
    await sleep(400);
  }
};
