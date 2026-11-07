export const API_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) || "http://localhost:3000";

interface ApiErrorBody {
  errors?: { message?: string }[];
}

/**
 * Fetch JSON from the Ranndy API. Throws an Error with the API's own message
 * (or the HTTP status) when the response isn't OK.
 */
export async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  const body = (await res.json().catch(() => ({}))) as T & ApiErrorBody;
  if (!res.ok) {
    throw new Error(body.errors?.[0]?.message || `The server returned ${res.status}.`);
  }
  return body;
}
