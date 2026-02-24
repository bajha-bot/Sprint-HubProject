import { STORAGE_KEYS } from "../constants/storageKeys";

export const setAuthTokens = ({ accessToken, refreshToken, expiresIn }) => {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);

  const expiryTime = Date.now() + expiresIn * 1000;
  localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime);
};

export const getAccessToken = () =>
  localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

export const isTokenExpired = () => {
  const expiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
  if (!expiry) return true;

  return Date.now() > expiry - 60 * 1000;
};

export const clearAuth = () => {
  Object.values(STORAGE_KEYS).forEach((key) =>
    localStorage.removeItem(key)
  );
};
