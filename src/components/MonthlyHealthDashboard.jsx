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

  const hasRed = data.some(d => d.blocked > 0);
  const hasAmber = data.some(d => d.atRisk > 0);
  const hasGreen = data.some(d => d.onTrack > 0);

  const NullBar = (props) => {
    const { x, y, width, height, value } = props;
    if (!value || value === 0) return null;
    return <rect x={x} y={y} width={width} height={height} fill={props.fill} />;
  };

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
        {hasRed && <Bar dataKey="blocked" stackId="a" fill="#ef4444" name="Red" shape={<NullBar fill="#ef4444" />} />}
        {hasAmber && <Bar dataKey="atRisk" stackId="a" fill="#f59e0b" name="Amber" shape={<NullBar fill="#f59e0b" />} />}
        {hasGreen && <Bar dataKey="onTrack" stackId="a" fill="#22c55e" name="Green" shape={<NullBar fill="#22c55e" />} />}
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

  // Reset state when client/project changes
  useEffect(() => {
    setClientBarData([]);
    setSelectedProjects(new Set());
    setSheetData([]);
    setHeaders([]);
  }, [clientName, projectName]);

  useEffect(() => {
    const fetchSheet = async () => {
      setLoading(true);
      setSheetData([]);
      setHeaders([]);
      try {
        // Client-level: fetch latest row from each project sheet
        if (!projectName && clientProjects?.length > 0) {
          const { getStoredProjectPlanSheets } = await import('../utils/projectPlanSheetService');
          const allSheets = await getStoredProjectPlanSheets();
          await ensureGapi();

          const normalize = s => s?.replace(/[\r\n\t]+/g, ' ').trim().toLowerCase() ?? '';
          const fuzzyMatch = (keys, proj) => {
            const normProj = normalize(proj);
            // 1. Exact normalized match
            let match = keys.find(k => normalize(k) === normProj);
            if (match) return match;
            // 2. One starts with the other (handles API truncation)
            match = keys.find(k => normalize(k).startsWith(normProj) || normProj.startsWith(normalize(k)));
            if (match) return match;
            // 3. Longest common prefix >= 10 chars
            match = keys.find(k => {
              const a = normalize(k), b = normProj;
              let i = 0;
              while (i < a.length && i < b.length && a[i] === b[i]) i++;
              return i >= 10;
            });
            return match || null;
          };
          const fetchProject = async (proj) => {
            const matchedKey = fuzzyMatch(Object.keys(allSheets), proj);
            const sheetUrl = allSheets[matchedKey]?.sheetUrl;
            if (!sheetUrl) return { bar: { name: proj, onTrack: 0, atRisk: 0, blocked: 0 }, row: null, hdrs: null };
            const spreadsheetId = sheetUrl.split('/d/')[1]?.split('/')[0];
            try {
              const gapiRes = await window.gapi.client.sheets.spreadsheets.values.get({ spreadsheetId, range: 'A1:Z' });
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
        const gapiRes = await window.gapi.client.sheets.spreadsheets.values.get({ spreadsheetId, range: 'A1:Z' });
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

  const sortOrder = (d) => {
    const r = d.blocked > 0, a = d.atRisk > 0, g = d.onTrack > 0;
    if (r && !a && !g) return 1;       // Only Red
    if (r && a && g)  return 2;        // Red + Amber + Green
    if (r && a && !g) return 3;        // Red + Amber
    if (r && !a && g) return 4;        // Red + Green
    if (!r && a && !g) return 5;       // Only Amber
    if (!r && a && g)  return 6;       // Amber + Green
    if (!r && !a && g) return 7;       // Only Green
    return 8;
  };
  const sortedBarData = [...barData].sort((a, b) => sortOrder(a) - sortOrder(b));

  const growthIdx = headers.findIndex(h => h?.toLowerCase().includes('growth'));
  const focusSheetIdx = headers.findIndex(h => h?.toLowerCase().includes('current focus'));
  const updatedIdx = headers.findIndex(h => h?.toLowerCase().includes('end date') || h?.toLowerCase().includes('updated') || h?.toLowerCase().includes('date'));
  const projectNameColIdx = headers.findIndex(h => h?.toLowerCase().trim() === 'project name');

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

  const scanRows = (idx) => {
    if (idx < 0) return { text: '', dateVal: null };
    let rows = sheetData;
    if (!projectName && projectNameColIdx >= 0) {
      const singleSelected = activeSelected.size === 1 ? [...activeSelected][0] : null;
      if (singleSelected) {
        const normalize = s => s?.toLowerCase().replace(/[\s\-_]+/g, '');
        rows = sheetData.filter(r => normalize(r[projectNameColIdx]?.toString()) === normalize(singleSelected));
        // console.log('[scanRows]', { singleSelected, projectNameColIdx, sheetNames: sheetData.map(r => r[projectNameColIdx]), matched: rows.length });
      } else {
        return { text: '', dateVal: null };
      }
    }
    for (let i = rows.length - 1; i >= 0; i--) {
      const val = rows[i][idx]?.toString().trim();
      if (val) {
        const dateVal = updatedIdx >= 0 ? rows[i][updatedIdx]?.toString().trim() || null : null;
        return { text: val, dateVal };
      }
    }
    return { text: '', dateVal: null };
  };

  const { text: growthText, dateVal: growthLastUpdated } = scanRows(growthIdx);
  const { text: focusSheetText, dateVal: focusSheetLastUpdated } = scanRows(focusSheetIdx);

  const chartData = isClientView
    ? [...clientBarData.filter(d => activeSelected.has(d.name))].sort((a, b) => sortOrder(a) - sortOrder(b))
    : sortedBarData;

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
      <style>{`
        .dashboard-grid {
          display: grid;
          grid-template-columns: minmax(160px, 200px) 1fr minmax(180px, 220px);
          gap: 14px;
          min-width: 0;
        }
        @media (max-width: 768px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
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

      <div className="dashboard-grid">
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
              {[['#ef4444', 'Red', 'blocked'], ['#f59e0b', 'Amber', 'atRisk'], ['#22c55e', 'Green', 'onTrack']]
                .filter(([, , key]) => chartData.some(d => d[key] > 0))
                .map(([c, l]) => (
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
                {healthScore >= 70 ? 'On Track' : healthScore >= 40 ? 'At Risk' : 'Critical'}
              </span>
            </div>
          </div>

          <div style={panelStyle}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#1e3a5f', marginBottom: '10px' }}>📌 Current Focus Areas</div>
            <div style={{ fontSize: '12px', color: '#374151', minHeight: '60px', maxHeight: '180px', overflowY: 'auto' }}>
              {focusSheetText ? (
                <p style={{ margin: 0, lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{focusSheetText}</p>
              ) : (
                <p style={{ margin: 0, color: '#9ca3af', fontStyle: 'italic' }}>{projectName ? 'No focus areas data available for the last sprint.' : 'Select a project to view focus areas.'}</p>
              )}
            </div>
            {focusSheetText && (
              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f0f0f0', fontSize: '10px', color: '#9ca3af', textAlign: 'center' }}>
                🕒 Last updated: {focusSheetLastUpdated ? new Date(focusSheetLastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            )}
          </div>

          <div style={panelStyle}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#1e3a5f', marginBottom: '10px' }}>📈 Growth</div>
            <div style={{ fontSize: '12px', color: '#374151', minHeight: '80px', maxHeight: '180px', overflowY: 'auto' }}>
              {growthText ? (
                <p style={{ margin: 0, lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{growthText}</p>
              ) : (
                <p style={{ margin: 0, color: '#9ca3af', fontStyle: 'italic' }}>{projectName ? 'No growth data available for the last sprint.' : 'Select a project to view growth.'}</p>
              )}
            </div>
            {growthText && (
              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f0f0f0', fontSize: '10px', color: '#9ca3af', textAlign: 'center' }}>
                🕒 Last updated: {growthLastUpdated ? new Date(growthLastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            )}
          </div>

          {/* Sheet Fields debug panel removed */}
        </div>
      </div>
    </div>
  );
};

export default MonthlyHealthDashboard;
