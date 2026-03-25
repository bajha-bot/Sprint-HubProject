// const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://prodbe-myteam.mynisum.com';

// export const API_BASE_URL = import.meta.env.PROD ? BASE_URL : '';

// export const API_ENDPOINTS = {
//   GENERATE_TOKEN: `${import.meta.env.PROD ? BASE_URL : ''}/myTeam/auth/generate-token`,
//   REFRESH_TOKEN: `${import.meta.env.PROD ? BASE_URL : ''}/myTeam/auth/refresh-token`,
//   GET_ALL_EMPLOYEES: `${import.meta.env.PROD ? BASE_URL : ''}/myTeam/open-apis/getAllEmployees`,
// };
const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const SERVER_URL = import.meta.env.VITE_SERVER_URL || '';

export const API_ENDPOINTS = {
  GENERATE_TOKEN: import.meta.env.PROD ? '/api/auth/generate-token' : `${SERVER_URL}/myTeam/auth/generate-token`,
  REFRESH_TOKEN: import.meta.env.PROD ? '/api/auth/refresh-token' : `${SERVER_URL}/myTeam/auth/refresh-token`,
  GET_ALL_EMPLOYEES: import.meta.env.PROD ? '/api/employees' : `${SERVER_URL}/api/employees`,
};