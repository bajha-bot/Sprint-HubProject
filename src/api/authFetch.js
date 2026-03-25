import { getToken } from '../constants/apiToken';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || '';

export const authFetch = async (url, options = {}) => {
  const token = await getToken();

  if (!token) throw new Error("Unauthorized");

  const fullUrl = url.startsWith('http') ? url : `${SERVER_URL}${url}`;

  return fetch(fullUrl, {
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
      AppToken: token,
    },
  });
};