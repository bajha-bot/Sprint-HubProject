import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import './CeipalDetails.css';

const CeipalDetails = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [staticSheetUrl, setStaticSheetUrl] = useState(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setError('');
    setFileName(file.name);
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length === 0) {
          setError('The Excel file appears to be empty or has no valid data.');
          setData([]);
        } else {
          setData(jsonData);
        }
      } catch (error) {
        console.error('Error reading Excel file:', error);
        setError('Error reading Excel file. Please check the file format and try again.');
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    
    reader.onerror = () => {
      setError('Error reading the file. Please try again.');
      setLoading(false);
    };
    
    reader.readAsBinaryString(file);
  };

  const getFieldValue = (row, fieldNames) => {
    for (const fieldName of fieldNames) {
      if (row[fieldName] !== undefined && row[fieldName] !== null && row[fieldName] !== '') {
        return row[fieldName];
      }
    }
    return '-';
  };

  const handleGoogleSheetsExport = async () => {
    try {
      const { createOrUpdateCeipalSheet } = await import('../utils/googleSheetsService');
      
      const result = await createOrUpdateCeipalSheet(data);
      
      setStaticSheetUrl(result.sheetUrl);
      
      if (result.isNewSheet) {
        alert(`Google Sheet created successfully!\n\nThis link will remain the same for future updates.\n\nClick OK to open:\n${result.sheetUrl}`);
      } else {
        alert(`Google Sheet updated successfully!\n\nClick OK to open:\n${result.sheetUrl}`);
      }
      window.open(result.sheetUrl, '_blank');
      
    } catch (error) {
      console.error('Google Sheets export failed:', error);
      alert('Failed to create/update Google Sheet. Please try again or check your Google account permissions.');
    }
  };

  return (
    <div className="ceipal-container">
      <div className="upload-section">
        <h3 className="mb-3">
          <i className="bi bi-file-earmark-excel me-2 text-success"></i>
          CEIPAL Details - Excel File Reader
        </h3>
        
        <div className="file-input-wrapper">
          <label htmlFor="excelFile" className="form-label fw-bold">
            Select Excel File (.xlsx, .xls)
          </label>
          <input
            type="file"
            className="file-input form-control"
            id="excelFile"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
          />
          {fileName && (
            <small className="text-muted mt-1 d-block">
              <i className="bi bi-file-check me-1"></i>
              Selected: {fileName}
            </small>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      {loading && (
        <div className="loading-spinner">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Processing Excel file...</p>
        </div>
      )}

      {data.length > 0 && !loading && (
        <div className="data-table">
          <h4 className="table-header d-flex justify-content-between align-items-center">
            <span>
              <i className="bi bi-table me-2"></i>
              CEIPAL Data Records
            </span>
            <div className="d-flex align-items-center gap-2">
              <button 
                onClick={handleGoogleSheetsExport}
                className="btn btn-success btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <i className="bi bi-google"></i>
                {staticSheetUrl ? 'Update Google Sheet' : 'Export to Google Sheets'}
              </button>
              {staticSheetUrl && (
                <a 
                  href={staticSheetUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-outline-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <i className="bi bi-box-arrow-up-right"></i>
                  Open Sheet
                </a>
              )}
              <img src="/nisum-technologies-logo.webp" alt="Nisum Logo" style={{height: '30px'}} />
            </div>
          </h4>
          
          <div className="stats-row">
            <i className="bi bi-info-circle me-2"></i>
            Total Records: <strong>{data.length}</strong>
          </div>
          
          <div className="table-responsive">
            <table className="table custom-table table-striped">
              <thead>
                <tr>
                  <th style={{minWidth: '120px'}}>Job Code</th>
                  <th style={{minWidth: '150px'}}>Client</th>
                  <th style={{minWidth: '130px'}}>Department</th>
                  <th style={{minWidth: '200px'}}>Project Name</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, index) => (
                  <tr key={index}>
                    <td>{getFieldValue(row, ['job_code', 'Job Code', 'JobCode', 'Job_Code'])}</td>
                    <td>{getFieldValue(row, ['client', 'Client', 'CLIENT'])}</td>
                    <td>{getFieldValue(row, ['department', 'Department', 'DEPARTMENT'])}</td>
                    <td>{getFieldValue(row, ['project_name', 'Project Name', 'ProjectName', 'Project_Name'])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data.length === 0 && !loading && !error && (
        <div className="empty-state">
          <i className="bi bi-file-earmark-excel"></i>
          <h5>No Data Available</h5>
          <p>Please upload an Excel file to view CEIPAL details.</p>
          <small className="text-muted">
            Expected columns: Job Code, Client, Department, Project Name
          </small>
        </div>
      )}
    </div>
  );
};

export default CeipalDetails;