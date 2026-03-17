import React, { useEffect, useState } from 'react';

const FilteredGoogleSheet = ({ projectName }) => {
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentProject, setCurrentProject] = useState('');

  useEffect(() => {
    const fetchSheetData = async () => {
      try {
        setLoading(true);
        setCurrentProject(projectName);
        console.log('Fetching data for project:', projectName);
        
        const sheetId = '1tUO5g6odx8j1_wCYe6_qFrTc67p2PXPNVHlQ8iwhj3o';
        const apiKey = 'AIzaSyAXU_abdTN3N-6Nv78KbQjht0QKl1xd9Eo';
        const range = 'Sheet1!A:Z';
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.values && result.values.length > 0) {
          const headerRow = result.values[0];
          setHeaders(headerRow);
          
          const allRows = result.values.slice(1);
          
          const projectColIndex = headerRow.findIndex(h => 
            h && h.toLowerCase().includes('project')
          );
          
          if (projectColIndex !== -1) {
            const filteredRows = allRows.filter(row => {
              return row[projectColIndex] && row[projectColIndex].trim() === projectName.trim();
            });
            console.log('Filtered rows for', projectName, ':', filteredRows.length);
            setData(filteredRows);
          } else {
            setData(allRows);
          }
        }
      } catch (error) {
        console.error('Error fetching sheet data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (projectName) {
      // Reset data before fetching new project
      setData([]);
      fetchSheetData();
    }
  }, [projectName]);

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p>Loading {currentProject || projectName} project plan...</p>
      </div>
    );
  }

  // If no filtered data, show the Google Sheet iframe
  if (data.length === 0) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '15px', backgroundColor: '#fff3cd', borderBottom: '1px solid #ffc107' }}>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            <strong>Project:</strong> {projectName} - No matching data found in filtered view. Showing full sheet below.
          </p>
        </div>
        <iframe
          // src="https://docs.google.com/spreadsheets/d/1TRM5menlWcQyitaktNPJovhY9cVSNX1ofXYmT2kRp-o/edit?gid=0#gid=0"
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="Google Sheet"
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', overflow: 'auto', height: '100%' }}>
      <h3 style={{ marginBottom: '20px' }}>{currentProject || projectName} - Project Plan</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#2a89ac', color: 'white' }}>
              {headers.map((header, i) => (
                <th key={i} style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left', whiteSpace: 'nowrap' }}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#f9f9f9' : 'white' }}>
                {headers.map((_, j) => (
                  <td key={j} style={{ border: '1px solid #ddd', padding: '8px', whiteSpace: 'pre-wrap' }}>
                    {row[j] || ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f8ff', borderRadius: '4px' }}>
        <p style={{ margin: 0, fontSize: '0.85rem' }}>
          <strong>Note:</strong> Showing {data.length} row(s) for project "{currentProject || projectName}"
        </p>
      </div>
    </div>
  );
};

export default FilteredGoogleSheet;
