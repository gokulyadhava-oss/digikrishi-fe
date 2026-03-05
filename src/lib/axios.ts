import axios from "axios";
import { useAuthStore } from "@/stores/authStore";

// Use VITE_APP_URL or VITE_API_URL so requests go to the backend. In dev, VITE_API_URL=http://127.0.0.1:3001.
// If neither is set, fall back to /api (relies on Vite proxy in dev).
const host = import.meta.env.VITE_APP_URL ?? import.meta.env.VITE_API_URL ?? "";
const baseURL = host ? `${String(host).replace(/\/$/, "")}/api` : "/api";

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      window.dispatchEvent(new CustomEvent("auth:logout"));
    }
    return Promise.reject(err);
  }
);
