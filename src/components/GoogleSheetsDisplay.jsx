import React, { useEffect, useState } froimport React, { useEffect, useState } from 'react';
import useGetAllEmployees from '../hooks/useGetAllEmployees';
import { initializeGoogleAPI, initializeGIS, createGoogleSheetWithData } from '../utils/googleSheetsService';

const GoogleSheetsDisplay = () => {
  const { data, loading, error } = useGetAllEmployees();
  const [isGoogleReady, setIsGoogleReady] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [sheetUrl, setSheetUrl] = useState(null);

  useEffect(() => {
    const initGoogle = async () => {
      try {
        await Promise.all([
          initializeGoogleAPI(),
          initializeGIS()
        ]);
        setIsGoogleReady(true);
      } catch (err) {
        console.error('Failed to initialize Google APIs:', err);
      }
    };

    // Wait for scripts to load
    setTimeout(initGoogle, 1000);
  }, []);

  if (loading) return <div>Loading employee data...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data || !data.records) return <div>No data available</div>;

  const employees = data.records;

  const createGoogleSheet = async () => {
    console.log('Creating Google Sheet clicked');
    setIsCreating(true);
    
    try {
      if (!isGoogleReady) {
        // Fallback to CSV approach if API not ready
        const csvData = [
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
            emp.employeeAllocationDataDTO?.project?.projectName || '',
            emp.employeeAllocationDataDTO?.parentAccount?.accountName || ''
          ])
        ];

        const csvContent = csvData.map(row => 
          row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
        ).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `employees_for_sheets_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setTimeout(() => {
          window.open('https://docs.google.com/spreadsheets/create', '_blank');
          alert('CSV downloaded! In the new Google Sheet: File → Import → Upload → Select the downloaded CSV file');
        }, 500);
        return;
      }

      // Use Google Sheets API to create sheet directly
      const result = await createGoogleSheetWithData(
        employees, 
        `Employee_Data_${new Date().toISOString().split('T')[0]}`
      );
      
      setSheetUrl(result.sheetUrl);
      
      // Show success alert with link
      alert(`Google Sheet created successfully!\n\nClick OK to open:\n${result.sheetUrl}`);
      
      window.open(result.sheetUrl, '_blank');
      
    } catch (err) {
      console.error('Failed to create Google Sheet:', err);
      alert('Failed to create Google Sheet. Please check console for details.');
    } finally {
      setIsCreating(false);
    }
  };

  const exportToCSV = () => {
    const csvData = [
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
        emp.employeeAllocationDataDTO?.project?.projectName || '',
        emp.employeeAllocationDataDTO?.parentAccount?.accountName || ''
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

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Employee Data Export</h2>
        <div>
          <button 
            onClick={createGoogleSheet}
            disabled={isCreating}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: isCreating ? '#ccc' : '#0F9D58', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: isCreating ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              marginRight: '10px'
            }}
          >
            {isCreating ? '⏳ Creating...' : '📋 Export to Google Sheets'}
          </button>
          <button 
            onClick={exportToCSV}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#4CAF50', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            📊 Export Stats CSV
          </button>
        </div>
      </div>
      
      {sheetUrl && (
        <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#e8f5e8', borderRadius: '4px', border: '1px solid #4CAF50' }}>
          <strong>Google Sheet Created:</strong>
          <a href={sheetUrl} target="_blank" rel="noopener noreferrer" style={{ marginLeft: '10px', color: '#0F9D58' }}>
            {sheetUrl}
          </a>
        </div>
      )}
      
      <div style={{ marginBottom: '20px' }}>
        <p><strong>Total Employees:</strong> {employees.length}</p>
        <p><strong>Google API Status:</strong> {isGoogleReady ? '✅ Ready (Direct Export)' : '⚠️ Fallback Mode (CSV + Import)'}</p>
      </div>
      
      <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f5f5f5', position: 'sticky', top: 0 }}>
            <tr>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Employee ID</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Name</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Email</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Designation</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Location</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Employment</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Project</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Client</th>
            </tr>
          </thead>
          <tbody>
            {employees.slice(0, 50).map((emp, index) => (
              <tr key={index}>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{emp.employeeId}</td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{emp.employeeName}</td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{emp.emailId}</td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{emp.designation}</td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{emp.employeeLocation}</td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                  {emp.employeeAllocationDataDTO?.allocationStatus || ''}
                </td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{emp.employmentType}</td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                  {emp.employeeAllocationDataDTO?.project?.projectName || ''}
                </td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                  {emp.employeeAllocationDataDTO?.parentAccount?.accountName || ''}
                </td>
              </tr>
            ))}}
          </tbody>
        </table>
        {employees.length > 50 && (
          <div style={{ padding: '10px', textAlign: 'center', backgroundColor: '#f9f9f9' }}>
            Showing first 50 employees. Export to see all {employees.length} records.
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleSheetsDisplay;