import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { initializeGoogleAPI, initializeGIS, authenticate } from '../utils/googleSheetsService';
import { createProjectPlanSheet, getProjectPlanSheetUrl, getConsolidatedSheetUrl, syncConsolidatedSheet } from '../utils/projectPlanSheetService';
import { updateFileLinkByName } from '../features/createFolderFilesSlice';

const ProjectPlanSheetNew = ({ projectName }) => {
  const [sheetUrl, setSheetUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isNew, setIsNew] = useState(false);

  const dispatch = useDispatch();
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    try {
      setSyncing(true);
      await syncConsolidatedSheet(window.gapi);
      alert('Consolidated sheet updated successfully! Check browser console (F12) for details.');
    } catch (err) {
      alert('Sync failed: ' + err.message + '\nCheck browser console (F12) for details.');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    const initializeSheet = async () => {
      try {
        setLoading(true);
        setError(null);

        const existingUrl = getProjectPlanSheetUrl(projectName);
        if (existingUrl) {
          console.log('Found existing sheet URL:', existingUrl);
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

        console.log('Creating new sheet for:', projectName);
        const result = await createProjectPlanSheet(projectName, window.gapi);
        setSheetUrl(result.sheetUrl);
        setIsNew(result.isNew);
        dispatch(updateFileLinkByName({ projectName, url: result.sheetUrl }));
        if (result.isNew && result.sheetUrl) {
          window.open(result.sheetUrl, '_blank');
        }
      } catch (err) {
        console.error('Error initializing sheet:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (projectName) {
      initializeSheet();
    }
  }, [projectName]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: '20px' }}>
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p style={{ marginTop: '20px', fontSize: '1.1rem' }}>Creating project plan for {projectName}...</p>
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

  const consolidatedUrl = getConsolidatedSheetUrl();

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '15px', backgroundColor: '#f5f5f5', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>{projectName} - Project Plan</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleSync}
            disabled={syncing}
            style={{ padding: '8px 16px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', fontSize: '14px', cursor: syncing ? 'not-allowed' : 'pointer' }}
          >
            {syncing ? 'Syncing...' : 'Sync to Consolidated'}
          </button>
          {consolidatedUrl && (
            <a 
              href={consolidatedUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ padding: '8px 16px', backgroundColor: '#28a745', color: 'white', textDecoration: 'none', borderRadius: '4px', fontSize: '14px' }}
            >
              View All Projects
            </a>
          )}
          <a 
            href={sheetUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ padding: '8px 16px', backgroundColor: '#2a89ac', color: 'white', textDecoration: 'none', borderRadius: '4px', fontSize: '14px' }}
          >
            Open in New Tab
          </a>
        </div>
      </div>
      {isNew && (
        <div style={{ padding: '15px', backgroundColor: '#fff3cd', borderBottom: '1px solid #ffc107' }}>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            <strong>Important:</strong> To sync changes to "All Projects", open the <a href={consolidatedUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc' }}>consolidated sheet</a>, find row 49 (BCI Bench), click on the #REF! cell, and click "Allow access".
          </p>
        </div>
      )}
      <div style={{ padding: '10px 15px', backgroundColor: '#d1ecf1', borderBottom: '1px solid #bee5eb', fontSize: '0.85rem', color: '#0c5460' }}>
        <strong>Sheet ID:</strong> {sheetUrl?.split('/d/')[1]?.split('/')[0]} - This is a separate sheet for {projectName} only
      </div>
      {sheetUrl && (
        <iframe 
          key={sheetUrl}
          src={sheetUrl}
          style={{ width: '100%', height: '100%', border: 'none', flex: 1 }}
          title={`${projectName} Project Plan`}
        />
      )}
    </div>
  );
};

export default ProjectPlanSheetNew;
