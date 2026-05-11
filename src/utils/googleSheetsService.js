// Google Sheets API Configuration
const CLIENT_ID = '557002598654-umndh99are1qcrhbhjr2jo54dj6fnucf.apps.googleusercontent.com';
const API_KEY = 'AIzaSyAXU_abdTN3N-6Nv78KbQjht0QKl1xd9Eo';
const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive';

const STATIC_SHEET_ID_KEY = 'sprintHub_allEmployees_sheetId';
const STATIC_CEIPAL_SHEET_ID_KEY = 'sprintHub_ceipal_sheetId';

const getSheetIdFromServer = async (key) => {
  try {
    const res = await fetch(`/api/sheet-ids`);
    const data = await res.json();
    return data[key] || localStorage.getItem(key) || null;
  } catch (e) {
    return localStorage.getItem(key);
  }
};

const saveSheetIdToServer = async (key, value) => {
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

let gapi, gisInited = false, gapiInited = false;
let gapiResolve, gisResolve;

// Initialize Google API
export const initializeGoogleAPI = () => {
  return new Promise((resolve, reject) => {
    gapiResolve = resolve;
    console.log('initializeGoogleAPI called, window.gapi exists:', !!window.gapi);
    if (window.gapi) {
      gapi = window.gapi;
      gapi.load('client', async () => {
        try {
          console.log('Loading gapi client...');
          await gapi.client.init({
            discoveryDocs: [DISCOVERY_DOC],
          });
          gapiInited = true;
          console.log('gapi client initialized');
          maybeEnableButtons();
        } catch (error) {
          console.error('Error initializing gapi client:', error);
          reject(error);
        }
      });
    } else {
      console.error('window.gapi not found');
      reject(new Error('Google API script not loaded'));
    }
  });
};

// Initialize Google Identity Services
export const initializeGIS = () => {
  return new Promise((resolve, reject) => {
    gisResolve = resolve;
    console.log('initializeGIS called, window.google exists:', !!window.google);
    if (window.google) {
      try {
        window.tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: '', // defined later
        });
        gisInited = true;
        console.log('GIS initialized');
        maybeEnableButtons();
      } catch (error) {
        console.error('Error initializing GIS:', error);
        reject(error);
      }
    } else {
      console.error('window.google not found');
      reject(new Error('Google Identity Services script not loaded'));
    }
  });
};

const maybeEnableButtons = () => {
  console.log('maybeEnableButtons called, gapiInited:', gapiInited, 'gisInited:', gisInited);
  if (gapiInited && gisInited) {
    console.log('Both APIs initialized, resolving...');
    if (gapiResolve) gapiResolve(true);
    if (gisResolve) gisResolve(true);
  }
};

// Authenticate user
export const authenticate = () => {
  return new Promise((resolve, reject) => {
    window.tokenClient.callback = async (resp) => {
      if (resp.error !== undefined) {
        reject(resp);
        return;
      }
      resolve(resp);
    };

    if (gapi.client.getToken() === null) {
      window.tokenClient.requestAccessToken({prompt: 'consent'});
    } else {
      window.tokenClient.requestAccessToken({prompt: ''});
    }
  });
};

