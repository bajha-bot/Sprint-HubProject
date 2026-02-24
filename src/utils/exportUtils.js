// Function to export data directly to Google Sheets using API
export const exportToGoogleSheetsAPI = async (projectStats, projectName, clientName, projectEmployees) => {
  try {
    const { createGoogleSheet } = await import('./googleSheetsAPI.js');
    const spreadsheetId = await createGoogleSheet(projectStats, projectName, clientName, projectEmployees);
    const sheetLink = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
    
    alert(`Google Sheet created successfully! Link: ${sheetLink}`);
    console.log('Google Sheet Link:', sheetLink);
    
    return sheetLink;
  } catch (error) {
    console.error('Failed to create Google Sheet:', error);
    // Fallback to CSV download
    exportToGoogleSheets(projectStats, projectName, clientName, projectEmployees);
    throw error;
  }
};

// Function to export data directly to Google Sheets
export const exportToGoogleSheets = (projectStats, projectName, clientName, projectEmployees) => {
  // Get unique employees by employeeId for this specific project
  const uniqueEmployees = projectEmployees.reduce((acc, employee) => {
    const empId = employee.employeeId;
    if (!acc[empId]) {
      acc[empId] = employee;
    }
    return acc;
  }, {});

  const employees = Object.values(uniqueEmployees);

  // Create CSV data same as exportToCSV
  const csvData = [
    ['*** PROJECT DASHBOARD DATA ***'],
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

  const csvContent = csvData.map(row => 
    row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
  ).join('\n');
  
  // Download CSV file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${projectName}_${clientName}_for_sheets.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Open Google Sheets and show instructions
  setTimeout(() => {
    window.open('https://docs.google.com/spreadsheets/create', '_blank');
    alert('CSV downloaded! In Google Sheets: File → Import → Upload → Select the downloaded CSV file');
  }, 500);
};

// Utility function to export data to CSV format for Google Sheets
export const exportToCSV = (projectStats, projectName, clientName, projectEmployees) => {
  // Get unique employees by employeeId for this specific project
  const uniqueEmployees = projectEmployees.reduce((acc, employee) => {
    const empId = employee.employeeId;
    if (!acc[empId]) {
      acc[empId] = employee;
    }
    return acc;
  }, {});

  const employees = Object.values(uniqueEmployees);

  const csvData = [
    ['*** PROJECT DASHBOARD DATA ***'],
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
      `="${emp.employeeId || ''}"`, // Force text format for Employee ID
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

  const csvContent = csvData.map(row => 
    row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
  ).join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${projectName}_${clientName}_complete.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Function to copy data to clipboard for pasting into Google Sheets
export const copyToClipboard = (projectStats, projectName, clientName, projectEmployees) => {
  // Get unique employees by employeeId for this specific project
  const uniqueEmployees = projectEmployees.reduce((acc, employee) => {
    const empId = employee.employeeId;
    if (!acc[empId]) {
      acc[empId] = employee;
    }
    return acc;
  }, {});

  const employees = Object.values(uniqueEmployees);

  const statsData = [
    `Project Dashboard Data`,
    `Project Name\t${projectName}`,
    `Client Name\t${clientName}`,
    ``,
    `Metric\tCount`,
    `Total Employees\t${projectStats.totalEmployees}`,
    `Billable\t${projectStats.billable}`,
    `Confirmed\t${projectStats.confirmed}`,
    `Reserved\t${projectStats.reserved}`,
    `Shadow\t${projectStats.shadow}`,
    `Bench/Available\t${projectStats.bench}`,
    `BackFill Positions\t${projectStats.backfill}`,
    `Demand\t${projectStats.demand}`,
    `Fulfillment\t${projectStats.fulfillment}`,
    `Lost Positions\t${projectStats.lost}`,
    ``,
    `Employee Details`
  ];

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
  ].join('\t');

  const rows = employees.map(emp => [
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
  ].join('\t'));

  const data = [...statsData, headers, ...rows].join('\n');

  navigator.clipboard.writeText(data).then(() => {
    alert(`Project data with ${employees.length} unique employee records copied to clipboard!`);
  }).catch(err => {
    console.error('Failed to copy data: ', err);
  });
};

// Function to export all employee details to CSV
export const exportAllEmployeesToCSV = (employeeData) => {
  if (!employeeData?.records) return;

  // Get unique employees by employeeId
  const uniqueEmployees = employeeData.records.reduce((acc, employee) => {
    const empId = employee.employeeId;
    if (!acc[empId]) {
      acc[empId] = employee;
    }
    return acc;
  }, {});

  const employees = Object.values(uniqueEmployees);

  const csvData = [
    [
      'Employee ID',
      'Employee Name', 
      'Email',
      'Designation',
      'Location',
      'Client',
      'Project Name',
      'Allocation Status',
      'Employment Type',
      'Date of Joining',
      'Experience',
      'Skills'
    ],
    ...employees.map(emp => [
      emp.employeeId || '',
      emp.employeeName || '',
      emp.emailId || '',
      emp.designation || '',
      emp.employeeLocation || '',
      emp.employeeAllocationDataDTO?.parentAccount?.accountName || 'Unassigned',
      emp.employeeAllocationDataDTO?.project?.projectName || '',
      emp.employeeAllocationDataDTO?.allocationStatus || '',
      emp.employmentType || '',
      emp.dateOfJoining ? new Date(emp.dateOfJoining).toLocaleDateString() : '',
      emp.totalExperience || emp.previousExperience || '',
      emp.employeeSkills || ''
    ])
  ];

  const csvContent = csvData.map(row => 
    row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
  ).join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `all_employees_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Function to copy all employee details to clipboard
export const copyAllEmployeesToClipboard = (employeeData) => {
  if (!employeeData?.records) return;

  // Get unique employees by employeeId
  const uniqueEmployees = employeeData.records.reduce((acc, employee) => {
    const empId = employee.employeeId;
    if (!acc[empId]) {
      acc[empId] = employee;
    }
    return acc;
  }, {});

  const employees = Object.values(uniqueEmployees);

  const headers = [
    'Employee ID',
    'Employee Name', 
    'Email',
    'Designation',
    'Location',
    'Client',
    'Project Name',
    'Allocation Status',
    'Employment Type',
    'Date of Joining',
    'Experience',
    'Skills'
  ].join('\t');

  const rows = employees.map(emp => [
    emp.employeeId || '',
    emp.employeeName || '',
    emp.emailId || '',
    emp.designation || '',
    emp.employeeLocation || '',
    emp.employeeAllocationDataDTO?.parentAccount?.accountName || 'Unassigned',
    emp.employeeAllocationDataDTO?.project?.projectName || '',
    emp.employeeAllocationDataDTO?.allocationStatus || '',
    emp.employmentType || '',
    emp.dateOfJoining ? new Date(emp.dateOfJoining).toLocaleDateString() : '',
    emp.totalExperience || emp.previousExperience || '',
    emp.employeeSkills || ''
  ].join('\t'));

  const data = [headers, ...rows].join('\n');

  navigator.clipboard.writeText(data).then(() => {
    alert(`${employees.length} unique employee records copied to clipboard! You can now paste into Google Sheets.`);
  }).catch(err => {
    console.error('Failed to copy data: ', err);
  });
};

// Function to export all projects for a specific client to CSV
export const exportClientProjectsToCSV = (clientName, allEmployees) => {
  const csvData = [
    [`*** ${clientName.toUpperCase()} - ALL PROJECTS DATA ***`],
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
    ]
  ];

  // Get all employees for this client across all projects
  const clientEmployees = allEmployees.filter(emp => 
    emp.employeeAllocationDataDTO?.parentAccount?.accountName === clientName
  );

  // Get unique employees by employeeId
  const uniqueEmployees = clientEmployees.reduce((acc, employee) => {
    const empId = employee.employeeId;
    if (!acc[empId]) {
      acc[empId] = employee;
    }
    return acc;
  }, {});

  const employees = Object.values(uniqueEmployees);

  // Add employee data
  csvData.push(
    ...employees.map(emp => [
      `="${emp.employeeId || ''}"`,
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
      clientName
    ])
  );

  const csvContent = csvData.map(row => 
    row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
  ).join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${clientName}_all_projects_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};