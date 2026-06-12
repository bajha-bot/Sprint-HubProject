

import { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { getProjectPlanSheetUrl } from '../utils/projectPlanSheetService';
 
const style = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@700;800&display=swap');
 
  :root {
    --navy: #0d1b3e;
    --navy-mid: #162045;
    --accent-blue: #3f5de8;
    --accent-blue-light: #6c84f0;
    --accent-blue-pale: #e8ecfd;
    --surface: #f4f6fb;
    --surface-card: #ffffff;
    --border: #dde2f0;
    --text-primary: #0d1b3e;
    --text-secondary: #5a6382;
    --text-muted: #8e97b5;
    --danger: #e84545;
    --warning: #f5a623;
    --success: #22c55e;
    --font-display: 'Syne', sans-serif;
    --font-body: 'DM Sans', sans-serif;
    --radius: 12px;
    --radius-sm: 8px;
    --shadow-card: 0 2px 12px rgba(13,27,62,0.07);
    --shadow-hover: 0 8px 28px rgba(13,27,62,0.13);
  }
 
  body { background: #fff; font-family: var(--font-body); color: var(--text-primary); }
 
  .dash-wrapper {
    min-height: 100vh;
    background: #fff;
    padding: 32px 28px;
  }
 
  /* Header */
  .dash-title {
    font-family: var(--font-display);
    font-size: 2rem;
    font-weight: 800;
    color: var(--navy);
    letter-spacing: -0.5px;
    margin-bottom: 24px;
  }
 
  /* Project ID Card */
  .project-id-badge {
    background: #fff;
    color: #000;
    border: 1px solid #dde2f0;
    font-family: var(--font-display);
    font-size: 1.1rem;
    font-weight: 700;
    padding: 14px 22px;
    border-radius: var(--radius-sm);
    letter-spacing: 1px;
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 120px;
  }
 
  .project-name-card {
    background: var(--surface-card);
    border: 1.5px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 14px 22px;
    font-family: var(--font-display);
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--navy);
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    box-shadow: var(--shadow-card);
  }
 
  .project-name-card .star-accent {
    color: var(--accent-blue);
    font-size: 1rem;
  }
 
  /* Quick Links */
  .quick-links-card {
    background: var(--surface-card);
    border: 1.5px solid var(--border);
    border-radius: var(--radius);
    padding: 0;
    box-shadow: var(--shadow-card);
    overflow: hidden;
  }
 
  .quick-links-header {
    background: var(--accent-blue-pale);
    color: var(--accent-blue);
    font-weight: 600;
    font-size: 0.78rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 10px 16px;
    border-bottom: 1.5px solid var(--border);
  }
 
  .quick-link-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 16px;
    color: var(--text-secondary);
    font-size: 0.875rem;
    font-weight: 500;
    text-decoration: none;
    border-bottom: 1px solid var(--border);
    transition: background 0.15s, color 0.15s;
    cursor: pointer;
  }
 
  .quick-link-item:last-child { border-bottom: none; }
  .quick-link-item:hover { background: var(--accent-blue-pale); color: var(--accent-blue); }
 
  .quick-link-item i {
    font-size: 0.95rem;
    width: 18px;
    text-align: center;
  }
 
  /* Description card */
  .desc-card {
    background: var(--surface-card);
    border: 1.5px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow-card);
    overflow: hidden;
  }
 
  .desc-label {
    background: var(--accent-blue-pale);
    color: var(--accent-blue);
    font-weight: 600;
    font-size: 0.78rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 10px 18px;
    border-bottom: 1.5px solid var(--border);
  }
 
  .desc-body {
    padding: 16px 18px;
    min-height: 80px;
    color: var(--text-muted);
    font-size: 0.93rem;
  }
 
  /* Section header bar */
  .section-bar {
    display: flex;
    align-items: center;
    gap: 0;
    margin: 28px 0 18px;
    border-radius: var(--radius-sm);
    overflow: hidden;
  }
 
  .section-bar-label {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 1rem;
    color: var(--accent-blue);
    padding: 10px 20px;
    background: transparent;
    border: none;
    border-radius: var(--radius-sm) 0 0 var(--radius-sm);
    white-space: nowrap;
  }
 
  .section-bar-fill {
    flex: 1;
    height: 2px;
    background: var(--border);
    border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  }
 
  .section-bar-right {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 1rem;
    color: var(--navy);
    padding: 10px 24px;
    background: transparent;
    border: none;
    border-radius: var(--radius-sm);
    white-space: nowrap;
  }
 
  /* Stat cards */
  .stat-card {
    background: transparent;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 12px 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 80px;
    cursor: pointer;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
 
  .stat-card:hover {
    border-color: #3f5de8;
    box-shadow: 0 2px 8px rgba(63,93,232,0.15);
  }
  .stat-card::before { display: none; }
  .stat-card:hover::before { display: none; }
 
  .stat-value {
    font-family: var(--font-display);
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--navy);
    line-height: 1;
    text-align: center;
  }
 
  .stat-label {
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--text-muted);
    text-align: center;
    line-height: 1.3;
  }
 
  .health-dot {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    display: inline-block;
  }
 
  /* Updates card */
  .updates-card {
    background: var(--surface-card);
    border: 1.5px solid var(--border);
    border-top: 3px solid var(--danger);
    border-radius: var(--radius);
    padding: 36px 24px;
    box-shadow: var(--shadow-card);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 180px;
    text-align: center;
  }
 
  .updates-icon {
    font-size: 2.5rem;
    color: var(--danger);
    margin-bottom: 12px;
    opacity: 0.5;
  }
 
  .updates-title {
    font-weight: 700;
    font-size: 0.95rem;
    color: var(--text-primary);
    margin-bottom: 6px;
  }
 
  .updates-desc {
    font-size: 0.82rem;
    color: var(--text-muted);
    max-width: 380px;
  }
 
  /* Progress ring */
  .progress-ring-wrap {
    position: relative;
    width: 52px;
    height: 52px;
  }
 
  .progress-ring-wrap svg {
    transform: rotate(-90deg);
  }
 
  .progress-ring-center {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-display);
    font-size: 0.75rem;
    font-weight: 800;
    color: var(--navy);
    background: transparent;
  }
 
  /* Editable field */
  .editable-field {
    border: none;
    outline: none;
    background: transparent;
    font-family: var(--font-body);
    font-size: 0.93rem;
    color: var(--text-secondary);
    width: 100%;
    resize: none;
  }
 
  .editable-field:focus {
    background: var(--accent-blue-pale);
    border-radius: 6px;
    padding: 4px 6px;
  }
 
  /* Tooltip for nav links */
  .sidebar-card-wrap { position: sticky; top: 24px; }
 
  @media (max-width: 768px) {
    .dash-wrapper { padding: 16px 12px; }
    .dash-title { font-size: 1.5rem; }
  }
