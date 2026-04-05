/**
 * - **Development:** always `/api` → Vite proxy → local backend (ignore VITE_API_URL).
 * - **Production:** `VITE_API_URL` from Vercel (e.g. https://your-api.vercel.app), no trailing slash.
 */
export function getApiBaseURL(): string {
  if (import.meta.env.DEV) {
    return '/api';
  }
  const root = import.meta.env.VITE_API_URL as string | undefined;
  if (root && root.trim().length > 0) {
    return `${root.trim().replace(/\/$/, '')}/api`;
  }
  return '/api';
}
