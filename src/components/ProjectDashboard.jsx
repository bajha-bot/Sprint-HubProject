import React, { useState, useEffect } from 'react';
import { getProjectPlanSheetUrl } from '../utils/projectPlanSheetService';

const ProjectDashboard = ({ projectName }) => {
  const [sheetData, setSheetData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSprints: 0,
    completedSprints: 0,
    inProgressSprints: 0,
    totalStoryPoints: 0,
    healthGreen: 0,
    healthRed: 0,
    healthYellow: 0,
    billableCount: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const sheetUrl = getProjectPlanSheetUrl(projectName);
        
        if (!sheetUrl) {
          setLoading(false);
          return;
        }

        const spreadsheetId = sheetUrl.split('/d/')[1]?.split('/')[0];
        const apiKey = 'AIzaSyAXU_abdTN3N-6Nv78KbQjht0QKl1xd9Eo';
        const range = 'Sheet1!A2:O100';
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.values) {
          const data = result.values.filter(row => row[0] || row[1]);
          setSheetData(data);
          
          const newStats = {
            totalSprints: data.length,
            completedSprints: data.filter(row => row[6]?.toLowerCase() === 'completed').length,
            inProgressSprints: data.filter(row => row[6]?.toLowerCase() === 'inprogress').length,
            totalStoryPoints: data.reduce((sum, row) => {
              const points = parseInt(row[3]?.match(/\d+/)?.[0] || 0);
              return sum + points;
            }, 0),
            healthGreen: data.filter(row => row[4]?.toLowerCase() === 'green').length,
            healthRed: data.filter(row => row[4]?.toLowerCase() === 'red').length,
            healthYellow: data.filter(row => row[4]?.toLowerCase() === 'yellow').length,
            billableCount: data.filter(row => row[5]?.toLowerCase() === 'billable').length
          };
          setStats(newStats);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectName]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <h2 style={{ marginBottom: '30px', color: '#2a89ac' }}>{projectName} - Dashboard</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h5 style={{ color: '#666', marginBottom: '10px' }}>Total Sprints</h5>
          <h2 style={{ color: '#2a89ac', margin: 0 }}>{stats.totalSprints}</h2>
        </div>
        
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h5 style={{ color: '#666', marginBottom: '10px' }}>Completed</h5>
          <h2 style={{ color: '#28a745', margin: 0 }}>{stats.completedSprints}</h2>
        </div>
        
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h5 style={{ color: '#666', marginBottom: '10px' }}>In Progress</h5>
          <h2 style={{ color: '#ffc107', margin: 0 }}>{stats.inProgressSprints}</h2>
        </div>
        
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h5 style={{ color: '#666', marginBottom: '10px' }}>Total Story Points</h5>
          <h2 style={{ color: '#6f42c1', margin: 0 }}>{stats.totalStoryPoints}</h2>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h5 style={{ marginBottom: '15px' }}>Health Status</h5>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#28a745', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '24px', fontWeight: 'bold', margin: '0 auto 10px' }}>
                {stats.healthGreen}
              </div>
              <span>Green</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#ffc107', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '24px', fontWeight: 'bold', margin: '0 auto 10px' }}>
                {stats.healthYellow}
              </div>
              <span>Yellow</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#dc3545', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '24px', fontWeight: 'bold', margin: '0 auto 10px' }}>
                {stats.healthRed}
              </div>
              <span>Red</span>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h5 style={{ marginBottom: '15px' }}>Billable Status</h5>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ color: '#2a89ac', margin: '20px 0' }}>{stats.billableCount}/{stats.totalSprints}</h1>
            <p style={{ color: '#666', margin: 0 }}>Billable Sprints</p>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h5 style={{ marginBottom: '15px' }}>Recent Sprint Data</h5>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>Sprint</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Story Points</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Health</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>% Complete</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Assigned To</th>
              </tr>
            </thead>
            <tbody>
              {sheetData.slice(0, 10).map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '10px' }}>{row[1] || '-'}</td>
                  <td style={{ padding: '10px' }}>{row[3] || '-'}</td>
                  <td style={{ padding: '10px' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      backgroundColor: row[4]?.toLowerCase() === 'green' ? '#d4edda' : row[4]?.toLowerCase() === 'red' ? '#f8d7da' : '#fff3cd',
                      color: row[4]?.toLowerCase() === 'green' ? '#155724' : row[4]?.toLowerCase() === 'red' ? '#721c24' : '#856404'
                    }}>
                      {row[4] || '-'}
                    </span>
                  </td>
                  <td style={{ padding: '10px' }}>{row[6] || '-'}</td>
                  <td style={{ padding: '10px' }}>{row[7] || '-'}</td>
                  <td style={{ padding: '10px' }}>{row[12] || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProjectDashboard;