// Create Google Sheet with data
export const createGoogleSheetWithData = async (data, title = 'Employee Data') => {
  try {
    console.log('Creating Google Sheet with data:', data.length, 'employees');
    
    // Initialize APIs if not already done
    if (!gapiInited || !gisInited) {
      console.log('Initializing Google APIs...');
      await Promise.all([
        initializeGoogleAPI(),
        initializeGIS()
      ]);
      console.log('APIs initialized');
    }
    
    // Check again after initialization
    if (!gapi || !gapi.client) {
      throw new Error('Google API failed to initialize. Please refresh the page and try again.');
    }
    
    console.log('Google API initialized successfully');
    
    // Ensure authentication
    if (gapi.client.getToken() === null) {
      console.log('Requesting authentication...');
      await authenticate();
    }

    // Create spreadsheet
    const createResponse = await gapi.client.sheets.spreadsheets.create({
      properties: {
        title: title
      }
    });

    const spreadsheetId = createResponse.result.spreadsheetId;
    console.log('Created spreadsheet:', spreadsheetId);

    // Prepare data - headers
    const headers = [
      'Employee ID',
      'Employee Name', 
      'Email',
      'Designation',
      'Location',
      'Allocation Status',
      'Employment Type',
      'Date of Joining',
      'Experience',
      'Skills',
      'Project Name',
      'Client Name'
    ];

    // Prepare data rows
    const rows = data.map(emp => [
      emp.employeeId || '',
      emp.employeeName || '',
      emp.emailId || '',
      emp.designation || '',
      emp.employeeLocation || '',
      emp.employeeAllocationDataDTO?.allocationStatus || '',
      emp.employmentType || '',
      emp.dateOfJoining ? new Date(emp.dateOfJoining).toLocaleDateString() : '',
      emp.totalExperience || emp.previousExperience || '',
      emp.employeeSkills || '',
      emp.employeeAllocationDataDTO?.project?.projectName || '',
      emp.employeeAllocationDataDTO?.parentAccount?.accountName || ''
    ]);

    const sheetData = [headers, ...rows];
    console.log('Sheet data prepared:', sheetData.length, 'rows');

    // Add data to spreadsheet
    await gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: 'A1',
      valueInputOption: 'RAW',
      resource: {
        values: sheetData
      }
    });

    console.log('Data added successfully');

    // Format header row
    await gapi.client.sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetId,
      resource: {
        requests: [{
          repeatCell: {
            range: {
              sheetId: 0,
              startRowIndex: 0,
              endRowIndex: 1
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
                textFormat: { bold: true }
              }
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat)'
          }
        }]
      }
    });

    // Set sharing permissions - anyone with link can view
    try {
      await gapi.client.request({
        path: `https://www.googleapis.com/drive/v3/files/${spreadsheetId}/permissions`,
        method: 'POST',
        body: {
          role: 'reader',
          type: 'anyone'
        }
      });
      console.log('Sheet set to public (anyone with link can view)');
    } catch (permError) {
      console.warn('Could not set public permissions:', permError);
    }

    const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
    console.log('Google Sheet created successfully:', sheetUrl);
    return { spreadsheetId, sheetUrl };

  } catch (error) {
    console.error('Error creating Google Sheet:', error);
    throw error;
  }
};

// Create Google Sheet for client projects
export const createClientProjectsGoogleSheet = async (clientName, allEmployees) => {
  try {
    // Filter employees for this client
    const clientEmployees = allEmployees.filter(emp => 
      emp.employeeAllocationDataDTO?.parentAccount?.accountName === clientName
    );

    // Get unique employees
    const uniqueEmployees = clientEmployees.reduce((acc, employee) => {
      const empId = employee.employeeId;
      if (!acc[empId]) {
        acc[empId] = employee;
      }
      return acc;
    }, {});

    const employees = Object.values(uniqueEmployees);
    
    // Use the main function with client-specific title
    return await createGoogleSheetWithData(
      employees,
      `${clientName}_All_Projects_${new Date().toISOString().split('T')[0]}`
    );
  } catch (error) {
    console.error('Error creating client projects Google Sheet:', error);
    throw error;
  }
};

