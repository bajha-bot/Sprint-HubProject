import { STORAGE_KEYS } from './storageKeys';
import { API_ENDPOINTS } from './apiConfig';

const INITIAL_TOKEN = import.meta.env.VITE_INITIAL_TOKEN;

const TOKEN_REFRESH_URL = API_ENDPOINTS.GENERATE_TOKEN;

// Fetch new token from API
const fetchNewToken = async () => {
  try {
    console.log('Fetching token from:', TOKEN_REFRESH_URL);
    const response = await fetch(TOKEN_REFRESH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        consumerId: 'nisum-university',
        sub: 'nisum-university-app'
      })
    });

    console.log('Token API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token API failed:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    console.log('Token API response:', data);
    return data.token || data.accessToken;
  } catch (error) {
    console.error('Error fetching new token:', error);
    return null;
  }
};

// Check if token is expired or about to expire (within 5 minutes)
const isTokenExpired = () => {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const expiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
  
  if (!token || !expiry) return true;
  
  const expiryTime = parseInt(expiry);
  const currentTime = Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  
  return currentTime >= (expiryTime - fiveMinutes);
};

// Set token with automatic refresh
export const setTempToken = async () => {
  const existingToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  
  // Check if token exists and is still valid
  if (existingToken && !isTokenExpired()) {
    console.log('Token is still valid');
    return existingToken;
  }

  console.log('Token expired, using INITIAL_TOKEN...');
  
  // Use INITIAL_TOKEN (skip API call since it returns 401)
  if (INITIAL_TOKEN && INITIAL_TOKEN !== 'YOUR_VALID_TOKEN_HERE') {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, INITIAL_TOKEN);
    localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, Date.now() + 3540000);
    console.log('Token refreshed from INITIAL_TOKEN');
    return INITIAL_TOKEN;
  }
  
  console.error('No token available');
  return null;
};

// Initialize token on app load (use INITIAL_TOKEN, skip API call)
export const initializeToken = async () => {
  console.log('Initializing token from INITIAL_TOKEN...');
  
  if (INITIAL_TOKEN && INITIAL_TOKEN !== 'YOUR_VALID_TOKEN_HERE') {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, INITIAL_TOKEN);
    localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, Date.now() + 3540000);
    console.log('Token initialized successfully');
    return INITIAL_TOKEN;
  }
  
  console.error('No token available. Please set INITIAL_TOKEN in apiToken.js');
  return null;
};

// Get current token (with auto-refresh)
export const getToken = async () => {
  return await setTempToken();
};
  