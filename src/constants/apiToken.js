import { STORAGE_KEYS } from './storageKeys';

export const API_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJuaXN1bS11bml2ZXJzaXR5LWFwcCIsImNvbnN1bWVySWQiOiJuaXN1bS11bml2ZXJzaXR5IiwiaWF0IjoxNzcxOTE2NjcwLCJleHAiOjE3NzE5MjAyNzB9.l6fzishzKxdba2DyVzBb0J6cEz5weX3maXBCCsEG7_0";

export const setTempToken = () => {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, API_TOKEN);
  localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, Date.now() + 3600000);
};
  