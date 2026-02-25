import { STORAGE_KEYS } from './storageKeys';

export const API_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJuaXN1bS11bml2ZXJzaXR5LWFwcCIsImNvbnN1bWVySWQiOiJuaXN1bS11bml2ZXJzaXR5IiwiaWF0IjoxNzcyMDExODk3LCJleHAiOjE3NzIwMTU0OTd9.r1xzpCzkO_NE8ttLDodK6Cn9gu1l1mVL_iJ5-2QeCjU";

export const setTempToken = () => {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, API_TOKEN);
  localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, Date.now() + 3600000);
};
  