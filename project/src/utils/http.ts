import { buildApiUrl } from "../config";

// utils/http.ts
export function buildGetUrl(path: string, params: Record<string, unknown>) {
  const url = new URL(buildApiUrl(path), window.location.origin);
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    if (Array.isArray(v)) {
      v.forEach((item) => url.searchParams.append(k, String(item)));
    } else {
      url.searchParams.set(k, String(v));
    }
  });
  return url;
}
