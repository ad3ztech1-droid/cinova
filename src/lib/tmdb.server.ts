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
  const res = await fetch(url.toString(), { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`TMDB request failed (${res.status})`);
  return (await res.json()) as T;
}
