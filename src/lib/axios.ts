import axios from "axios";
import { useAuthStore } from "@/stores/authStore";

// In dev with no VITE_APP_URL, use /api so Vite proxies to backend (no CORS). Set VITE_APP_URL for production or to hit a specific API.
const host = import.meta.env.VITE_APP_URL ?? import.meta.env.VITE_API_URL ?? "";
const baseURL =
  import.meta.env.DEV && !import.meta.env.VITE_APP_URL ? "/api" : host ? `${host.replace(/\/$/, "")}/api` : "/api";

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
