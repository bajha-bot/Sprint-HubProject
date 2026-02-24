import { setAuthTokens, clearAuth } from "../auth/authService";
import { STORAGE_KEYS } from "../constants/storageKeys";
import { redirectToLogin } from "../utils/redirectToLogin";

const REFRESH_API =
  "https://qa-myteam.mynisum.com:8445/myTeam/auth/refresh-token";

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
