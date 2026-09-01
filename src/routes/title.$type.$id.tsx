import { Img } from "@/components/Img";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Play, Plus, Check, Star, Calendar, Clock } from "lucide-react";
import { getDetail, getSeason } from "@/lib/tmdb.functions";
import { img, runtimeLabel, year, type MediaType } from "@/lib/tmdb";
import { MediaCard } from "@/components/MediaCard";
import { useMyList } from "@/lib/my-list";

const detailQuery = (type: MediaType, id: number) =>
  queryOptions({
    queryKey: ["detail", type, id],
    queryFn: () => getDetail({ data: { type, id } }),
    staleTime: 1000 * 60 * 30,
  });

export const Route = createFileRoute("/title/$type/$id")({
  loader: async ({ context, params }) => {
    if (params.type !== "movie" && params.type !== "tv") throw notFound();
    const id = Number(params.id);
    if (!Number.isFinite(id)) throw notFound();
    return context.queryClient.ensureQueryData(detailQuery(params.type, id));
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Title unavailable | Lumiere" }, { name: "robots", content: "noindex" }] };
    const desc = (loaderData.overview || `Watch ${loaderData.title} on Lumiere.`).slice(0, 155);
    const image = img(loaderData.backdrop_path, "w1280");
    return {
      meta: [
        { title: `${loaderData.title} (${year(loaderData.release_date)}) | Lumiere` },
        { name: "description", content: desc },
        { property: "og:title", content: `${loaderData.title} | Lumiere` },
        { property: "og:description", content: desc },
        ...(image
          ? [
              { property: "og:image", content: image },
              { name: "twitter:image", content: image },
            ]
          : []),
      ],
    };
  },
  component: TitlePage,
});

function TitlePage() {
  const params = Route.useParams();
  const type = params.type as MediaType;
  const id = Number(params.id);
  const { data } = useSuspenseQuery(detailQuery(type, id));
  const { has, toggle } = useMyList();
  const saved = has(id, type);

  const [season, setSeason] = useState(data.seasons[0]?.season_number ?? 1);
  const seasonQuery = useQuery({
    queryKey: ["season", id, season],
    queryFn: () => getSeason({ data: { id, season } }),
    enabled: type === "tv" && data.seasons.length > 0,
  });

  const backdrop = img(data.backdrop_path, "original");
  const poster = img(data.poster_path, "w500");

  return (
    <div className="pb-16">
      <div className="relative min-h-[68vh] w-full">
        {backdrop && <Img src={backdrop} alt={`${data.title} backdrop`} className="absolute inset-0 h-full w-full object-cover" />}
        <div className="absolute inset-0 side-fade" />
        <div className="absolute inset-0 hero-fade" />

        <div className="relative flex min-h-[68vh] flex-col justify-end gap-6 px-4 pb-10 pt-28 md:flex-row md:items-end md:px-10">
          {poster && (
            <Img
              src={poster}
              alt={`${data.title} poster`}
              className="hidden w-52 rounded-xl shadow-poster md:block"
            />
          )}
          <div className="max-w-2xl">
            <h1 className="text-4xl font-extrabold md:text-5xl">{data.title}</h1>
            {data.tagline && <p className="mt-2 italic text-primary">{data.tagline}</p>}

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1 text-primary">
                <Star className="h-4 w-4 fill-current" /> {data.vote_average.toFixed(1)}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" /> {year(data.release_date) || "TBA"}
              </span>
              {data.runtime ? (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" /> {runtimeLabel(data.runtime)}
                </span>
              ) : null}
              {type === "tv" && data.number_of_seasons > 0 && <span>{data.number_of_seasons} seasons</span>}
              <span className="rounded border border-border px-1.5 py-0.5 text-xs">HD</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {data.genres.map((g) => (
                <span key={g.id} className="rounded-full border border-border bg-surface/70 px-3 py-1 text-xs">
                  {g.name}
                </span>
              ))}
            </div>

            <p className="mt-5 text-sm text-foreground/85 md:text-base">{data.overview}</p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/watch/$type/$id"
                params={{ type, id: String(id) }}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-transform hover:scale-105"
              >
                <Play className="h-4 w-4 fill-current" /> Play
              </Link>
              <button
                onClick={() =>
                  toggle({
                    id: data.id,
                    title: data.title,
                    overview: data.overview,
                    poster_path: data.poster_path,
                    backdrop_path: data.backdrop_path,
                    vote_average: data.vote_average,
                    release_date: data.release_date,
                    media_type: type,
                  })
                }
                className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-6 py-3 text-sm font-semibold backdrop-blur transition-colors hover:bg-surface-2"
              >
                {saved ? <Check className="h-4 w-4 text-primary" /> : <Plus className="h-4 w-4" />}
                {saved ? "In my list" : "Add to my list"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {type === "tv" && data.seasons.length > 0 && (
        <section className="px-4 py-8 md:px-10">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-bold">Episodes</h2>
            <select
              value={season}
              onChange={(e) => setSeason(Number(e.target.value))}
              className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none"
              aria-label="Select season"
            >
              {data.seasons.map((s) => (
                <option key={s.id} value={s.season_number}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-5 flex flex-col gap-3">
            {(seasonQuery.data?.episodes ?? []).map((ep) => (
              <Link
                key={ep.id}
                to="/watch/$type/$id"
                params={{ type: "tv", id: String(id) }}
                search={{ s: ep.season_number, e: ep.episode_number }}
                className="group flex gap-4 rounded-xl border border-border bg-surface/60 p-3 transition-colors hover:bg-surface-2"
              >
                <div className="aspect-video w-40 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                  {img(ep.still_path, "w342") && (
                    <Img src={img(ep.still_path, "w342")} alt={ep.name} loading="lazy" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {ep.episode_number}. {ep.name}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {ep.air_date ?? "TBA"} {ep.runtime ? `· ${runtimeLabel(ep.runtime)}` : ""}
                  </p>
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{ep.overview}</p>
                </div>
              </Link>
            ))}
            {seasonQuery.isLoading && <p className="text-sm text-muted-foreground">Loading episodes…</p>}
          </div>
        </section>
      )}

      {data.cast.length > 0 && (
        <section className="px-4 py-8 md:px-10">
          <h2 className="text-xl font-bold">Cast</h2>
          <div className="no-scrollbar mt-4 flex gap-4 overflow-x-auto pb-2">
            {data.cast.map((c) => (
              <div key={c.id} className="w-28 shrink-0 text-center">
                <div className="aspect-square w-28 overflow-hidden rounded-full bg-surface-2">
                  {img(c.profile_path, "w185") ? (
                    <Img src={img(c.profile_path, "w185")} alt={c.name} loading="lazy" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <p className="mt-2 truncate text-xs font-semibold">{c.name}</p>
                <p className="truncate text-xs text-muted-foreground">{c.character}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.similar.length > 0 && (
        <section className="px-4 py-8 md:px-10">
          <h2 className="text-xl font-bold">More like this</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {data.similar.map((s) => (
              <MediaCard key={`${s.media_type}-${s.id}`} item={s} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
