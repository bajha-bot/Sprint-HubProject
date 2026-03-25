import { setAuthTokens, clearAuth } from "../auth/authService";
import { STORAGE_KEYS } from "../constants/storageKeys";
import { redirectToLogin } from "../utils/redirectToLogin";
import { API_ENDPOINTS } from "../constants/apiConfig";

const REFRESH_API = API_ENDPOINTS.REFRESH_TOKEN;

export const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

  if (!refreshToken) {
    clearAuth();
    redirectToLogin();
    return null;
  }

  try {
    const response = await fetch(REFRESH_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) throw new Error("Refresh failed");

    const result = await response.json();

    setAuthTokens({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
    });

    return result.accessToken;
  } catch {
    clearAuth();
    redirectToLogin();
    return null;
  }
};
