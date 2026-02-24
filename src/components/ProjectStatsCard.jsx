import React from 'react';
import useGetAllEmployees from '../hooks/useGetAllEmployees';
import { exportToCSV, copyToClipboard, exportAllEmployeesToCSV, copyAllEmployeesToClipboard, exportClientProjectsToCSV, exportToGoogleSheets, exportToGoogleSheetsAPI } from '../utils/exportUtils';
import './EmployeeStatsCard.css';
import { useAuth } from '../context/AuthContext';
import { canAccessProject, filterEmployeesByRole } from '../utils/roleBasedAccess';
import { CLIENT_SHEETS } from '../constants/roles';
import { ROLES } from '../constants/roles';

const ProjectStatsCard = ({ projectName, clientName }) => {
  const { data, loading, error } = useGetAllEmployees();
  const { user } = useAuth();

  // Check access
  if (user && !canAccessProject(user, clientName, projectName)) {
    return <div className="stats-card error">Access Denied: You don't have permission to view this project</div>;
  }

  const handleClientSheetOpen = () => {
    const sheetUrl = CLIENT_SHEETS[clientName];
    if (sheetUrl) {
      window.open(sheetUrl, '_blank');
    } else {
      alert('No sheet configured for this client');
    }
  };

  const handleGoogleSheetsExport = async () => {
    try {
      // Import the Google Sheets service
      const { createGoogleSheetWithData } = await import('../utils/googleSheetsService');
      
      // Prepare employee data
      const uniqueEmployees = projectEmployees.reduce((acc, employee) => {
        const empId = employee.employeeId;
        if (!acc[empId]) {
          acc[empId] = employee;
        }
        return acc;
      }, {});

      const employees = Object.values(uniqueEmployees);
      
      // Create Google Sheet with data automatically
      const result = await createGoogleSheetWithData(
        employees,
        `${projectName}_${clientName}_Dashboard`
      );
      
      // Show success alert with link
      alert(`Google Sheet created successfully!\n\nClick OK to open:\n${result.sheetUrl}`);
      
      // Open the created sheet
      window.open(result.sheetUrl, '_blank');
      
    } catch (error) {
      console.error('Google Sheets API failed:', error);
      
      // Fallback: CSV download approach
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
        ['Project Name', projectName],
        ['Client Name', clientName],
        [''],
        ['Employee ID', 'Employee Name', 'Email', 'Designation', 'Location', 'Allocation Status', 'Employment Type', 'Date of Joining', 'Experience', 'Skills', 'Project Name', 'Client Name'],
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
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${projectName}_${clientName}_complete.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => {
        window.open('https://docs.google.com/spreadsheets/create', '_blank');
        alert('Google Sheets API not configured. CSV downloaded! In Google Sheets: File → Import → Upload → Select the downloaded CSV file');
      }, 500);
    }
  };

  const handleAllEmployeesStaticSheetExport = async () => {
    if (!user) return;
    
    try {
      const { createOrUpdateAllEmployeesSheet } = await import('../utils/googleSheetsService');
      
      // Filter employees based on role
      const filteredRecords = filterEmployeesByRole(user, data.records);
      
      const uniqueEmployees = filteredRecords.reduce((acc, employee) => {
        const empId = employee.employeeId;
        if (!acc[empId]) {
          acc[empId] = employee;
        }
        return acc;
      }, {});

      const employees = Object.values(uniqueEmployees);
      
      const result = await createOrUpdateAllEmployeesSheet(employees);
      
      const message = result.isNewSheet 
        ? `Static Google Sheet created successfully!\n\nThis link will remain the same for future updates.\n\nClick OK to open:\n${result.sheetUrl}`
        : `Google Sheet updated successfully!\n\nSame link as before - data refreshed.\n\nClick OK to open:\n${result.sheetUrl}`;
      
      alert(message);
      window.open(result.sheetUrl, '_blank');
      
    } catch (error) {
      console.error('Google Sheets API failed:', error);
      alert('Failed to create/update Google Sheet. Please try again.');
    }
  };

  const handleClientProjectsGoogleSheetsExport = async () => {
    if (!user) return;
    
    try {
      const { createClientProjectsGoogleSheet } = await import('../utils/googleSheetsService');
      
      // Filter employees based on role
      const filteredRecords = filterEmployeesByRole(user, data.records);
      
      const result = await createClientProjectsGoogleSheet(clientName, filteredRecords);
      
      alert(`Google Sheet created successfully!\n\nClick OK to open:\n${result.sheetUrl}`);
      window.open(result.sheetUrl, '_blank');
      
    } catch (error) {
      console.error('Google Sheets API failed:', error);
      alert('Failed to create Google Sheet. Falling back to CSV export.');
      exportClientProjectsToCSV(clientName, filterEmployeesByRole(user, data.records));
    }
  };

  if (loading) return <div className="stats-card loading">Loading...</div>;
  if (error) return <div className="stats-card error">Error: {error}</div>;
  if (!data || !data.records) return <div className="stats-card">No data available</div>;

  // Filter employees for the specific project and client
  const projectEmployees = data.records.filter(employee => {
    const allocation = employee.employeeAllocationDataDTO;
    return allocation?.project?.projectName === projectName && 
           allocation?.parentAccount?.accountName === clientName;
  });

  // Calculate statistics for this specific project
  const projectStats = projectEmployees.reduce((acc, employee) => {
    const status = employee.employeeAllocationDataDTO?.allocationStatus || 'UNKNOWN';
    
    acc.totalEmployees++;
    
    switch (status) {
      case 'BILLABLE':
        acc.billable++;
        break;
      case 'CONFIRMED':
        acc.confirmed++;
        break;
      case 'RESERVED':
        acc.reserved++;
        break;
      case 'SHADOW':
        acc.shadow++;
        break;
      case 'AVAILABLE':
        acc.bench++;
        break;
      case 'BACKFILL':
        acc.backfill++;
        break;
      case 'DEMAND':
        acc.demand++;
        break;
      case 'FULFILLMENT':
        acc.fulfillment++;
        break;
      case 'LOST':
        acc.lost++;
        break;
    }

    return acc;
  }, {
    totalEmployees: 0,
    billable: 0,
    confirmed: 0,
    reserved: 0,
    shadow: 0,
    bench: 0,
    backfill: 0,
    demand: 0,
    fulfillment: 0,
    lost: 0
  });

  return (
    <div className="stats-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h2 className="stats-title">Project Dashboard: {projectName}</h2>
          <h3 className="client-name">Client: {clientName}</h3>
        </div>
        <div>
          {user && user.role === ROLES.EMPLOYEE && (
            <>
              <button 
                onClick={handleGoogleSheetsExport}
                style={{ marginRight: '10px', padding: '8px 16px', backgroundColor: '#0F9D58', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                📋 Export My Project Sheet
              </button>
            </>
          )}
          
          {user && user.role === ROLES.CCL && (
            <>
              {/* <button 
                onClick={handleClientSheetOpen}
                style={{ marginRight: '10px', padding: '8px 16px', backgroundColor: '#0F9D58', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                📋 Open Client Sheet
              </button> */}
              <button 
                onClick={handleClientProjectsGoogleSheetsExport}
                style={{ marginRight: '10px', padding: '8px 16px', backgroundColor: '#34A853', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                📊 Client Projects to Sheets
              </button>
            </>
          )}
          
          {user && (user.role === ROLES.CDH || user.role === ROLES.ADMIN) && (
            <>
              {/* <button 
                onClick={handleClientSheetOpen}
                style={{ marginRight: '10px', padding: '8px 16px', backgroundColor: '#0F9D58', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                📋 Open Client Sheet
              </button> */}
              <button 
                onClick={handleGoogleSheetsExport}
                style={{ marginRight: '10px', padding: '8px 16px', backgroundColor: '#0F9D58', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                📋 Export Project Sheet
              </button>
              <button 
                onClick={handleAllEmployeesStaticSheetExport}
                style={{ marginRight: '10px', padding: '8px 16px', backgroundColor: '#1a73e8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                🔗 All Employees to Static Sheet
              </button>
              <button 
                onClick={handleClientProjectsGoogleSheetsExport}
                style={{ marginRight: '10px', padding: '8px 16px', backgroundColor: '#34A853', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                📊 Client Projects to Sheets
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-label">Total Employees</span>
          <span className="stat-value">{projectStats.totalEmployees}</span>
        </div>
        
        <div className="stat-item">
          <span className="stat-label">Billable</span>
          <span className="stat-value">{projectStats.billable}</span>
        </div>
        
        <div className="stat-item">
          <span className="stat-label">Confirmed</span>
          <span className="stat-value">{projectStats.confirmed}</span>
        </div>
        
        <div className="stat-item">
          <span className="stat-label">Reserved</span>
          <span className="stat-value">{projectStats.reserved}</span>
        </div>
        
        <div className="stat-item">
          <span className="stat-label">Shadow</span>
          <span className="stat-value">{projectStats.shadow}</span>
        </div>
        
        <div className="stat-item">
          <span className="stat-label">Bench/Available</span>
          <span className="stat-value">{projectStats.bench}</span>
        </div>
        
        <div className="stat-item">
          <span className="stat-label">BackFill Positions</span>
          <span className="stat-value">{projectStats.backfill}</span>
        </div>
        
        <div className="stat-item">
          <span className="stat-label">Demand</span>
          <span className="stat-value">{projectStats.demand}</span>
        </div>
        
        <div className="stat-item">
          <span className="stat-label">Fulfillment</span>
          <span className="stat-value">{projectStats.fulfillment}</span>
        </div>
        
        <div className="stat-item">
          <span className="stat-label">Lost Positions</span>
          <span className="stat-value">{projectStats.lost}</span>
        </div>
      </div>
    </div>
  );
};

export default ProjectStatsCard;