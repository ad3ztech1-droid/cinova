import { tmdb } from "./tmdb.server";
import type { CastMember, Episode, Genre, MediaDetail, MediaItem, MediaType, Season, Video } from "./tmdb";

interface RawItem {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  media_type?: string;
}

function map(raw: RawItem, fallback: MediaType): MediaItem {
  const type: MediaType = raw.media_type === "tv" || raw.media_type === "movie" ? raw.media_type : fallback;
  return {
    id: raw.id,
    title: raw.title ?? raw.name ?? "Untitled",
    overview: raw.overview ?? "",
    poster_path: raw.poster_path ?? null,
    backdrop_path: raw.backdrop_path ?? null,
    vote_average: Math.round((raw.vote_average ?? 0) * 10) / 10,
    release_date: raw.release_date ?? raw.first_air_date ?? null,
    media_type: type,
  };
}

function list(res: { results?: RawItem[] }, fallback: MediaType) {
  return (res.results ?? []).filter((r) => r.poster_path || r.backdrop_path).map((r) => map(r, fallback));
}

export async function fetchHome() {
  const [trending, popularMovies, topMovies, nowPlaying, popularTv, topTv, upcoming] = await Promise.all([
    tmdb<{ results: RawItem[] }>("/trending/all/day"),
    tmdb<{ results: RawItem[] }>("/movie/popular"),
    tmdb<{ results: RawItem[] }>("/movie/top_rated"),
    tmdb<{ results: RawItem[] }>("/movie/now_playing"),
    tmdb<{ results: RawItem[] }>("/tv/popular"),
    tmdb<{ results: RawItem[] }>("/tv/top_rated"),
    tmdb<{ results: RawItem[] }>("/movie/upcoming"),
  ]);
  return {
    trending: list(trending, "movie"),
    popularMovies: list(popularMovies, "movie"),
    topMovies: list(topMovies, "movie"),
    nowPlaying: list(nowPlaying, "movie"),
    popularTv: list(popularTv, "tv"),
    topTv: list(topTv, "tv"),
    upcoming: list(upcoming, "movie"),
  };
}

export async function fetchDetail(type: MediaType, id: number): Promise<MediaDetail> {
  const raw = await tmdb<
    RawItem & {
      tagline?: string;
      runtime?: number;
      episode_run_time?: number[];
      status?: string;
      genres?: Genre[];
      seasons?: Season[];
      number_of_seasons?: number;
      homepage?: string;
      credits?: { cast?: CastMember[] };
      videos?: { results?: Video[] };
      similar?: { results?: RawItem[] };
      recommendations?: { results?: RawItem[] };
    }
  >(`/${type}/${id}`, { append_to_response: "credits,videos,similar,recommendations" });

  const base = map(raw, type);
  const sim = list({ results: raw.recommendations?.results ?? [] }, type);
  return {
    ...base,
    tagline: raw.tagline ?? "",
    runtime: raw.runtime ?? raw.episode_run_time?.[0] ?? null,
    status: raw.status ?? "",
    genres: raw.genres ?? [],
    seasons: (raw.seasons ?? []).filter((s) => s.season_number > 0),
    number_of_seasons: raw.number_of_seasons ?? 0,
    homepage: raw.homepage ?? null,
    cast: (raw.credits?.cast ?? []).slice(0, 18).map((c) => ({
      id: c.id,
      name: c.name,
      character: c.character,
      profile_path: c.profile_path ?? null,
    })),
    videos: (raw.videos?.results ?? []).filter((v) => v.site === "YouTube"),
    similar: (sim.length ? sim : list({ results: raw.similar?.results ?? [] }, type)).slice(0, 18),
  };
}

export async function fetchSearch(q: string, page: number) {
  if (!q.trim()) return { results: [] as MediaItem[], total_pages: 0, page: 1 };
  const res = await tmdb<{ results: RawItem[]; total_pages: number; page: number }>("/search/multi", {
    query: q,
    page,
    include_adult: "false",
  });
  return {
    results: res.results.filter((r) => r.media_type === "movie" || r.media_type === "tv").map((r) => map(r, "movie")),
    total_pages: Math.min(res.total_pages, 500),
    page: res.page,
  };
}

export interface DiscoverFilters {
  genre?: number | undefined;
  sort?: string | undefined;
  yearFrom?: number | undefined;
  yearTo?: number | undefined;
  minRating?: number | undefined;
  provider?: number | undefined;
}

function mapSort(type: MediaType, sort: string) {
  if (type === "tv" && sort.startsWith("primary_release_date")) {
    return sort.replace("primary_release_date", "first_air_date");
  }
  if (type === "tv" && sort === "revenue.desc") return "vote_count.desc";
  return sort;
}

