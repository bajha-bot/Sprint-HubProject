import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getProjectPlanSheetUrl } from '../utils/projectPlanSheetService';

const HEALTH_COLORS = { green: '#22c55e', amber: '#f59e0b', red: '#ef4444' };
const ensureGapi = async () => {
  if (window.gapi?.client?.sheets && window.gapi.client.getToken()) return;
  const { initializeGoogleAPI, initializeGIS, authenticate } = await import('../utils/googleSheetsService');
  if (!window.gapi?.client?.sheets) await Promise.all([initializeGoogleAPI(), initializeGIS()]);
  if (!window.gapi.client.getToken()) await authenticate();
};

const POWER_BI_URLS = {
  default: 'https://app.powerbi.com/groups/me/reports/7c43af94-4751-4aa7-be8c-31ddcf2f102f/ed063bcd01028b032c80?ctid=06408ebc-5eb8-4b0d-827f-76dd3b58bc84&experience=power-bi&clientSideAuth=0',
};

function GaugeChart({ value, max = 100, color = '#22c55e', label }) {
  const pct = Math.min(Math.max(value / max, 0), 1);
  const angle = pct * 180 - 90;
  const r = 60, cx = 80, cy = 80;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const arcX = (deg) => cx + r * Math.cos(toRad(deg - 90));
  const arcY = (deg) => cy + r * Math.sin(toRad(deg - 90));
  const startAngle = -90, endAngle = 90;
  const bgPath = `M ${arcX(startAngle)} ${arcY(startAngle)} A ${r} ${r} 0 0 1 ${arcX(endAngle)} ${arcY(endAngle)}`;
  const fillEnd = startAngle + pct * 180;
  const fillPath = pct > 0 ? `M ${arcX(startAngle)} ${arcY(startAngle)} A ${r} ${r} 0 0 1 ${arcX(fillEnd)} ${arcY(fillEnd)}` : '';
  const needleX = cx + (r - 10) * Math.cos(toRad(angle));
  const needleY = cy + (r - 10) * Math.sin(toRad(angle));

  return (
    <div style={{ textAlign: 'center' }}>
      <svg width="100%" height="115" viewBox="0 0 160 115">
        <path d={bgPath} fill="none" stroke="#e5e7eb" strokeWidth="14" strokeLinecap="round" />
        {pct > 0 && <path d={fillPath} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" />}
        <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke="#374151" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="4" fill="#374151" />
        <text x={cx} y={cy + 22} textAnchor="middle" fontSize="15" fontWeight="bold" fill={color}>{value}%</text>
      </svg>
      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '-4px' }}>{label}</div>
    </div>
  );
}

function CustomBarChart({ data }) {
  if (!data || data.length === 0) return <div style={{ color: '#9ca3af', fontSize: '13px', padding: '20px 0' }}>No sprint data available</div>;
  const barHeight = 25;
  const chartHeight = Math.max(data.length * barHeight + 40, 100);

  const CustomYAxisTick = ({ x, y, payload }) => {
    const words = payload.value.split(' ');
    const lines = [];
    let line = '';
    words.forEach(word => {
      if ((line + word).length > 18) { lines.push(line.trim()); line = word + ' '; }
      else line += word + ' ';
    });
    if (line.trim()) lines.push(line.trim());
    return (
      <g transform={`translate(${x},${y})`}>
        {lines.map((l, i) => (
          <text key={i} x={0} y={0} dy={i * 12 - ((lines.length - 1) * 6)} textAnchor="end" fontSize={9} fill="#6b7280">{l}</text>
        ))}
      </g>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart data={data} layout="vertical" barSize={14} barCategoryGap="25%" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
        <YAxis dataKey="name" type="category" width={140} tick={<CustomYAxisTick />} interval={0} />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload || !payload.length) return null;
            const visible = payload.filter(e => e.value > 0);
            if (!visible.length) return null;
            return (
              <div style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '8px 12px', fontSize: '11px' }}>
                <div style={{ fontWeight: '700', marginBottom: '4px', color: '#1e3a5f' }}>{label}</div>
                {visible.map(entry => (
                  <div key={entry.dataKey} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: entry.fill }} />
                    <span style={{ color: entry.fill, fontWeight: '600' }}>{entry.name}: {entry.value} pts</span>
                  </div>
                ))}
              </div>
            );
          }}
        />
        <Bar dataKey="blocked" stackId="a" fill="#ef4444" name="Red" />
        <Bar dataKey="atRisk" stackId="a" fill="#f59e0b" name="Amber" />
        <Bar dataKey="onTrack" stackId="a" fill="#22c55e" name="Green" />
      </BarChart>
    </ResponsiveContainer>
  );
}

