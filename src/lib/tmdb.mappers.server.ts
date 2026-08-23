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

export async function fetchDiscover(type: MediaType, page: number, genre?: number, sort = "popularity.desc") {
  const res = await tmdb<{ results: RawItem[]; total_pages: number; page: number }>(`/discover/${type}`, {
    page,
    sort_by: sort,
    with_genres: genre,
    include_adult: "false",
    "vote_count.gte": 50,
  });
  return { results: list(res, type), total_pages: Math.min(res.total_pages, 500), page: res.page };
}

export async function fetchGenres(type: MediaType) {
  const res = await tmdb<{ genres: Genre[] }>(`/genre/${type}/list`);
  return res.genres;
}

export async function fetchSeason(id: number, season: number) {
  const res = await tmdb<{ episodes: Episode[]; name: string }>(`/tv/${id}/season/${season}`);
  return { name: res.name, episodes: res.episodes ?? [] };
}
