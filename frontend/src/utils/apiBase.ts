/**
 * Production: set VITE_API_URL to your backend origin (no trailing slash), e.g.
 * https://stego-api.vercel.app
 * Dev: leave unset — Vite proxy serves /api → localhost backend.
 */
export function getApiBaseURL(): string {
  const root = import.meta.env.VITE_API_URL as string | undefined;
  if (root && root.length > 0) {
    return `${root.replace(/\/$/, '')}/api`;
  }
  return '/api';
}