const MonthlyHealthDashboard = ({ projectName, clientName, projectStats, clientProjects, employeeData }) => {
  const [sheetData, setSheetData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clientBarData, setClientBarData] = useState([]);
  const [powerBiUrl, setPowerBiUrl] = useState(null);
  const [showPowerBi, setShowPowerBi] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState(null);
  const [projectSearch, setProjectSearch] = useState('');
  const [growthNote, setGrowthNote] = useState(() => {
    const key = `sprintHub_growth_${clientName}_${projectName || 'client'}`;
    return JSON.parse(localStorage.getItem(key) || 'null') || { tag: 'Hiring', text: '', updatedAt: '' };
  });
  const [editingGrowth, setEditingGrowth] = useState(false);
  const focusKey = `sprintHub_focus_${clientName}_${projectName || 'client'}`;
  const [focusItems, setFocusItems] = useState(() => JSON.parse(localStorage.getItem(`sprintHub_focus_${clientName}_${projectName || 'client'}`) || '[]'));
  const [focusFilter, setFocusFilter] = useState('All');
  const [showAddFocus, setShowAddFocus] = useState(false);
  const [newFocus, setNewFocus] = useState({ title: '', desc: '', status: 'In Progress', link: '' });

  // Reset state when client changes
  useEffect(() => {
    setClientBarData([]);
    setSelectedProjects(new Set());
    setSheetData([]);
    setHeaders([]);
    const gKey = `sprintHub_growth_${clientName}_${projectName || 'client'}`;
    setGrowthNote(JSON.parse(localStorage.getItem(gKey) || 'null') || { tag: 'Hiring', text: '', updatedAt: '' });
    const fKey = `sprintHub_focus_${clientName}_${projectName || 'client'}`;
    setFocusItems(JSON.parse(localStorage.getItem(fKey) || '[]'));
  }, [clientName, projectName]);

  useEffect(() => {
    const fetchSheet = async () => {
      setLoading(true);
      try {
        // Client-level: fetch latest row from each project sheet
        if (!projectName && clientProjects?.length > 0) {
          const { getStoredProjectPlanSheets } = await import('../utils/projectPlanSheetService');
          const allSheets = await getStoredProjectPlanSheets();
          await ensureGapi();

          const fetchProject = async (proj) => {
            const sheetUrl = allSheets[proj]?.sheetUrl;
            if (!sheetUrl) return { bar: { name: proj, onTrack: 0, atRisk: 0, blocked: 0 }, row: null, hdrs: null };
            const spreadsheetId = sheetUrl.split('/d/')[1]?.split('/')[0];
            try {
              const gapiRes = await window.gapi.client.sheets.spreadsheets.values.get({ spreadsheetId, range: 'A1:X' });
              const values = gapiRes.result.values;
              if (!values || values.length < 2) return { bar: { name: proj, onTrack: 0, atRisk: 0, blocked: 0 }, row: null, hdrs: null };
              const hdrs = values[0];
              const rows = values.slice(1).filter(r => r.some(c => c));
              if (rows.length === 0) return { bar: { name: proj, onTrack: 0, atRisk: 0, blocked: 0 }, row: null, hdrs };
              const storyCol = hdrs.findIndex(h => h?.toLowerCase().trim() === 'story points');
              const healthCol = hdrs.findIndex(h => h?.toLowerCase().trim() === 'health');
              const sprintCol = hdrs.findIndex(h => h?.toLowerCase().trim() === 'sprint');
              const lastSprintName = rows[rows.length - 1]?.[sprintCol]?.trim();
              const latestSprintRows = lastSprintName ? rows.filter(r => r[sprintCol]?.trim() === lastSprintName) : [rows[rows.length - 1]];
              let onTrack = 0, atRisk = 0, blocked = 0;
              latestSprintRows.forEach(r => {
                const sp = parseInt(String(r[storyCol] || '0').match(/\d+/)?.[0] || 0);
                const health = r[healthCol]?.toLowerCase().trim();
                if (health === 'green') onTrack += sp;
                else if (health === 'amber' || health === 'yellow') atRisk += sp;
                else if (health === 'red') blocked += sp;
                else onTrack += sp;
              });
              return { bar: { name: proj, onTrack, atRisk, blocked }, row: latestSprintRows[latestSprintRows.length - 1], hdrs };
            } catch (e) { return { bar: { name: proj, onTrack: 0, atRisk: 0, blocked: 0 }, row: null, hdrs: null }; }
          };

          const settled = await Promise.all(clientProjects.map(fetchProject));
          const results = settled.map(s => s.bar);
          const combinedRows = settled.filter(s => s.row).map(s => s.row);
          const combinedHeaders = settled.find(s => s.hdrs)?.hdrs || [];

          setClientBarData(results);
          setSelectedProjects(new Set(results.map(r => r.name)));
          setHeaders(combinedHeaders);
          setSheetData(combinedRows);
          setLoading(false);
          return;
        }

        if (!projectName) { setLoading(false); return; }
        const sheetUrl = await getProjectPlanSheetUrl(projectName);
        if (!sheetUrl) { setLoading(false); return; }
        const spreadsheetId = sheetUrl.split('/d/')[1]?.split('/')[0];

        await ensureGapi();
        const gapiRes = await window.gapi.client.sheets.spreadsheets.values.get({ spreadsheetId, range: 'A1:X' });
        let values = gapiRes.result.values;

        if (values && values.length > 0) {
          setHeaders(values[0]);
          setSheetData(values.slice(1).filter(r => r.some(c => c)));
        }
      } catch (e) {
        console.error('Dashboard fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchSheet();

    const storageKey = `sprintHub_${projectName}_Project Dashboard14`;
    const stored = localStorage.getItem(storageKey) || POWER_BI_URLS[projectName] || POWER_BI_URLS.default;
    setPowerBiUrl(stored);
  }, [projectName, clientName, clientProjects]);

  const col = (name) => headers.findIndex(h => h?.toLowerCase().includes(name.toLowerCase()));

  const healthIdx = col('health');
  const statusIdx = col('sprint status');
  const storyIdx = headers.findIndex(h => h?.toLowerCase().trim() === 'story points');
  const sprintIdx = col('sprint');
  const empStatusIdx = col('emp status');
  const completeIdx = col('%complete');
  const tasksIdx = col('tasks assigned');
  const risksIdx = col('risks');
  const commentsIdx = col('any comments');
  const assignedIdx = col('assigned to');

  const parseStoryPoints = (val) => {
    if (!val) return 0;
    const match = String(val).match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  };

  const totalSprints = sheetData.length;
  const completed = sheetData.filter(r => r[statusIdx]?.toLowerCase() === 'completed').length;
  const inProgress = sheetData.filter(r => r[statusIdx]?.toLowerCase() === 'inprogress' || r[statusIdx]?.toLowerCase() === 'in progress').length;

  // Group all rows by sprint name, accumulate story points per health color
  const sprintMap = {};
  sheetData.forEach((r, i) => {
    const sprintName = r[sprintIdx] || `S${i + 1}`;
    const sp = parseStoryPoints(r[storyIdx]);
    const health = r[healthIdx]?.toLowerCase().trim();
    if (!sprintMap[sprintName]) sprintMap[sprintName] = { name: sprintName, onTrack: 0, atRisk: 0, blocked: 0 };
    if (health === 'green') sprintMap[sprintName].onTrack += sp;
    else if (health === 'amber' || health === 'yellow') sprintMap[sprintName].atRisk += sp;
    else if (health === 'red') sprintMap[sprintName].blocked += sp;
    else sprintMap[sprintName].onTrack += sp;
  });
  const barData = Object.values(sprintMap).filter(d => d.onTrack + d.atRisk + d.blocked > 0);

  const latestRow = sheetData[sheetData.length - 1] || [];
  const currentTasks = latestRow[tasksIdx] || '';
  const currentRisks = latestRow[risksIdx] || '';
  const currentComments = latestRow[commentsIdx] || '';
  const completePct = latestRow[completeIdx] || '0';

  // Compute stats from employee API data
  const computedStats = (() => {
    if (!employeeData?.records) return projectStats || {};
    const filtered = employeeData.records.filter(emp => {
      const empClient = emp.employeeAllocationDataDTO?.parentAccount?.accountName;
      const empProject = emp.employeeAllocationDataDTO?.project?.projectName;
      if (projectName) return empProject === projectName && empClient === clientName;
      return empClient === clientName; // client-level: all projects under client
    });
    return filtered.reduce((acc, emp) => {
      const status = emp.employeeAllocationDataDTO?.allocationStatus || '';
      acc.totalEmployees = (acc.totalEmployees || 0) + 1;
      if (status === 'BILLABLE') acc.billable = (acc.billable || 0) + 1;
      if (status === 'CONFIRMED') acc.confirmed = (acc.confirmed || 0) + 1;
      if (status === 'RESERVED') acc.reserved = (acc.reserved || 0) + 1;
      if (status === 'AVAILABLE') acc.available = (acc.available || 0) + 1;
      return acc;
    }, {});
  })();

  const billable = computedStats.billable || 0;
  const confirmed = computedStats.confirmed || 0;
  const reserved = computedStats.reserved || 0;
  const available = computedStats.available || 0;
  const totalEmployees = computedStats.totalEmployees || 0;

  const panelStyle = { backgroundColor: '#fff', borderRadius: '10px', padding: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '12px' };
  const labelStyle = { fontSize: '11px', color: '#6b7280', marginBottom: '2px' };
  const valueStyle = { fontSize: '22px', fontWeight: '700', color: '#1e3a5f' };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
      <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
    </div>
  );

  const isClientView = !projectName;
  const activeSelected = selectedProjects ?? new Set();
  const chartData = isClientView
    ? clientBarData.filter(d => activeSelected.has(d.name))
    : barData;

  // Derive health totals from chartData (story points) so they always match the bar chart
  const healthGreen = chartData.reduce((s, d) => s + d.onTrack, 0);
  const healthYellow = chartData.reduce((s, d) => s + d.atRisk, 0);
  const healthRed = chartData.reduce((s, d) => s + d.blocked, 0);
  const totalSP = healthGreen + healthYellow + healthRed;
  const healthScore = totalSP > 0 ? Math.round(((healthGreen * 100 + healthYellow * 50) / (totalSP * 100)) * 100) : 0;
  const gaugeColor = healthScore >= 70 ? '#22c55e' : healthScore >= 40 ? '#f59e0b' : '#ef4444';

  // Dynamic KPI variables — declared after totalSP/chartData
  const totalStoryPoints = totalSP;
  const completionRate = totalSprints > 0 ? Math.round((completed / totalSprints) * 100) : 0;
  const latestSprintName = latestRow[sprintIdx] || '—';
  const avgSPPerSprint = totalSprints > 0 ? Math.round(totalStoryPoints / totalSprints) : 0;

  if (showPowerBi) return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#f0f4f8', fontFamily: 'Segoe UI, sans-serif' }}>
      <div style={{ padding: '10px 16px', backgroundColor: '#1e3a5f', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#fff', fontWeight: '600', fontSize: '14px' }}>📊 {projectName} — Power BI Report</span>
        <button onClick={() => setShowPowerBi(false)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 12px', cursor: 'pointer', fontSize: '13px' }}>← Back to Dashboard</button>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '48px 56px', boxShadow: '0 4px 24px rgba(0,0,0,0.10)', textAlign: 'center', maxWidth: '480px', width: '100%' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>📊</div>
          <h3 style={{ color: '#1e3a5f', fontWeight: '700', marginBottom: '8px' }}>Power BI Report</h3>
          <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '8px' }}><strong>{projectName}</strong> — {clientName}</p>
          <p style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '28px', lineHeight: '1.6' }}>
            Power BI reports cannot be embedded directly due to Microsoft's security policy.<br />
            Click below to open the report in a new browser tab.
          </p>
          <a
            href={powerBiUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-block', padding: '12px 32px', backgroundColor: '#f2c811', color: '#1e3a5f', fontWeight: '700', fontSize: '14px', borderRadius: '8px', textDecoration: 'none', marginBottom: '16px' }}
          >
            🚀 Open Power BI Report
          </a>
          <div style={{ marginTop: '8px' }}>
            <button
              onClick={() => {
                const newUrl = window.prompt('Enter a custom Power BI URL for this project:', powerBiUrl);
                if (newUrl && newUrl.trim()) {
                  const storageKey = `sprintHub_${projectName}_Project Dashboard14`;
                  localStorage.setItem(storageKey, newUrl.trim());
                  setPowerBiUrl(newUrl.trim());
                }
              }}
              style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: '6px', padding: '6px 16px', fontSize: '12px', color: '#6b7280', cursor: 'pointer' }}
            >
              ✏️ Change Report URL
            </button>
          </div>
          <div style={{ marginTop: '20px', padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '8px', fontSize: '11px', color: '#9ca3af', wordBreak: 'break-all' }}>
            {powerBiUrl}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ backgroundColor: '#f0f4f8', minHeight: '100%', padding: '16px', fontFamily: 'Segoe UI, sans-serif', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h4 style={{ margin: 0, color: '#1e3a5f', textAlign: 'center', fontWeight: '700' }}>{isClientView ? '📊 Account Dashboard' : '📅 Sprint Health Dashboard'}</h4>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>{clientName}{projectName ? ` › ${projectName}` : ''}</div>
        </div>
        {/* <div style={{ display: 'flex', gap: '8px' }}>
          {powerBiUrl && (
            <button onClick={() => setShowPowerBi(true)} style={{ padding: '6px 14px', backgroundColor: '#f2c811', color: '#1e3a5f', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}>
              📊 View Power BI Report
            </button>
          )}
          <div style={{ backgroundColor: '#1e3a5f', color: '#fff', padding: '4px 12px', borderRadius: '6px', fontSize: '12px' }}>
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
        </div> */}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(160px, 200px) 1fr minmax(180px, 220px)', gap: '14px', minWidth: 0 }}>
        {/* LEFT PANEL */}
        <div>
          <div style={panelStyle}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#2a89ac', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Project Team Size</div>
            <div style={labelStyle}>Total Employees</div>
            <div style={valueStyle}>{totalEmployees}</div>
          </div>
          <div style={panelStyle}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#2a89ac', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Allocation</div>
            {[
              { label: 'Billable', value: billable, color: '#22c55e' },
              { label: 'Confirmed', value: confirmed, color: '#3b82f6' },
              { label: 'Reserved', value: reserved, color: '#a855f7' },
              { label: 'Available(Project-Wait)', value: available, color: '#f59e0b' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }} />
                  <span style={{ fontSize: '12px', color: '#374151' }}>{item.label}</span>
                </div>
                <span style={{ fontSize: '14px', fontWeight: '700', color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
          <div style={panelStyle}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#2a89ac', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sprint Stats</div>
            {[
              { label: 'Total Sprints', value: totalSprints, color: '#1e3a5f' },
              { label: 'Completed', value: completed, color: '#22c55e' },
              { label: 'In Progress', value: inProgress, color: '#f59e0b' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>{item.label}</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>

          {isClientView && clientBarData.length > 0 && (
            <div style={panelStyle}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#2a89ac', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Filter & Search</div>
              <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '6px' }}>{clientName}</div>
              <input
                type="text"
                placeholder="Search projects..."
                value={projectSearch}
                onChange={e => setProjectSearch(e.target.value)}
                style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #d1d5db', borderRadius: '6px', marginBottom: '8px', boxSizing: 'border-box', outline: 'none' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <button
                  onClick={() => setSelectedProjects(new Set(clientBarData.map(r => r.name)))}
                  style={{ fontSize: '10px', color: '#2a89ac', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >All</button>
                <button
                  onClick={() => setSelectedProjects(new Set())}
                  style={{ fontSize: '10px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >None</button>
              </div>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {clientBarData
                  .filter(d => d.name.toLowerCase().includes(projectSearch.toLowerCase()))
                  .map(d => (
                    <label key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px', cursor: 'pointer', fontSize: '11px', color: '#374151' }}>
                      <input
                        type="checkbox"
                        checked={activeSelected.has(d.name)}
                        onChange={() => {
                          const next = new Set(activeSelected);
                          next.has(d.name) ? next.delete(d.name) : next.add(d.name);
                          setSelectedProjects(next);
                        }}
                        style={{ accentColor: '#2a89ac', width: '13px', height: '13px', flexShrink: 0 }}
                      />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                    </label>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* CENTER */}
        <div>
          <div style={panelStyle}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#1e3a5f', marginBottom: '10px' }}>{isClientView ? '📊 Portfolio Projects — Latest Sprint Story Points' : '📊 Portfolio Project — Sprint Story Points'}</div>
            <CustomBarChart data={chartData} />
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px', justifyContent: 'center' }}>
              {[['#ef4444', 'Red'], ['#f59e0b', 'Amber'], ['#22c55e', 'Green']].map(([c, l]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#6b7280' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: c }} />{l}
                </div>
              ))}
            </div>
          </div>

          <div style={panelStyle}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#1e3a5f', marginBottom: '8px' }}>📝 Overall Health Summary</div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              {[
                { label: 'Green', count: healthGreen, color: HEALTH_COLORS.green },
                { label: 'Amber', count: healthYellow, color: HEALTH_COLORS.amber },
                { label: 'Red', count: healthRed, color: HEALTH_COLORS.red },
              ].map(h => (
                <div key={h.label} style={{ flex: 1, backgroundColor: h.color + '18', border: `1px solid ${h.color}40`, borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: h.color }}>{h.count}</div>
                  <div style={{ fontSize: '10px', color: '#6b7280' }}>{h.label}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: '12px', color: '#374151', lineHeight: '1.6' }}>
              {currentComments ? (
                <span>💬 {currentComments}</span>
              ) : (
                <span style={{ color: '#9ca3af' }}>No summary comments available for the latest sprint.</span>
              )}
            </div>
          </div>

          <div style={panelStyle}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#1e3a5f', marginBottom: '8px' }}>🏆 Achievements</div>
            <div style={{ fontSize: '12px', color: '#374151', lineHeight: '1.7' }}>
              {completed > 0 && <div>✅ {completed} sprint{completed > 1 ? 's' : ''} completed successfully</div>}
              {healthGreen > 0 && <div>🟢 {healthGreen} sprint{healthGreen > 1 ? 's' : ''} with Green health status</div>}
              {completePct && completePct !== '0' && <div>📈 Latest sprint {completePct}% complete</div>}
              {currentTasks && <div>🎯 Current: {currentTasks.substring(0, 80)}{currentTasks.length > 80 ? '...' : ''}</div>}
              {!completed && !healthGreen && <div style={{ color: '#9ca3af' }}>No achievements recorded yet.</div>}
            </div>
          </div>

          {currentRisks && (
            <div style={{ ...panelStyle, backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#dc2626', marginBottom: '6px' }}>⚠️ Risks</div>
              <div style={{ fontSize: '12px', color: '#374151' }}>{currentRisks}</div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div>
          <div style={{ ...panelStyle, textAlign: 'center' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#1e3a5f', marginBottom: '8px' }}>🟢 Overall Health</div>
            <GaugeChart value={healthScore} color={gaugeColor} label="Health Score" />
            <div style={{ marginTop: '6px', padding: '4px 10px', backgroundColor: gaugeColor + '20', borderRadius: '12px', display: 'inline-block' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: gaugeColor }}>
                {healthScore >= 70 ? 'On Track)' : healthScore >= 40 ? 'At Risk' : 'Critical'}
              </span>
            </div>
          </div>

          <div style={panelStyle}>
            {/* Header */}
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#1e3a5f', marginBottom: '6px' }}>📌 Current Focus Areas</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <select
                  value={focusFilter}
                  onChange={e => setFocusFilter(e.target.value)}
                  style={{ fontSize: '10px', border: '1px solid #d1d5db', borderRadius: '6px', padding: '2px 6px', color: '#374151', outline: 'none', flex: 1 }}
                >
                  {['All', 'In Progress', 'On Track', 'Blocked'].map(f => <option key={f}>{f}</option>)}
                </select>
                <button
                  onClick={() => setShowAddFocus(s => !s)}
                  style={{ fontSize: '10px', backgroundColor: '#1e3a5f', color: '#fff', border: 'none', borderRadius: '6px', padding: '3px 8px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                >+ Add</button>
              </div>
            </div>

            {/* Add Form */}
            {showAddFocus && (
              <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '10px', marginBottom: '10px', border: '1px solid #e5e7eb' }}>
                <input placeholder="Title" value={newFocus.title} onChange={e => setNewFocus(n => ({ ...n, title: e.target.value }))}
                  style={{ width: '100%', fontSize: '11px', border: '1px solid #d1d5db', borderRadius: '5px', padding: '5px 8px', marginBottom: '6px', boxSizing: 'border-box', outline: 'none' }} />
                <input placeholder="Short description" value={newFocus.desc} onChange={e => setNewFocus(n => ({ ...n, desc: e.target.value }))}
                  style={{ width: '100%', fontSize: '11px', border: '1px solid #d1d5db', borderRadius: '5px', padding: '5px 8px', marginBottom: '6px', boxSizing: 'border-box', outline: 'none' }} />
                <input placeholder="Link URL (optional)" value={newFocus.link} onChange={e => setNewFocus(n => ({ ...n, link: e.target.value }))}
                  style={{ width: '100%', fontSize: '11px', border: '1px solid #d1d5db', borderRadius: '5px', padding: '5px 8px', marginBottom: '6px', boxSizing: 'border-box', outline: 'none' }} />
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <select value={newFocus.status} onChange={e => setNewFocus(n => ({ ...n, status: e.target.value }))}
                    style={{ fontSize: '11px', border: '1px solid #d1d5db', borderRadius: '5px', padding: '4px 6px', flex: 1, outline: 'none' }}>
                    {['In Progress', 'On Track', 'Blocked'].map(s => <option key={s}>{s}</option>)}
                  </select>
                  <button
                    onClick={() => {
                      if (!newFocus.title.trim()) return;
                      const updated = [...focusItems, { ...newFocus, id: Date.now() }];
                      setFocusItems(updated);
                      localStorage.setItem(focusKey, JSON.stringify(updated));
                      setNewFocus({ title: '', desc: '', status: 'In Progress', link: '' });
                      setShowAddFocus(false);
                    }}
                    style={{ fontSize: '11px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '5px', padding: '4px 12px', cursor: 'pointer' }}
                  >Save</button>
                </div>
              </div>
            )}

            {/* Items */}
            <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
              {(focusFilter === 'All' ? focusItems : focusItems.filter(f => f.status === focusFilter)).length === 0 && (
                <div style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'center', padding: '16px 0' }}>No focus areas. Click + Add to create one.</div>
              )}
              {(focusFilter === 'All' ? focusItems : focusItems.filter(f => f.status === focusFilter)).map(item => {
                const statusColors = { 'In Progress': ['#f59e0b', '#fffbeb'], 'On Track': ['#3b82f6', '#eff6ff'], 'Blocked': ['#ef4444', '#fef2f2'] };
                const [sc, bg] = statusColors[item.status] || ['#6b7280', '#f9fafb'];
                return (
                  <div key={item.id} style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 12px', marginBottom: '8px', borderLeft: `3px solid ${sc}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#1e3a5f', flex: 1, paddingRight: '6px' }}>{item.title}</div>
                      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                        <span style={{ fontSize: '9px', backgroundColor: bg, color: sc, padding: '2px 7px', borderRadius: '10px', fontWeight: '600', border: `1px solid ${sc}30` }}>{item.status}</span>
                        <button onClick={() => { const updated = focusItems.filter(f => f.id !== item.id); setFocusItems(updated); localStorage.setItem(focusKey, JSON.stringify(updated)); }}
                          style={{ fontSize: '9px', background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', padding: '0 2px' }}>×</button>
                      </div>
                    </div>
                    {item.desc && <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px', lineHeight: '1.5' }}>{item.desc}</div>}
                    {item.link && (
                      <a href={item.link} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: '10px', color: '#2a89ac', fontWeight: '600', textDecoration: 'none' }}>👉 View Details</a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={panelStyle}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#1e3a5f' }}>📈 Growth</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {editingGrowth ? (
                  <select
                    value={growthNote.tag}
                    onChange={e => setGrowthNote(g => ({ ...g, tag: e.target.value }))}
                    style={{ fontSize: '10px', border: '1px solid #d1d5db', borderRadius: '10px', padding: '2px 6px', color: '#374151' }}
                  >
                    {['Hiring', 'On Track', 'At Risk', 'Blocked', 'Update'].map(t => <option key={t}>{t}</option>)}
                  </select>
                ) : (
                  <span style={{ fontSize: '10px', backgroundColor: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: '10px', fontWeight: '600' }}>{growthNote.tag}</span>
                )}
                <button
                  onClick={() => {
                    if (editingGrowth) {
                      const updated = { ...growthNote, updatedAt: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) };
                      const key = `sprintHub_growth_${clientName}_${projectName || 'client'}`;
                      localStorage.setItem(key, JSON.stringify(updated));
                      setGrowthNote(updated);
                    }
                    setEditingGrowth(e => !e);
                  }}
                  style={{ fontSize: '10px', background: 'none', border: '1px solid #d1d5db', borderRadius: '6px', padding: '2px 8px', cursor: 'pointer', color: '#6b7280' }}
                >{editingGrowth ? 'Save' : '✏️ Edit'}</button>
              </div>
            </div>
            {/* Content */}
            <div style={{ fontSize: '12px', color: '#374151', minHeight: '80px', maxHeight: '180px', overflowY: 'auto' }}>
              {editingGrowth ? (
                <textarea
                  value={growthNote.text}
                  onChange={e => setGrowthNote(g => ({ ...g, text: e.target.value }))}
                  placeholder="Enter update… e.g.&#10;Gap is hiring for a Java Engineer in India.&#10;• 2 candidates shortlisted&#10;• 1 interview completed"
                  style={{ width: '100%', minHeight: '120px', fontSize: '12px', border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px', boxSizing: 'border-box', resize: 'vertical', outline: 'none', fontFamily: 'inherit', lineHeight: '1.6' }}
                />
              ) : growthNote.text ? (
                <p style={{ margin: 0, lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{growthNote.text}</p>
              ) : (
                <p style={{ margin: 0, color: '#9ca3af', fontStyle: 'italic' }}>No growth update yet. Click ✏️ Edit to add one.</p>
              )}
            </div>
            {/* Footer */}
            {growthNote.updatedAt && (
              <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #f3f4f6', fontSize: '10px', color: '#9ca3af' }}>
                Last updated: {growthNote.updatedAt}
              </div>
            )}
          </div>

          {/* {headers.length > 0 && (
            <div style={panelStyle}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#2a89ac', marginBottom: '6px' }}>📋 Sheet Fields</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {headers.map((h, i) => (
                  <span key={i} style={{ fontSize: '9px', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '10px' }}>{h}</span>
                ))}
              </div>
            </div>
          )} */}
        </div>
      </div>
    </div>
  );
};

export default MonthlyHealthDashboard;
