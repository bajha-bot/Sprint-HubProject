// const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://prodbe-myteam.mynisum.com';

// export const API_BASE_URL = import.meta.env.PROD ? BASE_URL : '';

// export const API_ENDPOINTS = {
//   GENERATE_TOKEN: `${import.meta.env.PROD ? BASE_URL : ''}/myTeam/auth/generate-token`,
//   REFRESH_TOKEN: `${import.meta.env.PROD ? BASE_URL : ''}/myTeam/auth/refresh-token`,
//   GET_ALL_EMPLOYEES: `${import.meta.env.PROD ? BASE_URL : ''}/myTeam/open-apis/getAllEmployees`,
// };
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const API_ENDPOINTS = {
  GENERATE_TOKEN: import.meta.env.PROD ? '/api/auth/generate-token' : `${BASE_URL}/myTeam/auth/generate-token`,
  REFRESH_TOKEN: import.meta.env.PROD ? '/api/auth/refresh-token' : `${BASE_URL}/myTeam/auth/refresh-token`,
  GET_ALL_EMPLOYEES: '/api/employees',
};