export async function fetchDiscover(type: MediaType, page: number, filters: DiscoverFilters = {}) {
  const dateFrom = type === "movie" ? "primary_release_date.gte" : "first_air_date.gte";
  const dateTo = type === "movie" ? "primary_release_date.lte" : "first_air_date.lte";
  const params: Record<string, string | number> = {
    page,
    sort_by: mapSort(type, filters.sort ?? "popularity.desc"),
    include_adult: "false",
    "vote_count.gte": filters.minRating ? 300 : 50,
  };
  if (filters.genre) params["with_genres"] = filters.genre;
  if (filters.provider) {
    params["with_watch_providers"] = filters.provider;
    params["watch_region"] = "US";
  }
  if (filters.yearFrom) params[dateFrom] = `${filters.yearFrom}-01-01`;
  if (filters.yearTo) params[dateTo] = `${filters.yearTo}-12-31`;
  if (filters.minRating) params["vote_average.gte"] = filters.minRating;

  const res = await tmdb<{ results: RawItem[]; total_pages: number; page: number }>(`/discover/${type}`, params);
  return { results: list(res, type), total_pages: Math.min(res.total_pages, 500), page: res.page };
}

/** Major streaming services users recognise, matched against TMDB's US list. */
const CURATED_PROVIDERS: { match: string; display: string }[] = [
  { match: "Netflix", display: "Netflix" },
  { match: "Disney Plus", display: "Disney+" },
  { match: "Amazon Prime Video", display: "Prime Video" },
  { match: "Apple TV", display: "Apple TV+" },
  { match: "HBO Max", display: "HBO Max" },
  { match: "Max", display: "HBO Max" },
  { match: "Hulu", display: "Hulu" },
  { match: "Peacock Premium Plus", display: "Peacock" },
  { match: "Peacock Premium", display: "Peacock" },
  { match: "Paramount Plus Premium", display: "Paramount+" },
  { match: "Paramount Plus Essential", display: "Paramount+" },
  { match: "Paramount Plus", display: "Paramount+" },
  { match: "Paramount+", display: "Paramount+" },
];

export async function fetchProviders() {
  const res = await tmdb<{
    results?: { provider_id: number; provider_name: string; logo_path: string | null }[];
  }>("/watch/providers/movie", { watch_region: "US" });
  const byName = new Map<string, { provider_id: number; provider_name: string; logo_path: string | null }>();
  for (const p of res.results ?? []) {
    const curated = CURATED_PROVIDERS.find((c) => p.provider_name === c.match || p.provider_name.startsWith(c.match + " "));
    if (!p.logo_path || !curated) continue;
    const existing = byName.get(curated.display);
    // Prefer the standalone service over channel bundles (shorter name wins).
    if (!existing || p.provider_name.length < existing.provider_name.length) {
      byName.set(curated.display, { provider_id: p.provider_id, provider_name: curated.display, logo_path: p.logo_path });
    }
  }
  return CURATED_PROVIDERS.filter((c) => byName.has(c.display))
    .map((c) => byName.get(c.display)!)
    .map((p, i, arr) =>
      arr.findIndex((q) => q.provider_id === p.provider_id) === i
        ? { provider_id: p.provider_id, provider_name: p.provider_name, logo_path: p.logo_path ?? null }
        : { provider_id: -1, provider_name: "", logo_path: null },
    )
    .filter((p) => p.provider_id > 0);
}

export async function fetchMoodPick(type: MediaType, genreIds: number[]) {
  const params: Record<string, string | number> = {
    sort_by: "popularity.desc",
    include_adult: "false",
    "vote_count.gte": 200,
    "vote_average.gte": 6,
    with_genres: genreIds.join("|"),
    page: 1,
  };
  const first = await tmdb<{ results: RawItem[]; total_pages: number }>(`/discover/${type}`, params);
  const totalPages = Math.min(first.total_pages || 1, 8);
  const page = 1 + Math.floor(Math.random() * totalPages);
  const res =
    page === 1
      ? first
      : await tmdb<{ results: RawItem[]; total_pages: number }>(`/discover/${type}`, { ...params, page });
  const items = list(res, type).filter((i) => i.backdrop_path && i.overview);
  if (!items.length) return null;
  return items[Math.floor(Math.random() * items.length)] ?? null;
}

export async function fetchRecommendations(type: MediaType, id: number) {
  const res = await tmdb<{ results: RawItem[] }>(`/${type}/${id}/recommendations`, { page: 1 });
  let items = list(res, type);
  if (!items.length) {
    const sim = await tmdb<{ results: RawItem[] }>(`/${type}/${id}/similar`, { page: 1 });
    items = list(sim, type);
  }
  return items;
}

export async function fetchGenres(type: MediaType) {
  const res = await tmdb<{ genres: Genre[] }>(`/genre/${type}/list`);
  return res.genres;
}

export async function fetchSeason(id: number, season: number) {
  const res = await tmdb<{ episodes: Episode[]; name: string }>(`/tv/${id}/season/${season}`);
  return { name: res.name, episodes: res.episodes ?? [] };
}