// Create or update static Google Sheet for CEIPAL data
export const createOrUpdateCeipalSheet = async (data) => {
  try {
    console.log('Creating/Updating CEIPAL Google Sheet with data:', data.length, 'records');
    
    if (!gapiInited || !gisInited) {
      await Promise.all([initializeGoogleAPI(), initializeGIS()]);
    }
    
    if (!gapi || !gapi.client) {
      throw new Error('Google API failed to initialize. Please refresh the page and try again.');
    }
    
    if (!gapi.client.getToken()) {
      await authenticate();
    }
    gapi.client.setToken(gapi.client.getToken());

    let spreadsheetId = await getSheetIdFromServer(STATIC_CEIPAL_SHEET_ID_KEY);
    let isNewSheet = false;

    if (!spreadsheetId) {
      const createResponse = await gapi.client.sheets.spreadsheets.create({
        properties: { title: 'SprintHub_CEIPAL_Data' }
      });

      spreadsheetId = createResponse.result.spreadsheetId;
      await saveSheetIdToServer(STATIC_CEIPAL_SHEET_ID_KEY, spreadsheetId);
      isNewSheet = true;
      console.log('Created new CEIPAL spreadsheet:', spreadsheetId);

      try {
        await gapi.client.request({
          path: `https://www.googleapis.com/drive/v3/files/${spreadsheetId}/permissions`,
          method: 'POST',
          body: { role: 'reader', type: 'anyone' }
        });
        console.log('CEIPAL sheet set to public');
      } catch (permError) {
        console.warn('Could not set public permissions:', permError);
      }
    } else {
      console.log('Using existing CEIPAL spreadsheet:', spreadsheetId);
    }

    const headers = [
      'Job Code',
      'Client', 
      'Department',
      'Project Name',
      'Account Size',
      'Demand',
      'Lost Positions',
      'Created Date',
      'Start Date',
      'Closed Date'
    ];
    
    const getFieldValue = (row, fieldNames) => {
      for (const fieldName of fieldNames) {
        if (row[fieldName] !== undefined && row[fieldName] !== null && row[fieldName] !== '') {
          return String(row[fieldName]);
        }
      }
      return '';
    };

    const formatDate = (row, fieldNames) => {
      const value = getFieldValue(row, fieldNames);
      if (!value) return '';
      try {
        const date = new Date(value);
        return isNaN(date.getTime()) ? value : date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
      } catch {
        return value;
      }
    };

    const rows = data.map(row => [
      getFieldValue(row, ['job_code', 'Job Code', 'JobCode', 'Job_Code']),
      getFieldValue(row, ['client', 'Client', 'CLIENT']),
      getFieldValue(row, ['department', 'Department', 'DEPARTMENT']),
      getFieldValue(row, ['project_name', 'Project Name', 'ProjectName', 'Project_Name']),
      getFieldValue(row, ['number_of_positions', 'Number of Positions', 'NumberOfPositions', 'Positions']),
      getFieldValue(row, ['number_of_positions', 'Number of Positions', 'NumberOfPositions', 'Positions']),
      getFieldValue(row, ['closed_date', 'Closed Date', 'ClosedDate', 'Closed_Date']) ? '1' : '0',
      formatDate(row, ['created', 'Created', 'created_date', 'Created Date']),
      formatDate(row, ['job_start_date', 'Job Start Date', 'JobStartDate', 'Start Date']),
      formatDate(row, ['closed_date', 'Closed Date', 'ClosedDate', 'Closed_Date'])
    ]);

    const sheetData = [headers, ...rows];

    await gapi.client.sheets.spreadsheets.values.clear({
      spreadsheetId: spreadsheetId,
      range: 'Sheet1!A1:Z'
    });

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
                backgroundColor: { red: 0.2, green: 0.6, blue: 0.86 },
                textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } }
              }
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat)'
          }
        }]
      }
    });

    const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
    console.log('CEIPAL Google Sheet updated successfully:', sheetUrl);
    return { spreadsheetId, sheetUrl, isNewSheet };

  } catch (error) {
    console.error('Error creating/updating CEIPAL Google Sheet:', error);
    throw error;
  }
};

