import axios from "axios";
import { getCookie } from "cookies-next";

const DEV_DEFAULT = "http://localhost:8000";

export function getApiBase(): string {
  let base =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_PROD_BACKEND_URL || "";

  // Dev fallback when env is missing
  if (!base) {
    // SSR/dev server fallback
    if (process.env.NODE_ENV !== "production") {
      base = DEV_DEFAULT;
    }
    // Browser-side extra protection if still empty
    if (!base && typeof window !== "undefined") {
      const origin = window.location.origin;
      if (origin.includes("localhost:3000") || origin.includes("127.0.0.1:3000")) {
        base = DEV_DEFAULT;
      }
    }
  }

  if (!base) {
    // eslint-disable-next-line no-console
    console.warn(
      "API base URL not configured. Set NEXT_PUBLIC_BACKEND_URL (falling back to relative origin)."
    );
  }
  return base;
}

export const api = axios.create({ baseURL: getApiBase() || undefined });

// Attach admin token automatically for admin API requests
api.interceptors.request.use((config) => {
  try {
    const url = config.url || "";
    // Only attach for admin endpoints
    if (url.includes("/api/v1/admin")) {
      const raw = getCookie("admin");
      console.log('[API Interceptor] Admin cookie:', raw);
      if (raw) {
        try {
          const admin = JSON.parse(String(raw));
          const token = admin?.token;
          console.log('[API Interceptor] Admin token found:', token ? 'YES' : 'NO');
          if (token) {
            config.headers = config.headers ?? {};
            (config.headers as any).Authorization = `Bearer ${token}`;
            console.log('[API Interceptor] Authorization header set:', `Bearer ${token.substring(0, 20)}...`);
          } else {
            console.warn('[API Interceptor] No token in admin cookie');
          }
        } catch (e) {
          console.error('[API Interceptor] Failed to parse admin cookie:', e);
        }
      } else {
        console.warn('[API Interceptor] No admin cookie found for admin endpoint:', url);
      }
    }
  } catch (_err) {
    console.error('[API Interceptor] Error in interceptor:', _err);
  }
  return config;
});