`;

const healthColors = {
  red: "#e84545",
  amber: "#f5a623",
  green: "#22c55e",
};
 
const quickLinks = [
  { label: "Project Plan", icon: "bi-journal-text", color: "#3f5de8" },
  { label: "Project Team", icon: "bi-people-fill", color: "#3f5de8" },
  { label: "RAID Log", icon: "bi-exclamation-triangle-fill", color: "#f5a623" },
  // { label: "Project Toolkits", icon: "bi-tools", color: "#5a6382" },
  // { label: "Project Intake", icon: "bi-inbox-fill", color: "#3f5de8" },
  // { label: "Portfolio Summary Roll-up", icon: "bi-bar-chart-fill", color: "#f5a623" },
  // { label: "Missing source", icon: "bi-question-circle-fill", color: "#22c55e" },
];
 
function ProgressRing({ pct }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="progress-ring-wrap">
      <svg width="52" height="52" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r={r} fill="none" stroke="#dde2f0" strokeWidth="5" />
        <circle
          cx="26" cy="26" r={r}
          fill="none"
          stroke="#3f5de8"
          strokeWidth="5"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="progress-ring-center">{pct}%</div>
    </div>
  );
}



export default function ProjectShowDashboard({ projectName, clientName, projectStats, onProjectPlan, onProjectTeam, onRaidLog, onAccountDashboard }) {
  const [health, setHealth] = useState('red');
  const [completePct, setCompletePct] = useState(0);
  const [projectOwner, setProjectOwner] = useState('-');
  const [projectSponsor, setProjectSponsor] = useState('-');
  const [risks, setRisks] = useState('-');
  const [projectStage, setProjectStage] = useState('-');
  const [description, setDescription] = useState('');

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const sheetUrl = await getProjectPlanSheetUrl(projectName);
        if (!sheetUrl) return;
        const spreadsheetId = sheetUrl.split('/d/')[1]?.split('/')[0];
        let values = null;
        if (window.gapi?.client?.sheets && window.gapi.client.getToken()) {
          const res = await window.gapi.client.sheets.spreadsheets.values.get({ spreadsheetId, range: 'A1:Z' });
          values = res.result.values;
        } else {
          const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:Z?key=AIzaSyAXU_abdTN3N-6Nv78KbQjht0QKl1xd9Eo`);
          const result = await res.json();
          values = result.values;
        }
        if (!values || values.length < 2) return;
        const headers = values[0];
        const rows = values.slice(1).filter(r => r.some(c => c));
        const latestRow = rows[rows.length - 1] || [];

        const healthIdx = headers.findIndex(h => h?.toLowerCase().trim() === 'health');
        if (healthIdx !== -1) {
          const green = rows.filter(r => r[healthIdx]?.toLowerCase().trim() === 'green').length;
          const yellow = rows.filter(r => r[healthIdx]?.toLowerCase().trim() === 'yellow').length;
          const red = rows.filter(r => r[healthIdx]?.toLowerCase().trim() === 'red').length;
          if (green >= yellow && green >= red) setHealth('green');
          else if (yellow >= red) setHealth('amber');
          else setHealth('red');
        }

        const completeIdx = headers.findIndex(h => h?.toLowerCase().includes('%complete'));
        if (completeIdx !== -1) {
          const num = parseInt(String(latestRow[completeIdx] || '0').match(/\d+/)?.[0] || 0);
          setCompletePct(Math.min(num, 100));
        }

        const ownerIdx = headers.findIndex(h => h?.toLowerCase().includes('project owner'));
        const sponsorIdx = headers.findIndex(h => h?.toLowerCase().includes('project sponsor'));
        const risksIdx = headers.findIndex(h => h?.toLowerCase().includes('risks'));
        // Search all rows for first non-empty value since latest row may be empty
        if (ownerIdx !== -1) {
          const val = rows.map(r => r[ownerIdx]).filter(v => v?.trim()).pop();
          if (val) setProjectOwner(val);
        }
        if (sponsorIdx !== -1) {
          const val = rows.map(r => r[sponsorIdx]).filter(v => v?.trim()).pop();
          if (val) setProjectSponsor(val);
        }
        if (risksIdx !== -1) {
          const val = rows.map(r => r[risksIdx]).filter(v => v?.trim()).pop();
          setRisks(val || 'None');
        }

        // Calculate project stage from Start Date and End Date
        const startIdx = headers.findIndex(h => h?.toLowerCase().includes('start date'));
        const endIdx = headers.findIndex(h => h?.toLowerCase().includes('end date'));
        const getQuarter = (dateStr) => {
          if (!dateStr) return null;
          const d = new Date(dateStr);
          if (isNaN(d)) return null;
          const month = d.getMonth() + 1; // 1-12
          const year = d.getFullYear();
          // Q1=Apr-Jun, Q2=Jul-Sep, Q3=Oct-Dec, Q4=Jan-Mar
          if (month >= 4 && month <= 6) return `Q1-${year}`;
          if (month >= 7 && month <= 9) return `Q2-${year}`;
          if (month >= 10 && month <= 12) return `Q3-${year}`;
          return `Q4-${year}`; // Jan-Mar
        };
        if (startIdx !== -1 || endIdx !== -1) {
          const startVal = rows.map(r => r[startIdx]).filter(v => v?.trim()).pop();
          const endVal = rows.map(r => r[endIdx]).filter(v => v?.trim()).pop();
          const startQ = getQuarter(startVal);
          const endQ = getQuarter(endVal);
          if (startQ && endQ && startQ !== endQ) setProjectStage(`${startQ} - ${endQ}`);
          else if (startQ) setProjectStage(startQ);
          else if (endQ) setProjectStage(endQ);
        }
      } catch (e) {
        console.error('Health fetch error:', e);
      }
    };
    if (projectName) fetchHealth();
  }, [projectName]);
 
  const stats = [
    {
      label: "Overall Health",
      value: (
        <span
          className="health-dot"
          style={{ background: healthColors[health] }}
          title={health === 'green' ? 'Green - On Track' : health === 'amber' ? 'Amber - At Risk' : 'Red - Critical'}
        />
      ),
    },
    {
      label: "% Complete",
      value: completePct + "%",
    },
    {
      label: "Project Stage",
      value: projectStage,
    },
    {
      label: "High Priority Risks",
      value: risks,
    },
    {
      label: "Project Sponsor",
      value: projectSponsor,
      small: true,
    },
    {
      label: "Project Owner",
      value: projectOwner,
      small: true,
    },
  ];
 
  return (
    <>
      <style>{style}</style>
      <div className="dash-wrapper">
        <h1 className="dash-title">
          <i className="bi bi-grid-3x3-gap-fill me-2" style={{ color: "var(--accent-blue)", fontSize: "1.5rem" }} />
          Project Dashboard
        </h1>
 
        <div className="row g-3 align-items-start">
          {/* Left: main content */}
          <div className="col-12 col-lg-9">
            {/* Top row: ID + Name */}
            <div className="d-flex gap-3 mb-3 flex-wrap">
              <div className="project-id-badge">
                {/* P-0006 */}
              </div>
              <div className="project-name-card">
                <span className="star-accent">✦</span>
                {projectName}
                <span className="star-accent">✦</span>
              </div>
            </div>
 
            {/* Description */}
            <div className="desc-card mb-3">
              <div className="desc-label">High Level Description</div>
              <div className="desc-body">
                <textarea
                  className="editable-field"
                  rows={3}
                  placeholder="Enter a high-level description of the project..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
 
            {/* Project Information section bar */}
            <div className="section-bar">
              <div className="section-bar-label">
                <i className="bi bi-info-circle me-2" />
                Project Information
              </div>
              <div className="section-bar-fill" />
            </div>
 
            {/* Stats row */}
            <div className="row g-3 mb-2">
              {stats.map((s, i) => (
                <div key={i} className="col-6 col-sm-4 col-md-2">
                  <div className="stat-card h-100" style={{ background: 'transparent', boxShadow: 'none' }}>
                    <div className="stat-value" style={{ background: 'transparent' }}>
                      {s.value}
                    </div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
 
            {/* Project Updates section bar */}
            <div className="d-flex align-items-center gap-0 mt-4 mb-3" style={{ borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
              <div className="section-bar-fill" style={{ flex: 1, borderRadius: "var(--radius-sm) 0 0 var(--radius-sm)" }} />
              <div className="section-bar-right">
                <i className="bi bi-map me-2" />
                Project Updates &amp; Roadmap
              </div>
            </div>
 
            {/* Updates placeholder */}
            {/* <div className="updates-card">
              <div className="updates-icon">
                <i className="bi bi-file-earmark-x-fill" />
              </div>
              <div className="updates-title">Source report unavailable</div>
              <div className="updates-desc">
                Please contact a dashboard Admin to edit the widget or update permissions on the source report.
              </div>
              <button
                className="btn btn-sm mt-3"
                style={{ background: "var(--accent-blue-pale)", color: "var(--accent-blue)", fontWeight: 600, borderRadius: "6px", fontSize: "0.8rem" }}
              >
                <i className="bi bi-person-gear me-1" />
                Contact Admin
              </button>
            </div> */}
          </div>
 
          {/* Right: Quick Links */}
          <div className="col-12 col-lg-3">
            <div className="sidebar-card-wrap">
              <div className="quick-links-card">
                <div className="quick-links-header">
                  <i className="bi bi-lightning-charge-fill me-1" />
                  Quick Links
                </div>
                {quickLinks.map((link, i) => (
                  <a key={i} className="quick-link-item" href="#" onClick={(e) => {
                    e.preventDefault();
                    if (link.label === 'Project Plan') onProjectPlan?.();
                    else if (link.label === 'Project Team') onProjectTeam?.();
                    else if (link.label === 'RAID Log') onRaidLog?.();
                    else if (link.label === 'Portfolio Summary Roll-up') onAccountDashboard?.();
                  }}>
                    <i className={`${link.icon}`} style={{ color: link.color }} />
                    {link.label}
                    <i className="bi bi-chevron-right ms-auto" style={{ fontSize: "0.65rem", opacity: 0.4 }} />
                  </a>
                ))}
              </div>
 
              {/* Mini status summary */}
              {/* <div className="quick-links-card mt-3">
                <div className="quick-links-header">
                  <i className="bi bi-activity me-1" />
                  Status Summary
                </div>
                <div style={{ padding: "14px 16px" }}>
                  {[
                    { label: "Timeline", status: "On Track", color: "var(--success)" },
                    { label: "Budget", status: "At Risk", color: "var(--danger)" },
                    { label: "Scope", status: "On Track", color: "var(--success)" },
                    { label: "Resources", status: "On Watch", color: "var(--warning)" },
                  ].map((item, i) => (
                    <div key={i} className="d-flex justify-content-between align-items-center mb-2">
                      <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 500 }}>{item.label}</span>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          color: item.color,
                          background: item.color + "18",
                          padding: "2px 8px",
                          borderRadius: "20px",
                        }}
                      >
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
 