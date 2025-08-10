import axios from "axios";
import { tokenStorage } from "../../lib/tokenStorage";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_SERVER_HOST,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