// Create Google Sheet for CEIPAL data (legacy)
export const createCeipalGoogleSheet = async (data, fileName = 'CEIPAL_Data') => {
  try {
    console.log('Creating CEIPAL Google Sheet with data:', data.length, 'records');
    
    // Initialize APIs if not already done
    if (!gapiInited || !gisInited) {
      console.log('Initializing Google APIs...');
      await Promise.all([
        initializeGoogleAPI(),
        initializeGIS()
      ]);
      console.log('APIs initialized');
    }
    
    if (!gapi || !gapi.client) {
      throw new Error('Google API failed to initialize. Please refresh the page and try again.');
    }
    
    console.log('Google API initialized successfully');
    
    // Ensure authentication
    if (gapi.client.getToken() === null) {
      console.log('Requesting authentication...');
      await authenticate();
    }

    // Create spreadsheet
    const createResponse = await gapi.client.sheets.spreadsheets.create({
      properties: {
        title: `${fileName}_${new Date().toISOString().split('T')[0]}`
      }
    });

    const spreadsheetId = createResponse.result.spreadsheetId;
    console.log('Created spreadsheet:', spreadsheetId);

    // Prepare CEIPAL data
    const headers = [
      'Job Code',
      'Client', 
      'Department',
      'Project Name',
      'Account Size',
      'Demand',
      'Lost Positions',
      'Created Date',
      'Start Date',
      'Closed Date'
    ];
    
    const getFieldValue = (row, fieldNames) => {
      for (const fieldName of fieldNames) {
        if (row[fieldName] !== undefined && row[fieldName] !== null && row[fieldName] !== '') {
          return String(row[fieldName]);
        }
      }
      return '';
    };

    const formatDate = (row, fieldNames) => {
      const value = getFieldValue(row, fieldNames);
      if (!value) return '';
      try {
        const date = new Date(value);
        return isNaN(date.getTime()) ? value : date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
      } catch {
        return value;
      }
    };

    const rows = data.map(row => [
      getFieldValue(row, ['job_code', 'Job Code', 'JobCode', 'Job_Code']),
      getFieldValue(row, ['client', 'Client', 'CLIENT']),
      getFieldValue(row, ['department', 'Department', 'DEPARTMENT']),
      getFieldValue(row, ['project_name', 'Project Name', 'ProjectName', 'Project_Name']),
      getFieldValue(row, ['number_of_positions', 'Number of Positions', 'NumberOfPositions', 'Positions']),
      getFieldValue(row, ['number_of_positions', 'Number of Positions', 'NumberOfPositions', 'Positions']),
      getFieldValue(row, ['closed_date', 'Closed Date', 'ClosedDate', 'Closed_Date']) ? '1' : '0',
      formatDate(row, ['created', 'Created', 'created_date', 'Created Date']),
      formatDate(row, ['job_start_date', 'Job Start Date', 'JobStartDate', 'Start Date']),
      formatDate(row, ['closed_date', 'Closed Date', 'ClosedDate', 'Closed_Date'])
    ]);

    const sheetData = [headers, ...rows];
    console.log('CEIPAL sheet data prepared:', sheetData.length, 'rows');

    // Add data to spreadsheet
    await gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: 'A1',
      valueInputOption: 'RAW',
      resource: {
        values: sheetData
      }
    });

    console.log('Data added successfully');

    // Format header row
    await gapi.client.sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetId,
      resource: {
        requests: [{
          repeatCell: {
            range: {
              sheetId: 0,
              startRowIndex: 0,
              endRowIndex: 1
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.2, green: 0.6, blue: 0.86 },
                textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } }
              }
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat)'
          }
        }]
      }
    });

    // Set sharing permissions - anyone with link can view
    try {
      await gapi.client.request({
        path: `https://www.googleapis.com/drive/v3/files/${spreadsheetId}/permissions`,
        method: 'POST',
        body: {
          role: 'reader',
          type: 'anyone'
        }
      });
      console.log('CEIPAL sheet set to public (anyone with link can view)');
    } catch (permError) {
      console.warn('Could not set public permissions:', permError);
    }

    const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
    console.log('CEIPAL Google Sheet created successfully:', sheetUrl);
    return { spreadsheetId, sheetUrl };

  } catch (error) {
    console.error('Error creating CEIPAL Google Sheet:', error);
    throw error;
  }
};


