import { STORAGE_KEYS } from './storageKeys';

export const API_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJuaXN1bS11bml2ZXJzaXR5LWFwcCIsImNvbnN1bWVySWQiOiJuaXN1bS11bml2ZXJzaXR5IiwiaWF0IjoxNzcyMTAxMzU2LCJleHAiOjE3NzIxMDQ5NTZ9.bISk5-ko_ldzVXaWrdiJlWcE-b69qMAJWWshZBhTcl0";

export const setTempToken = () => {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, API_TOKEN);
  localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, Date.now() + 3600000);
};
  