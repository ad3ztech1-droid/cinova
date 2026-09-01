const BASE = "https://api.themoviedb.org/3";

export async function tmdb<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const key = process.env["TMDB_API_KEY"];
  if (!key) throw new Error("TMDB_API_KEY is not configured");
  const url = new URL(BASE + path);
  url.searchParams.set("api_key", key);
  url.searchParams.set("language", "en-US");
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  }
  // TMDB occasionally rate-limits or hiccups; retry transient failures so the
  // catalog never renders empty because of a single bad response.
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url.toString(), {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) return (await res.json()) as T;
      if (res.status < 500 && res.status !== 429) {
        throw new Error(`TMDB request failed (${res.status})`);
      }
      lastError = new Error(`TMDB request failed (${res.status})`);
    } catch (err) {
      lastError = err;
    }
    await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
  }
  throw lastError instanceof Error ? lastError : new Error("TMDB request failed");
}
