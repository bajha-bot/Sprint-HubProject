// Google Sheets API configuration
const GOOGLE_SHEETS_API_KEY = 'AIzaSyBvOkBwvFBHjlRtXXXXXXXXXXXXXXXXXXX'; // Replace with your API key
const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';

let gapi;

// Initialize Google API
export const initializeGoogleAPI = async () => {
  return new Promise((resolve) => {
    if (window.gapi) {
      gapi = window.gapi;
      gapi.load('client', async () => {
        try {
          await gapi.client.init({
            apiKey: GOOGLE_SHEETS_API_KEY,
            discoveryDocs: [DISCOVERY_DOC],
          });
          resolve(true);
        } catch (error) {
          console.error('Failed to initialize Google API:', error);
          resolve(false);
        }
      });
    } else {
      resolve(false);
    }
  });
};

// Create new spreadsheet with data
export const createGoogleSheet = async (projectStats, projectName, clientName, projectEmployees) => {
  try {
    // Initialize if not done
    if (!gapi) {
      const initialized = await initializeGoogleAPI();
      if (!initialized) {
        throw new Error('Google API not available');
      }
    }

    // Prepare data
    const uniqueEmployees = projectEmployees.reduce((acc, employee) => {
      const empId = employee.employeeId;
      if (!acc[empId]) {
        acc[empId] = employee;
      }
      return acc;
    }, {});

    const employees = Object.values(uniqueEmployees);

    const sheetData = [
      ['*** PROJECT DASHBOARD DATA ***'],
      ['Project Name', projectName],
      ['Client Name', clientName],
      [''],
      ['Metric', 'Count'],
      ['Total Employees', projectStats.totalEmployees],
      ['Billable', projectStats.billable],
      ['Confirmed', projectStats.confirmed],
      ['Reserved', projectStats.reserved],
      ['Shadow', projectStats.shadow],
      ['Bench/Available', projectStats.bench],
      ['BackFill Positions', projectStats.backfill],
      ['Demand', projectStats.demand],
      ['Fulfillment', projectStats.fulfillment],
      ['Lost Positions', projectStats.lost],
      [''],
      ['Employee Details'],
      [
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
      ],
      ...employees.map(emp => [
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
        emp.employeeAllocationDataDTO?.project?.projectName || projectName || '',
        emp.employeeAllocationDataDTO?.parentAccount?.accountName || clientName || ''
      ])
    ];

    // Create spreadsheet
    const response = await gapi.client.sheets.spreadsheets.create({
      properties: {
        title: `${projectName}_${clientName}_Dashboard`
      }
    });

    const spreadsheetId = response.result.spreadsheetId;

    // Add data to spreadsheet
    await gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: 'Sheet1!A1',
      valueInputOption: 'RAW',
      resource: {
        values: sheetData
      }
    });

    // Open the created spreadsheet
    window.open(`https://docs.google.com/spreadsheets/d/${spreadsheetId}`, '_blank');
    
    return spreadsheetId;
  } catch (error) {
    console.error('Error creating Google Sheet:', error);
    throw error;
  }
};