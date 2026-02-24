import React from 'react';
import useGetAllEmployees from '../hooks/useGetAllEmployees';
import './EmployeeStatsCard.css';

const EmployeeStatsCard = () => {
  const { data, loading, error } = useGetAllEmployees();

  if (loading) return <div className="stats-card loading">Loading...</div>;
  if (error) return <div className="stats-card error">Error: {error}</div>;
  if (!data || !data.records) return <div className="stats-card">No data available</div>;

  // Group employees by client and calculate statistics
  const clientStats = data.records.reduce((acc, employee) => {
    const client = employee.employeeAllocationDataDTO?.parentAccount?.accountName || 'Unassigned';
    const status = employee.employeeAllocationDataDTO?.allocationStatus || 'UNKNOWN';
    
    if (!acc[client]) {
      acc[client] = {
        totalEmployees: 0,
        billable: 0,
        confirmed: 0,
        reserved: 0,
        shadow: 0,
        bench: 0,
        backfill: 0,
        demand: 0,
        fulfillment: 0,
        lost: 0
      };
    }

    acc[client].totalEmployees++;
    
    // Map allocation status to categories
    switch (status) {
      case 'BILLABLE':
        acc[client].billable++;
        break;
      case 'CONFIRMED':
        acc[client].confirmed++;
        break;
      case 'RESERVED':
        acc[client].reserved++;
        break;
      case 'SHADOW':
        acc[client].shadow++;
        break;
      case 'AVAILABLE':
        acc[client].bench++;
        break;
      case 'BACKFILL':
        acc[client].backfill++;
        break;
      case 'DEMAND':
        acc[client].demand++;
        break;
      case 'FULFILLMENT':
        acc[client].fulfillment++;
        break;
      case 'LOST':
        acc[client].lost++;
        break;
    }

    return acc;
  }, {});

  return (
    <div className="stats-card">
      <h2 className="stats-title">Employee Statistics by Client</h2>
      
      {Object.entries(clientStats).map(([client, stats]) => (
        <div key={client} className="client-section">
          <h3 className="client-name">{client}</h3>
          
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Total Employees</span>
              <span className="stat-value">{stats.totalEmployees}</span>
            </div>
            
            <div className="stat-item">
              <span className="stat-label">Billable</span>
              <span className="stat-value">{stats.billable}</span>
            </div>
            
            <div className="stat-item">
              <span className="stat-label">Confirmed</span>
              <span className="stat-value">{stats.confirmed}</span>
            </div>
            
            <div className="stat-item">
              <span className="stat-label">Reserved</span>
              <span className="stat-value">{stats.reserved}</span>
            </div>
            
            <div className="stat-item">
              <span className="stat-label">Shadow</span>
              <span className="stat-value">{stats.shadow}</span>
            </div>
            
            <div className="stat-item">
              <span className="stat-label">Bench/Available</span>
              <span className="stat-value">{stats.bench}</span>
            </div>
            
            <div className="stat-item">
              <span className="stat-label">BackFill Positions</span>
              <span className="stat-value">{stats.backfill}</span>
            </div>
            
            <div className="stat-item">
              <span className="stat-label">Demand</span>
              <span className="stat-value">{stats.demand}</span>
            </div>
            
            <div className="stat-item">
              <span className="stat-label">Fulfillment</span>
              <span className="stat-value">{stats.fulfillment}</span>
            </div>
            
            <div className="stat-item">
              <span className="stat-label">Lost Positions</span>
              <span className="stat-value">{stats.lost}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EmployeeStatsCard;