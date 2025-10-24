import { getApiBase } from "./api";

export function resolveImageUrl(src?: string | null): string {
  if (!src) return "";
  const s = String(src);
  if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("data:")) {
    return s;
  }
  const base = (getApiBase() || "").replace(/\/+$/, "");
  if (!base) return s; // fall back to given string
  if (s.startsWith("/")) return `${base}${s}`;
  return `${base}/${s.replace(/^\/+/, "")}`;
}

