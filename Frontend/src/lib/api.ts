/**
 * Base URL of the NestJS backend, including the /api/v1 prefix.
 *
 * Set `API` in `.env.local` to point at a deployed backend; the fallback keeps
 * local development working with no configuration.
 */
export const API_BASE = (
  process.env.API || 'http://localhost:5000/api/v1'
).replace(/\/+$/, '');

/** Builds an absolute API URL from a leading-slash path, e.g. `/products`. */
export function apiUrl(path: string): string {
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}
