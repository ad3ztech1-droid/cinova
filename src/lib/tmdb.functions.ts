import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  fetchHome,
  fetchDetail,
  fetchSearch,
  fetchDiscover,
  fetchGenres,
  fetchSeason,
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
    }),
  );

export const getGenres = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ type: z.enum(["movie", "tv"]) }).parse(d))
  .handler(async ({ data }) => fetchGenres(data.type));

export const getSeason = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ id: z.number().int().positive(), season: z.number().int().min(0) }).parse(d))
  .handler(async ({ data }) => fetchSeason(data.id, data.season));
