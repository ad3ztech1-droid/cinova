import { Img } from "@/components/Img";
import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Play } from "lucide-react";
import { getHome } from "@/lib/tmdb.functions";
import { Hero } from "@/components/Hero";
import { MediaRow } from "@/components/MediaRow";
import { useContinueWatching } from "@/lib/my-list";
import { img } from "@/lib/tmdb";

const homeQuery = queryOptions({
  queryKey: ["home"],
  queryFn: () => getHome(),
  staleTime: 1000 * 60 * 10,
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(homeQuery),
  head: () => ({
    meta: [
      { title: "Lumiere — Stream Movies & Series in HD" },
      {
        name: "description",
        content:
          "Watch trending movies and TV series on Lumiere. Browse thousands of titles, play trailers instantly and build your own watchlist.",
      },
      { property: "og:title", content: "Lumiere — Stream Movies & Series in HD" },
      {
        property: "og:description",
        content: "Trending movies, top-rated series and instant trailers — all in one streaming home.",
      },
    ],
  }),
  component: Home,
});

function ContinueWatching() {
  const items = useContinueWatching();
  if (!items.length) return null;
  return (
    <section className="py-8 md:py-10">
      <div className="mb-6 flex items-baseline gap-4 px-5 md:px-12 lg:px-16"><h2 className="font-display text-3xl md:text-4xl">Continue watching</h2><span className="hidden text-xs uppercase tracking-[0.18em] text-muted-foreground sm:inline">Pick up where you left off</span></div>
      <div className="no-scrollbar flex gap-5 overflow-x-auto px-5 pb-2 md:px-12 lg:px-16">
        {items.map((i) => (
          <Link
            key={`${i.media_type}-${i.id}`}
            to="/watch/$type/$id"
            params={{ type: i.media_type, id: String(i.id) }}
            search={((): Record<string, number> => {
              const label = i.episodeLabel;
              if (!label?.includes("E")) return {};
              const parts = label.split(" ");
              const s = Number(parts[0]?.replace("S", "") || 0);
              const e = Number(parts[1]?.split("E")[1]?.split(" —")[0] || 0);
              return s && e ? { s, e } : {};
            })()}
            className="group relative w-[78vw] max-w-sm shrink-0 overflow-hidden rounded-sm bg-surface shadow-poster md:w-80"
          >
            <div className="aspect-video w-full bg-surface-2">
              {img(i.backdrop_path, "w780") && (
                <Img src={img(i.backdrop_path, "w780")} alt={i.title} className="h-full w-full object-cover" />
              )}
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-background/40 opacity-0 transition-opacity group-hover:opacity-100">
              <Play className="h-9 w-9 fill-current text-primary" />
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background to-transparent p-3">
              <p className="truncate text-sm font-semibold">{i.title}</p>
              {i.episodeLabel && <p className="truncate text-xs text-muted-foreground">{i.episodeLabel}</p>}
              <div className="mt-2 h-1 w-full rounded-full bg-border">
                <div className="h-1 rounded-full bg-primary" style={{ width: `${Math.min(100, i.progress)}%` }} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Home() {
  const { data } = useSuspenseQuery(homeQuery);
  return (
    <div className="pb-8">
      <Hero items={data.trending} />
      <div className="relative z-10 -mt-20">
        <ContinueWatching />
        <MediaRow title="Trending now" items={data.trending} />
        <MediaRow title="In theatres" items={data.nowPlaying} />
        <MediaRow title="Popular movies" items={data.popularMovies} />
        <MediaRow title="Popular series" items={data.popularTv} />
        <MediaRow title="Top rated movies" items={data.topMovies} />
        <MediaRow title="Critically acclaimed series" items={data.topTv} />
        <MediaRow title="Coming soon" items={data.upcoming} />
      </div>
    </div>
  );
}
