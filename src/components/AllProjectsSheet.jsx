import React, { useState, useEffect } from 'react';
import { initializeGoogleAPI, initializeGIS, authenticate } from '../utils/googleSheetsService';
import { createConsolidatedProjectSheet, getConsolidatedSheetUrl } from '../utils/projectPlanSheetService';
import useGetAllEmployees from '../hooks/useGetAllEmployees';

const AllProjectsSheet = () => {
  const [sheetUrl, setSheetUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { data: employeeData } = useGetAllEmployees();

  useEffect(() => {
    const initializeSheet = async () => {
      try {
        setLoading(true);
        setError(null);

        const existingUrl = getConsolidatedSheetUrl();
        if (existingUrl) {
          setSheetUrl(existingUrl);
          setLoading(false);
          return;
        }

        if (!window.gapi || !window.google) {
          throw new Error('Google APIs not loaded. Please refresh the page.');
        }

        await Promise.all([initializeGoogleAPI(), initializeGIS()]);

        if (window.gapi.client.getToken() === null) {
          await authenticate();
        }

        if (!employeeData?.records) {
          throw new Error('No employee data available');
        }

        const projects = [...new Set(employeeData.records
          .map(emp => emp.employeeAllocationDataDTO?.project?.projectName)
          .filter(p => p))];

        const result = await createConsolidatedProjectSheet(projects, window.gapi);
        setSheetUrl(result.sheetUrl);
      } catch (err) {
        console.error('Error initializing sheet:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (employeeData) {
      initializeSheet();
    }
  }, [employeeData]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: '20px' }}>
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p style={{ marginTop: '20px', fontSize: '1.1rem' }}>Creating consolidated project sheet...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          <h4>Error</h4>
          <p>{error}</p>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Refresh Page
        </button>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', backgroundColor: '#f8f9fa' }}>
      <div style={{ maxWidth: '700px', textAlign: 'center', backgroundColor: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginBottom: '20px', color: '#2a89ac' }}>All Projects - Consolidated View</h2>
        <p style={{ fontSize: '1.1rem', marginBottom: '30px', color: '#666' }}>
          View and manage all project plans in one consolidated Google Sheet. Each project has its own row with all the planning fields.
        </p>
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e7f3ff', borderRadius: '4px', fontSize: '0.9rem', color: '#004085' }}>
          <strong>Sheet ID:</strong> {sheetUrl?.split('/d/')[1]?.split('/')[0]}
          <br />
          <strong>Total Projects:</strong> {employeeData?.records ? [...new Set(employeeData.records.map(emp => emp.employeeAllocationDataDTO?.project?.projectName).filter(p => p))].length : 0}
        </div>
        <a 
          href={sheetUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ padding: '15px 30px', backgroundColor: '#2a89ac', color: 'white', textDecoration: 'none', borderRadius: '4px', fontSize: '18px', fontWeight: 'bold', display: 'inline-block' }}
        >
          Open All Projects Sheet
        </a>
        <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#fff3cd', borderRadius: '4px', fontSize: '0.9rem', color: '#856404', textAlign: 'left' }}>
          <strong>📋 How to use:</strong>
          <ol style={{ marginTop: '10px', marginBottom: 0, paddingLeft: '20px' }}>
            <li>Click "Open All Projects Sheet" to view the consolidated sheet</li>
            <li>Each row represents one project with all planning fields</li>
            <li>When you create individual project sheets, they sync to this consolidated view</li>
            <li>To enable sync: Click on #REF! cells and click "Allow access"</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default AllProjectsSheet;
