import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getProjectPlanSheetUrl } from '../utils/projectPlanSheetService';

const HEALTH_COLORS = { green: '#22c55e', yellow: '#eab308', red: '#ef4444' };
const API_KEY = 'AIzaSyAXU_abdTN3N-6Nv78KbQjht0QKl1xd9Eo';

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
        <Bar dataKey="onTrack" stackId="a" fill="#22c55e" name="Green" />
        <Bar dataKey="atRisk" stackId="a" fill="#eab308" name="Yellow" />
        <Bar dataKey="blocked" stackId="a" fill="#ef4444" name="Red" />
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

  useEffect(() => {
    const fetchSheet = async () => {
      setLoading(true);
      try {
        // Client-level: fetch latest row from each project sheet
        if (!projectName && clientProjects?.length > 0) {
          const { getStoredProjectPlanSheets } = await import('../utils/projectPlanSheetService');
          const allSheets = await getStoredProjectPlanSheets();
          console.log('clientProjects:', clientProjects);
          console.log('allSheets keys:', Object.keys(allSheets));
          const results = [];
          let combinedHeaders = [];
          const combinedRows = [];
          for (const proj of clientProjects) {
            const sheetUrl = allSheets[proj]?.sheetUrl;
            if (!sheetUrl) {
              // Project has no sheet yet — still show it in bar chart with 0
              results.push({ name: proj, onTrack: 0, atRisk: 0, blocked: 0 });
              continue;
            }
            const spreadsheetId = sheetUrl.split('/d/')[1]?.split('/')[0];
            try {
              let values = null;
              if (window.gapi?.client?.sheets && window.gapi.client.getToken()) {
                const res = await window.gapi.client.sheets.spreadsheets.values.get({ spreadsheetId, range: 'A1:W' });
                values = res.result.values;
              } else {
                const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:W?key=${API_KEY}`);
                values = (await res.json()).values;
              }
              if (!values || values.length < 2) continue;
              const hdrs = values[0];
              if (combinedHeaders.length === 0) combinedHeaders = hdrs;
              const rows = values.slice(1).filter(r => r.some(c => c));
              if (rows.length === 0) continue;

              const storyCol = hdrs.findIndex(h => h?.toLowerCase().trim() === 'story points');
              const healthCol = hdrs.findIndex(h => h?.toLowerCase().trim() === 'health');
              const sprintCol = hdrs.findIndex(h => h?.toLowerCase().trim() === 'sprint');

              // Find the latest sprint name
              const lastSprintName = rows[rows.length - 1]?.[sprintCol]?.trim();

              // Get all rows belonging to the latest sprint
              const latestSprintRows = lastSprintName
                ? rows.filter(r => r[sprintCol]?.trim() === lastSprintName)
                : [rows[rows.length - 1]];

              // Use last row of latest sprint for combined sheetData
              combinedRows.push(latestSprintRows[latestSprintRows.length - 1]);

              // Accumulate story points per health across all latest sprint rows
              let onTrack = 0, atRisk = 0, blocked = 0;
              latestSprintRows.forEach(r => {
                const sp = parseInt(String(r[storyCol] || '0').match(/\d+/)?.[0] || 0);
                const health = r[healthCol]?.toLowerCase().trim();
                if (health === 'green') onTrack += sp;
                else if (health === 'yellow') atRisk += sp;
                else if (health === 'red') blocked += sp;
                else onTrack += sp;
              });
              results.push({ name: proj, onTrack, atRisk, blocked });
            } catch (e) { /* skip failed sheets */ }
          }
          setClientBarData(results);
          setHeaders(combinedHeaders);
          setSheetData(combinedRows);
          setLoading(false);
          return;
        }

        if (!projectName) { setLoading(false); return; }
        const sheetUrl = await getProjectPlanSheetUrl(projectName);
        if (!sheetUrl) { setLoading(false); return; }
        const spreadsheetId = sheetUrl.split('/d/')[1]?.split('/')[0];

        let values = null;

        // Try with OAuth token via gapi first (works for private sheets)
        if (window.gapi?.client?.sheets && window.gapi.client.getToken()) {
          try {
            const res = await window.gapi.client.sheets.spreadsheets.values.get({
              spreadsheetId,
              range: 'A1:Q'
            });
            values = res.result.values;
          } catch (gapiErr) {
            console.warn('gapi fetch failed, falling back to API key:', gapiErr);
          }
        }

        // Fallback to API key (works for public sheets)
        if (!values) {
          const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:Q?key=${API_KEY}`);
          const result = await res.json();
          values = result.values;
        }

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
  }, [projectName]);

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

  const healthGreen = sheetData.filter(r => r[healthIdx]?.toLowerCase() === 'green').length;
  const healthYellow = sheetData.filter(r => r[healthIdx]?.toLowerCase() === 'yellow').length;
  const healthRed = sheetData.filter(r => r[healthIdx]?.toLowerCase() === 'red').length;
  const totalSprints = sheetData.length;
  const completed = sheetData.filter(r => r[statusIdx]?.toLowerCase() === 'completed').length;
  const inProgress = sheetData.filter(r => r[statusIdx]?.toLowerCase() === 'inprogress' || r[statusIdx]?.toLowerCase() === 'in progress').length;
  const healthScore = totalSprints > 0 ? Math.round(((healthGreen * 100 + healthYellow * 50) / (totalSprints * 100)) * 100) : 0;

  // Group all rows by sprint name, accumulate story points per health color
  const sprintMap = {};
  sheetData.forEach((r, i) => {
    const sprintName = r[sprintIdx] || `S${i + 1}`;
    const sp = parseStoryPoints(r[storyIdx]);
    const health = r[healthIdx]?.toLowerCase().trim();
    if (!sprintMap[sprintName]) sprintMap[sprintName] = { name: sprintName, onTrack: 0, atRisk: 0, blocked: 0 };
    if (health === 'green') sprintMap[sprintName].onTrack += sp;
    else if (health === 'yellow') sprintMap[sprintName].atRisk += sp;
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
      return acc;
    }, {});
  })();

  const billable = computedStats.billable || 0;
  const confirmed = computedStats.confirmed || 0;
  const reserved = computedStats.reserved || 0;
  const totalEmployees = computedStats.totalEmployees || 0;

  const gaugeColor = healthScore >= 70 ? '#22c55e' : healthScore >= 40 ? '#eab308' : '#ef4444';

  const growthStack = [
    { label: 'React (Frontend)', icon: '📈', color: '#61dafb' },
    { label: 'Node.js (Backend API)', icon: '🟢', color: '#68a063' },
    { label: 'Azure AD (Authentication)', icon: '🔷', color: '#0078d4' },
    { label: 'Power BI Service (Report)', icon: '📊', color: '#f2c811' },
  ];

  const panelStyle = { backgroundColor: '#fff', borderRadius: '10px', padding: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '12px' };
  const labelStyle = { fontSize: '11px', color: '#6b7280', marginBottom: '2px' };
  const valueStyle = { fontSize: '22px', fontWeight: '700', color: '#1e3a5f' };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
      <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
    </div>
  );

  const isClientView = !projectName;
  const chartData = isClientView ? clientBarData : barData;

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
              { label: 'In Progress', value: inProgress, color: '#eab308' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>{item.label}</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER */}
        <div>
          <div style={panelStyle}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#1e3a5f', marginBottom: '10px' }}>{isClientView ? '📊 Portfolio Projects — Latest Sprint Story Points' : '📊 Portfolio Project — Sprint Story Points'}</div>
            <CustomBarChart data={chartData} />
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px', justifyContent: 'center' }}>
              {[['#22c55e', 'Green'], ['#eab308', 'Yellow'], ['#ef4444', 'Red']].map(([c, l]) => (
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
                { label: 'Yellow', count: healthYellow, color: HEALTH_COLORS.yellow },
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
                {healthScore >= 70 ? 'HEALTHY' : healthScore >= 40 ? 'AT RISK' : 'CRITICAL'}
              </span>
            </div>
          </div>

          <div style={panelStyle}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#1e3a5f', marginBottom: '8px' }}>📌 Current Focus Areas</div>
            {/* {sheetData.slice(-3).reverse().map((row, i) => (
              <div key={i} style={{ marginBottom: '8px', padding: '6px 8px', backgroundColor: '#f8fafc', borderRadius: '6px', borderLeft: `3px solid ${row[healthIdx]?.toLowerCase() === 'green' ? '#22c55e' : row[healthIdx]?.toLowerCase() === 'red' ? '#ef4444' : '#eab308'}` }}>
                <div style={{ fontSize: '10px', fontWeight: '600', color: '#374151' }}>{row[sprintIdx] || `Sprint ${sheetData.length - i}`}</div>
                <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>{row[tasksIdx]?.substring(0, 50) || row[assignedIdx] || 'No tasks listed'}{(row[tasksIdx]?.length > 50) ? '...' : ''}</div>
              </div>
            ))}
            {sheetData.length === 0 && <div style={{ fontSize: '11px', color: '#9ca3af' }}>No focus areas available</div>} */}
          </div>

          <div style={panelStyle}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#1e3a5f', marginBottom: '10px' }}>📈 Growth</div>
            {growthStack.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: item.color + '30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0 }}>{item.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', color: '#374151', fontWeight: '500' }}>{item.label}</div>
                  <div style={{ height: '3px', backgroundColor: '#e5e7eb', borderRadius: '2px', marginTop: '3px' }}>
                    <div style={{ height: '100%', width: `${85 - i * 10}%`, backgroundColor: item.color, borderRadius: '2px' }} />
                  </div>
                </div>
                {i < growthStack.length - 1 && (
                  <div style={{ position: 'absolute', marginLeft: '8px', marginTop: '20px', fontSize: '8px', color: '#9ca3af' }}>↓</div>
                )}
              </div>
            ))}
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
