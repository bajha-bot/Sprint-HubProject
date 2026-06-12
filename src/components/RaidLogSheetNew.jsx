import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { initializeGoogleAPI, initializeGIS, authenticate } from '../utils/googleSheetsService';
import {
  createRaidLogSheet,
  getRaidLogSheetUrl,
  getRaidConsolidatedSheetUrl,
  syncRaidConsolidatedSheet,
  createRaidConsolidatedSheet,
} from '../utils/raidLogSheetService';
import { updateFileLinkByName } from '../features/createFolderFilesSlice';

const RaidLogSheetNew = ({ projectName, clientName, readOnly = false }) => {
  const [sheetUrl, setSheetUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [consolidatedUrl, setConsolidatedUrl] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    getRaidConsolidatedSheetUrl().then(setConsolidatedUrl);
  }, [sheetUrl]);

  const handleSync = async () => {
    try {
      setSyncing(true);
      await syncRaidConsolidatedSheet();
      alert('✅ RAID Log consolidated sheet updated successfully!');
    } catch (err) {
      alert('Sync failed: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncRef = useRef(handleSync);
  useEffect(() => { handleSyncRef.current = handleSync; }, [syncing]);

  useEffect(() => {
    const initializeSheet = async () => {
      try {
        setLoading(true);
        setError(null);

        const existingUrl = await getRaidLogSheetUrl(projectName);
        if (existingUrl) {
          setSheetUrl(existingUrl);
          setLoading(false);
          return;
        }

        if (readOnly) {
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

        const result = await createRaidLogSheet(projectName, window.gapi);
        setSheetUrl(result.sheetUrl);
        setIsNew(result.isNew);
        dispatch(updateFileLinkByName({ projectName, url: result.sheetUrl }));
        if (result.isNew && result.sheetUrl) {
          window.open(result.sheetUrl, '_blank');
        }
      } catch (err) {
        console.error('Error initializing RAID log sheet:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (projectName) initializeSheet();
  }, [projectName]);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '20px' }}>
      <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
        <span className="visually-hidden">Loading...</span>
      </div>
      <p style={{ marginTop: '20px', fontSize: '1.1rem' }}>
        {readOnly ? 'Loading RAID log...' : `Creating RAID log for ${projectName}...`}
      </p>
    </div>
  );

  if (error) return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h4>Error</h4>
        <p>{error}</p>
      </div>
      <button onClick={() => window.location.reload()}
        style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
        Refresh Page
      </button>
    </div>
  );

  if (readOnly && !sheetUrl) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px', textAlign: 'center' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
      <h4 style={{ color: '#1e3a5f', marginBottom: '8px' }}>{projectName} - RAID Log</h4>
      <p style={{ color: '#6b7280', fontSize: '14px' }}>No RAID log sheet found for this project.<br />Please open this project from the Analytics section to create one.</p>
    </div>
  );

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '15px', backgroundColor: '#f5f5f5', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>{projectName} - RAID Log</h3>
        {!readOnly && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <button onClick={handleSync} disabled={syncing}
                style={{ padding: '8px 16px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', fontSize: '14px', cursor: syncing ? 'not-allowed' : 'pointer' }}>
                {syncing ? 'Syncing...' : '🔄 Sync to Consolidated'}
              </button>
            </div>
            {consolidatedUrl && (
              <a href={consolidatedUrl} target="_blank" rel="noopener noreferrer"
                style={{ padding: '8px 16px', backgroundColor: '#28a745', color: 'white', textDecoration: 'none', borderRadius: '4px', fontSize: '14px' }}>
                View All Projects
              </a>
            )}
            <a href={sheetUrl} target="_blank" rel="noopener noreferrer"
              style={{ padding: '8px 16px', backgroundColor: '#2a89ac', color: 'white', textDecoration: 'none', borderRadius: '4px', fontSize: '14px' }}>
              Open in New Tab
            </a>
          </div>
        )}
      </div>
      {isNew && (
        <div style={{ padding: '15px', backgroundColor: '#fff3cd', borderBottom: '1px solid #ffc107' }}>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            <strong>Important:</strong> To sync changes to "All Projects", open the{' '}
            {consolidatedUrl && <a href={consolidatedUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc' }}>consolidated RAID log sheet</a>} and click "Allow access".
          </p>
        </div>
      )}
      {sheetUrl && (
        <div style={{ position: 'relative', flex: 1, width: '100%', minHeight: 0, overflow: 'auto' }}>
          <iframe
            key={sheetUrl}
            src={readOnly ? sheetUrl.replace('/edit', '/preview') : sheetUrl.includes('?') ? sheetUrl + '&embedded=true' : sheetUrl + '?embedded=true'}
            style={{ width: '100%', height: '100%', minHeight: '600px', border: 'none', display: 'block' }}
            title={`${projectName} RAID Log`}
          />
          {readOnly && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, cursor: 'not-allowed', pointerEvents: 'none' }} />
          )}
        </div>
      )}
    </div>
  );
};

export default RaidLogSheetNew;
