import React, { useState } from "react";
import './Search.css';
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import useGetAllEmployees from "../../hooks/useGetAllEmployees";
import folderImg from '/folder.webp';
import fileImg from '/file.webp';

function Search() {
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();
  const objValue = useSelector((state) => state.create.value);
  const { customProjects, customFiles, deletedProjects } = useSelector((state) => state.clientProjectTree);
  const { data: employeeData } = useGetAllEmployees();

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async function doSearch(text) {
    setSearchText(text);
    if (!text.trim()) { setResults([]); setSearched(false); return; }

    const regex = new RegExp(escapeRegex(text), 'i');
    let found = [];

    // Search Redux static folder/file structure
    function recurse(node) {
      if (Array.isArray(node)) { node.forEach(recurse); return; }
      if (typeof node === 'object' && node !== null) {
        if (node.name && regex.test(node.name)) found.push({ name: node.name, type: node.type, url: node.url || null });
        Object.values(node).forEach(recurse);
      }
    }
    recurse(objValue);

    // Search clients and projects from employee API
    if (employeeData?.records) {
      const clients = [...new Set(employeeData.records.map(emp => emp.employeeAllocationDataDTO?.parentAccount?.accountName).filter(Boolean))];
      clients.forEach(name => { if (regex.test(name)) found.push({ name, type: 'client' }); });
      const projects = [...new Set(employeeData.records.map(emp => emp.employeeAllocationDataDTO?.project?.projectName).filter(Boolean))];
      projects.forEach(name => { if (regex.test(name)) found.push({ name, type: 'project' }); });
    }

    // Search custom projects from Redux + server
    let serverCustomProjects = customProjects;
    try {
      const res = await fetch('/api/sheet-ids');
      const data = await res.json();
      const tree = data['sprintHub_customTree'];
      const parsed = typeof tree === 'string' ? JSON.parse(tree) : tree;
      if (parsed?.customProjects) serverCustomProjects = parsed.customProjects;
    } catch {}

    Object.entries(serverCustomProjects).forEach(([clientName, projects]) => {
      if (regex.test(clientName)) found.push({ name: clientName, type: 'client' });
      projects.forEach(projectName => {
        if (!deletedProjects.some(d => d.toLowerCase() === projectName.toLowerCase())) {
          if (regex.test(projectName)) found.push({ name: projectName, type: 'project' });
        }
      });
    });

    // Search custom files
    Object.entries(customFiles).forEach(([projectName, files]) => {
      files.forEach(fileName => {
        if (regex.test(fileName)) found.push({ name: fileName, type: 'file', url: localStorage.getItem(`sprintHub_${projectName}_${fileName}`) || null });
      });
    });

    // Deduplicate
    const seen = new Set();
    found = found.filter(r => { if (seen.has(r.name)) return false; seen.add(r.name); return true; });
    setResults(found);
    setSearched(true);
  }

  function handleResultClick(val) {
    if (val.type === 'client') {
      navigate('/browse', { state: { searchClient: val.name } });
    } else if (val.type === 'project') {
      navigate('/browse', { state: { searchProject: val.name } });
    } else if (val.type === 'file' && val.url) {
      navigate('/browse', { state: { searchFile: val.url, searchFileName: val.name } });
    } else {
      navigate('/browse', { state: { searchProject: val.name } });
    }
  }

  return (
    <div className="searchSection">
      <h5 style={{ marginBottom: '16px', color: '#1e3a5f' }}>Search Files & Folders</h5>

      <input
        type="text"
        className="inputField"
        autoFocus
        placeholder="🔍 Search by client, project or file name..."
        value={searchText}
        onChange={(e) => doSearch(e.target.value)}
        style={{ padding: '10px 14px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none', marginBottom: '16px' }}
      />

      {searched && results.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
          <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '6px', color: '#374151' }}>No results found</div>
          <div style={{ fontSize: '13px' }}>No files or folders match "<strong>{searchText}</strong>".<br />Try a different search term.</div>
        </div>
      )}

      {results.length > 0 && (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ padding: '8px 14px', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>
            {results.length} result{results.length > 1 ? 's' : ''} found
          </div>
          {results.map((val, i) => (
            <div
              key={i}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderBottom: i < results.length - 1 ? '1px solid #f3f4f6' : 'none', cursor: 'pointer', transition: 'background 0.15s' }}
              onClick={() => handleResultClick(val)}
              onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <img src={val.type === 'file' ? fileImg : folderImg} height={18} alt={val.type} />
              <span style={{ fontSize: '13px', color: '#1e3a5f', fontWeight: '500', flex: 1 }}>{val.name}</span>
              <span style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'capitalize', background: '#f3f4f6', padding: '2px 8px', borderRadius: '10px' }}>{val.type}</span>
              <span style={{ fontSize: '11px', color: '#2a89ac' }}>View in Browse →</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Search;
