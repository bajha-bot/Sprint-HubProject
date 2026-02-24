import { getAccessToken, isTokenExpired } from "../auth/authService";
import { refreshAccessToken } from "./refreshToken";

export const authFetch = async (url, options = {}) => {
  let token = getAccessToken();

  if (!token) throw new Error("Unauthorized");

  const response = await fetch(url, {
    ...options,
    mode: 'cors',
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
      AppToken: token,
    },
  });

  if (response.status === 401) {
    token = await refreshAccessToken();

    if (!token) throw new Error("Unauthorized");

    return fetch(url, {
      ...options,
      mode: 'cors',
      headers: {
        ...options.headers,
        'Content-Type': 'application/json',
        AppToken: token,
      },
    });
  }

  return response;
};
