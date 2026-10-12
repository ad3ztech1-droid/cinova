import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  fetchHome,
  fetchDetail,
  fetchSearch,
  fetchDiscover,
  fetchGenres,
  fetchSeason,
  fetchMoodPick,
  fetchRecommendations,
  fetchProviders,
} from "./tmdb.mappers.server";

export const getHome = createServerFn({ method: "GET" }).handler(async () => fetchHome());

export const getDetail = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ type: z.enum(["movie", "tv"]), id: z.number().int().positive() }).parse(d))
  .handler(async ({ data }) => fetchDetail(data.type, data.id));

export const searchMedia = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ q: z.string().max(120), page: z.number().int().min(1).max(500).default(1) }).parse(d))
  .handler(async ({ data }) => fetchSearch(data.q, data.page));

export const discover = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z
      .object({
        type: z.enum(["movie", "tv"]),
        genre: z.number().int().optional(),
        sort: z.string().max(40).default("popularity.desc"),
        yearFrom: z.number().int().min(1900).max(2100).optional(),
        yearTo: z.number().int().min(1900).max(2100).optional(),
        minRating: z.number().min(0).max(10).optional(),
        provider: z.number().int().positive().optional(),
        page: z.number().int().min(1).max(500).default(1),
      })
      .parse(d),
  )
  .handler(async ({ data }) =>
    fetchDiscover(data.type, data.page, {
      genre: data.genre,
      sort: data.sort,
      yearFrom: data.yearFrom,
      yearTo: data.yearTo,
      minRating: data.minRating,
      provider: data.provider,
    }),
  );

export const moodShuffle = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z
      .object({
        type: z.enum(["movie", "tv"]),
        genres: z.array(z.number().int()).min(1).max(4),
      })
      .parse(d),
  )
  .handler(async ({ data }) => fetchMoodPick(data.type, data.genres));

export const tasteMix = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z
      .object({
        picks: z
          .array(z.object({ type: z.enum(["movie", "tv"]), id: z.number().int().positive() }))
          .min(1)
          .max(3),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const picked = new Set(data.picks.map((p) => `${p.type}-${p.id}`));
    const lists = await Promise.all(data.picks.map((p) => fetchRecommendations(p.type, p.id)));
    const score = new Map<string, { item: (typeof lists)[number][number]; hits: number }>();
    for (const items of lists) {
      for (const item of items) {
        const key = `${item.media_type}-${item.id}`;
        if (picked.has(key)) continue;
        const entry = score.get(key);
        if (entry) entry.hits += 1;
        else score.set(key, { item, hits: 1 });
      }
    }
    return [...score.values()]
      .sort((a, b) => b.hits - a.hits || b.item.vote_average - a.item.vote_average)
      .slice(0, 18)
      .map((e) => e.item);
  });

export const getGenres = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ type: z.enum(["movie", "tv"]) }).parse(d))
  .handler(async ({ data }) => fetchGenres(data.type));

export const getProviders = createServerFn({ method: "GET" }).handler(async () => fetchProviders());

export const getSeason = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ id: z.number().int().positive(), season: z.number().int().min(0) }).parse(d))
  .handler(async ({ data }) => fetchSeason(data.id, data.season));
