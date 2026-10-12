export type MediaType = "movie" | "tv";

export interface MediaItem {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date: string | null;
  media_type: MediaType;
}

export interface Genre {
  id: number;
  name: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface Video {
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}

export interface Season {
  id: number;
  season_number: number;
  name: string;
  episode_count: number;
  poster_path: string | null;
  overview: string;
}

export interface Episode {
  id: number;
  episode_number: number;
  season_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  runtime: number | null;
  air_date: string | null;
  vote_average: number;
}

export interface MediaDetail extends MediaItem {
  tagline: string;
  runtime: number | null;
  status: string;
  genres: Genre[];
  seasons: Season[];
  number_of_seasons: number;
  cast: CastMember[];
  videos: Video[];
  similar: MediaItem[];
  homepage: string | null;
}

const IMG = "https://image.tmdb.org/t/p";

export interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
}

export function img(
  path: string | null | undefined,
  size: "w154" | "w185" | "w342" | "w500" | "w780" | "w1280" | "original" = "w500",
) {
  if (!path) return null;
  return `${IMG}/${size}${path}`;
}

export function year(date: string | null | undefined) {
  return date ? date.slice(0, 4) : "";
}

export function runtimeLabel(mins: number | null | undefined) {
  if (!mins) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}
