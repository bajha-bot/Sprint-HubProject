const serverGet = async (key) => {
  try {
    const res = await fetch(`/api/sheet-ids`);
    const data = await res.json();
    const serverValue = data[key];
    const localValue = localStorage.getItem(key);
    const result = serverValue ?? localValue ?? null;
    if (serverValue && !localValue) localStorage.setItem(key, serverValue);
    return result;
  } catch (e) {
    return localStorage.getItem(key);
  }
};

const serverSet = async (key, value) => {
  try {
    await fetch(`/api/sheet-ids`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: value })
    });
    localStorage.setItem(key, value);
  } catch (e) {
    localStorage.setItem(key, value);
  }
};

const RAID_LOG_SHEETS_KEY = 'sprintHub_raidLog_sheets';
const RAID_CONSOLIDATED_SHEET_KEY = 'sprintHub_raidLog_consolidated_sheet';

export const RAID_HEADERS = ['No', 'Category', 'Description', 'Priority', 'Next Actions', 'Owner', 'Last Update'];

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
          dimensions: { sheetId: 0, dimension: 'COLUMNS', startIndex: 0, endIndex: RAID_HEADERS.length }
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

export const getStoredRaidLogSheets = async () => {
  const stored = await serverGet(RAID_LOG_SHEETS_KEY);
  if (!stored) return {};
  const raw = typeof stored === 'string' ? JSON.parse(stored) : stored;
  return raw;
};

export const storeRaidLogSheet = async (projectName, sheetUrl, spreadsheetId) => {
  const sheets = await getStoredRaidLogSheets();
  const resolvedId = spreadsheetId || sheetUrl?.split('/d/')[1]?.split('/')[0] || null;
  sheets[projectName] = { sheetUrl, spreadsheetId: resolvedId, createdAt: new Date().toISOString() };
  const value = JSON.stringify(sheets);
  localStorage.setItem(RAID_LOG_SHEETS_KEY, value);
  await serverSet(RAID_LOG_SHEETS_KEY, value);
};

export const getRaidLogSheetUrl = async (projectName) => {
  const sheets = await getStoredRaidLogSheets();
  return sheets[projectName]?.sheetUrl || null;
};

export const getRaidConsolidatedSheetUrl = async () => {
  const stored = await serverGet(RAID_CONSOLIDATED_SHEET_KEY);
  if (!stored) return null;
  const parsed = typeof stored === 'string' ? JSON.parse(stored) : stored;
  return parsed?.sheetUrl || null;
};

export const getRaidConsolidatedSheetId = async () => {
  const stored = await serverGet(RAID_CONSOLIDATED_SHEET_KEY);
  if (!stored) return null;
  const parsed = typeof stored === 'string' ? JSON.parse(stored) : stored;
  return parsed?.spreadsheetId || null;
};

export const storeRaidConsolidatedSheet = async (sheetUrl, spreadsheetId) => {
  const value = JSON.stringify({ sheetUrl, spreadsheetId, createdAt: new Date().toISOString() });
  localStorage.setItem(RAID_CONSOLIDATED_SHEET_KEY, value);
  await serverSet(RAID_CONSOLIDATED_SHEET_KEY, value);
};

export const syncRaidConsolidatedSheet = async () => {
  const consolidatedSheetId = await getRaidConsolidatedSheetId();
  if (!consolidatedSheetId) return;

  const gapi = window.gapi;
  if (!gapi?.client?.sheets) {
    const { initializeGoogleAPI, initializeGIS } = await import('./googleSheetsService');
    await Promise.all([initializeGoogleAPI(), initializeGIS()]);
  }
  if (!gapi?.client?.sheets) throw new Error('Google Sheets API not loaded.');
  if (!gapi.client.getToken()) {
    const { authenticate } = await import('./googleSheetsService');
    await authenticate();
  }

  const allSheets = await getStoredRaidLogSheets();
  const allRows = [];

  for (const [, sheetData] of Object.entries(allSheets)) {
    const spreadsheetId = sheetData.spreadsheetId || sheetData.sheetUrl?.split('/d/')[1]?.split('/')[0];
    if (!spreadsheetId || spreadsheetId === 'null') continue;
    try {
      const res = await gapi.client.sheets.spreadsheets.values.get({ spreadsheetId, range: 'A2:G' });
      const rows = (res.result.values || []).filter(row => row.some(cell => cell?.toString().trim()));
      allRows.push(...rows);
    } catch (e) {
      console.warn('RAID sync read error:', e);
    }
  }

  if (allRows.length === 0) throw new Error('No RAID log data found in any project sheets.');

  await gapi.client.sheets.spreadsheets.values.clear({ spreadsheetId: consolidatedSheetId, range: 'A2:G' });
  await gapi.client.sheets.spreadsheets.values.update({
    spreadsheetId: consolidatedSheetId,
    range: 'A2',
    valueInputOption: 'RAW',
    resource: { values: allRows }
  });
};

export const createRaidLogSheet = async (projectName, gapi) => {
  try {
    // Ensure consolidated sheet exists first
    let consolidatedSheetId = await getRaidConsolidatedSheetId();
    if (!consolidatedSheetId) {
      const result = await createRaidConsolidatedSheet(gapi);
      consolidatedSheetId = result.spreadsheetId;
    }

    const existingUrl = await getRaidLogSheetUrl(projectName);
    if (existingUrl) return { sheetUrl: existingUrl, isNew: false };

    const createResponse = await gapi.client.sheets.spreadsheets.create({
      properties: { title: `${projectName}_RAID_Log` }
    });
    const spreadsheetId = createResponse.result.spreadsheetId;

    await gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'A1',
      valueInputOption: 'RAW',
      resource: { values: [RAID_HEADERS] }
    });

    await applySheetFormatting(gapi, spreadsheetId);
    await setPublicPermissions(gapi, spreadsheetId);

    const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
    await storeRaidLogSheet(projectName, sheetUrl, spreadsheetId);

    return { sheetUrl, spreadsheetId, isNew: true };
  } catch (error) {
    console.error('Error creating RAID log sheet:', error);
    throw error;
  }
};

export const createRaidConsolidatedSheet = async (gapi) => {
  try {
    const existingUrl = await getRaidConsolidatedSheetUrl();
    if (existingUrl) return { sheetUrl: existingUrl, isNew: false };

    const createResponse = await gapi.client.sheets.spreadsheets.create({
      properties: { title: 'All_Projects_RAID_Log_Consolidated' }
    });
    const spreadsheetId = createResponse.result.spreadsheetId;

    await gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'A1',
      valueInputOption: 'RAW',
      resource: { values: [RAID_HEADERS] }
    });

    await applySheetFormatting(gapi, spreadsheetId);
    await setPublicPermissions(gapi, spreadsheetId);

    const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
    await storeRaidConsolidatedSheet(sheetUrl, spreadsheetId);

    return { sheetUrl, spreadsheetId, isNew: true };
  } catch (error) {
    console.error('Error creating RAID consolidated sheet:', error);
    throw error;
  }
};