// Create or update static Google Sheet for all employees
export const createOrUpdateAllEmployeesSheet = async (data) => {
  try {
    console.log('Creating/Updating All Employees Google Sheet with data:', data.length, 'employees');

    const g = window.gapi;
    if (!g) throw new Error('Google API script not loaded. Please refresh the page.');

    // Init gapi client if not already done
    if (!g.client?.sheets) {
      await new Promise((resolve, reject) => {
        g.load('client', async () => {
          try {
            await g.client.init({ discoveryDocs: [DISCOVERY_DOC] });
            resolve();
          } catch (e) { reject(e); }
        });
      });
    }

    // Init GIS token client if not already done
    if (!window.tokenClient && window.google) {
      window.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '',
      });
    }

    // Authenticate if no token
    if (!g.client.getToken()) {
      await new Promise((resolve, reject) => {
        window.tokenClient.callback = (resp) => {
          if (resp.error) reject(new Error(resp.error));
          else resolve(resp);
        };
        window.tokenClient.requestAccessToken({ prompt: 'consent' });
      });
    }

    // Check if we have an existing sheet ID
    let spreadsheetId = await getSheetIdFromServer(STATIC_SHEET_ID_KEY);
    let isNewSheet = false;

    if (!spreadsheetId) {
      const createResponse = await g.client.sheets.spreadsheets.create({
        properties: { title: 'SprintHub_All_Employees_Data' }
      });
      spreadsheetId = createResponse.result.spreadsheetId;
      await saveSheetIdToServer(STATIC_SHEET_ID_KEY, spreadsheetId);
      isNewSheet = true;
      console.log('Created new spreadsheet:', spreadsheetId);
      try {
        await g.client.request({
          path: `https://www.googleapis.com/drive/v3/files/${spreadsheetId}/permissions`,
          method: 'POST',
          body: { role: 'reader', type: 'anyone' }
        });
      } catch (permError) {
        console.warn('Could not set public permissions:', permError);
      }
    } else {
      console.log('Using existing spreadsheet:', spreadsheetId);
    }

    const headers = [
      'Employee ID', 'Employee Name', 'Email', 'Designation', 'Location',
      'Allocation Status', 'Employment Type', 'Date of Joining', 'Experience',
      'Skills', 'Project Name', 'Client Name'
    ];

    const rows = data.map(emp => [
      emp.employeeId || '',
      emp.employeeName || '',
      emp.emailId || '',
      emp.designation || '',
      emp.employeeLocation || '',
      emp.employeeAllocationDataDTO?.allocationStatus || '',
      emp.employmentType || '',
      emp.dateOfJoining ? new Date(emp.dateOfJoining).toLocaleDateString() : '',
      emp.totalExperience || emp.previousExperience || '',
      emp.employeeSkills || '',
      emp.employeeAllocationDataDTO?.project?.projectName || '',
      emp.employeeAllocationDataDTO?.parentAccount?.accountName || ''
    ]);

    // Try clear+write; if 403 (sheet owned by different account), create a fresh one
    const writeToSheet = async (id) => {
      await g.client.sheets.spreadsheets.values.clear({ spreadsheetId: id, range: 'Sheet1!A1:Z' });
      await g.client.sheets.spreadsheets.values.update({
        spreadsheetId: id, range: 'A1', valueInputOption: 'RAW',
        resource: { values: [headers, ...rows] }
      });
      await g.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: id,
        resource: {
          requests: [{ repeatCell: {
            range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1 },
            cell: { userEnteredFormat: { backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 }, textFormat: { bold: true } } },
            fields: 'userEnteredFormat(backgroundColor,textFormat)'
          }}]
        }
      });
    };

    try {
      await writeToSheet(spreadsheetId);
    } catch (writeErr) {
      const status = writeErr?.status || writeErr?.result?.error?.code;
      if (status === 403 && !isNewSheet) {
        // Stored sheet belongs to a different Google account — create a new one
        console.warn('403 on existing sheet, creating new one for current account...');
        const createResponse = await g.client.sheets.spreadsheets.create({
          properties: { title: 'SprintHub_All_Employees_Data' }
        });
        spreadsheetId = createResponse.result.spreadsheetId;
        await saveSheetIdToServer(STATIC_SHEET_ID_KEY, spreadsheetId);
        isNewSheet = true;
        try {
          await g.client.request({
            path: `https://www.googleapis.com/drive/v3/files/${spreadsheetId}/permissions`,
            method: 'POST',
            body: { role: 'reader', type: 'anyone' }
          });
        } catch (_) {}
        await writeToSheet(spreadsheetId);
      } else {
        throw writeErr;
      }
    }

    const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
    console.log('Google Sheet updated successfully:', sheetUrl);
    return { spreadsheetId, sheetUrl, isNewSheet };

  } catch (error) {
    console.error('Error creating/updating Google Sheet:', error);
    const msg = error?.result?.error?.message || error?.message || String(error);
    throw new Error(msg);
  }
};
