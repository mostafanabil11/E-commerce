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

interface FetchApiOptions<T> {
  /** Seconds to cache the response for. Defaults to one hour. */
  revalidate?: number;
  /** Returned instead of throwing when the request cannot be completed. */
  fallback: T;
  /** Extra attempts after the first. Defaults to 2. */
  retries?: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Catalogue reads that must never take the page down with them.
 *
 * These run during `next build` while prerendering, so an unreachable or
 * cold-starting API would otherwise fail the whole deployment. Each call is
 * retried with backoff, and a persistent failure degrades to `fallback` so the
 * page renders its empty state instead.
 */
export async function fetchApi<T>(
  path: string,
  { revalidate = 3600, fallback, retries = 2 }: FetchApiOptions<T>,
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(apiUrl(path), { next: { revalidate } });

      if (!response.ok) {
        // 4xx will not fix itself on retry; 5xx might.
        if (response.status < 500) return fallback;
        throw new Error(`HTTP ${response.status}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      if (attempt === retries) {
        console.error(
          `API request failed after ${retries + 1} attempts: ${path} — ${(error as Error).message}`,
        );
        return fallback;
      }
      // 400ms, then 1200ms — enough for a sleeping instance to wake.
      await sleep(400 * 3 ** attempt);
    }
  }

  return fallback;
}
