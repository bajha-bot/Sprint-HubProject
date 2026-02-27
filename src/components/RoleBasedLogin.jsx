import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../api/authFetch';
import './EmployeeStatsCard.css';

const RoleBasedLogin = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }
    
    if (!email.endsWith('@nisum.com')) {
      setError('Please use a valid Nisum email address (@nisum.com)');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const apiUrl = import.meta.env.PROD 
        ? 'https://prodbe-myteam.mynisum.com/myTeam/open-apis/getAllEmployees'
        : '/myTeam/open-apis/getAllEmployees';
      const response = await authFetch(apiUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch employee data');
      }
      
      const data = await response.json();
      const userExists = data.records?.find(emp => emp.emailId === email);
      
      if (!userExists) {
        setError('Email not found in the system. Please check your email address.');
        setLoading(false);
        return;
      }
      
      localStorage.setItem('userEmail', email);
      navigate('/sprint-hub-app');
    } catch (err) {
      setError('Failed to verify email. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="stats-card" style={{ maxWidth: '500px', margin: '100px auto', padding: '40px' }}>
      <h2 className="stats-title" style={{ textAlign: 'center', marginBottom: '30px' }}>
        Role-Based Access Login
      </h2>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          Enter Your Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError('');
          }}
          placeholder="your.email@nisum.com"
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            boxSizing: 'border-box'
          }}
          onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
        />
        {error && (
          <div style={{ color: 'red', marginTop: '8px', fontSize: '14px' }}>
            {error}
          </div>
        )}
      </div>

      <button
        onClick={handleLogin}
        disabled={loading}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: loading ? '#ccc' : '#0F9D58',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Verifying...' : 'Login'}
      </button>

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '4px', fontSize: '14px' }}>
        <strong>Test Emails:</strong>
        <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
          <li>susman@nisum.com (Employee - Albertsons)</li>
          <li>Any other employee email from your system</li>
        </ul>
      </div>
    </div>
  );
};

export default RoleBasedLogin;
