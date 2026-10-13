import { Img } from "@/components/Img";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Info, Play, Film, Maximize, Minimize } from "lucide-react";
import { z } from "zod";
import { getDetail, getSeason } from "@/lib/tmdb.functions";
import { getStreamSources } from "@/lib/stream.functions";
import { img, runtimeLabel, year, type MediaType } from "@/lib/tmdb";
import { recordWatch, type HistoryEntry } from "@/lib/my-list";

const searchSchema = z.object({
  s: z.number().int().min(1).optional(),
  e: z.number().int().min(1).optional(),
  v: z.string().max(40).optional(),
});

const detailQuery = (type: MediaType, id: number) =>
  queryOptions({
    queryKey: ["detail", type, id],
    queryFn: () => getDetail({ data: { type, id } }),
    staleTime: 1000 * 60 * 30,
  });

export const Route = createFileRoute("/watch/$type/$id")({
  validateSearch: searchSchema,
  loader: async ({ context, params }) => {
    if (params.type !== "movie" && params.type !== "tv") throw notFound();
    const id = Number(params.id);
    if (!Number.isFinite(id)) throw notFound();
    return context.queryClient.ensureQueryData(detailQuery(params.type, id));
  },
  head: ({ loaderData }) => {
    if (!loaderData)
      return { meta: [{ title: "Player unavailable | Lumiere" }, { name: "robots", content: "noindex" }] };
    const title = `Watch ${loaderData.title} | Lumiere`;
    const desc = (loaderData.overview || `Stream ${loaderData.title} on Lumiere.`).slice(0, 155);
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  component: WatchPage,
});

function WatchPage() {
  const params = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const type = params.type as MediaType;
  const id = Number(params.id);
  const { data } = useSuspenseQuery(detailQuery(type, id));

  const playable = data.videos.filter((v) => ["Trailer", "Teaser", "Clip", "Featurette"].includes(v.type));
  const active = playable.find((v) => v.key === search.v) ?? playable[0];

  const seasonNumber = search.s ?? data.seasons[0]?.season_number ?? 1;
  const seasonData = useQuery({
    queryKey: ["season", id, seasonNumber],
    queryFn: () => getSeason({ data: { id, season: seasonNumber } }),
    enabled: type === "tv" && data.seasons.length > 0,
  });
  const episodes = seasonData.data?.episodes ?? [];
  const currentEp = episodes.find((ep) => ep.episode_number === search.e) ?? episodes[0];

  const [mode, setMode] = useState<"full" | "trailer">("full");
  const [sourceIndex, setSourceIndex] = useState(0);
  const playerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () =>
      setIsFullscreen(
        Boolean(
          document.fullscreenElement ??
            (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement,
        ),
      );
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, []);

  // Escape also exits our CSS-based fallback fullscreen.
  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.fullscreenElement) setIsFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFullscreen]);

  const toggleFullscreen = async () => {
    const doc = document as Document & { webkitExitFullscreen?: () => Promise<void> };
    const el = playerRef.current as (HTMLDivElement & {
      webkitRequestFullscreen?: () => Promise<void>;
    }) | null;

    if (document.fullscreenElement || (doc as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement) {
      await (document.exitFullscreen?.() ?? doc.webkitExitFullscreen?.() ?? Promise.resolve()).catch(() => {});
      setIsFullscreen(false);
      return;
    }
    if (!el) return;
    try {
      await (el.requestFullscreen?.() ?? el.webkitRequestFullscreen?.() ?? Promise.reject());
      setIsFullscreen(true);
    } catch {
      // iOS Safari blocks element fullscreen: fall back to a full-viewport layer.
      setIsFullscreen(true);
    }
  };
  const episodeNumber = currentEp?.episode_number ?? search.e ?? 1;

  // Record into Continue Watching, updating progress while the page is open.
  useEffect(() => {
    const totalSecs = (data.runtime ?? (type === "tv" ? 45 : 120)) * 60;
    const start = Date.now();
    const episodeLabel =
      type === "tv"
        ? `S${seasonNumber} E${episodeNumber}${currentEp?.name ? ` — ${currentEp.name}` : ""}`
        : undefined;
    const save = () => {
      const elapsed = (Date.now() - start) / 1000;
      const progress = Math.max(2, Math.min(95, (elapsed / totalSecs) * 100));
      const entry: Omit<HistoryEntry, "watchedAt"> = {
        id,
        media_type: type,
        title: data.title,
        overview: data.overview,
        poster_path: data.poster_path,
        backdrop_path: data.backdrop_path,
        vote_average: data.vote_average,
        release_date: data.release_date,
        progress,
      };
      if (episodeLabel) entry["episodeLabel"] = episodeLabel;
      recordWatch(entry);
    };
    save();
    const interval = window.setInterval(save, 15000);
    return () => {
      window.clearInterval(interval);
      save();
    };
  }, [type, id, seasonNumber, episodeNumber, currentEp?.name, data.title, data.overview, data.poster_path, data.backdrop_path, data.vote_average, data.release_date, data.runtime]);
  const stream = useQuery({
    queryKey: ["stream", type, id, type === "tv" ? seasonNumber : 0, type === "tv" ? episodeNumber : 0],
    queryFn: () =>
      getStreamSources({
        data:
          type === "tv"
            ? { type, id, season: seasonNumber, episode: episodeNumber }
            : { type, id },
      }),
    staleTime: 1000 * 60 * 10,
  });
  // Multiple frameable players, best-first; auto-failover picks the next one
  // if the current server never renders.
  const sources = (stream.data?.sources ?? []).map((s, i) => ({
    name: s.name || `Server ${i + 1}`,
    url: s.url,
  }));


  const sourceKey = sources.map((s) => s.url).join("|");
  const activeSource = sources[sourceIndex] ?? sources[0];
  const playerUrl = activeSource?.url ?? null;

  // Always start on the best-ranked server whenever the title/episode changes.
  useEffect(() => {
    setSourceIndex(0);
  }, [sourceKey]);

  // If the chosen server never renders, silently roll over to the next one.
  const [frameLoaded, setFrameLoaded] = useState(false);
  useEffect(() => {
    setFrameLoaded(false);
  }, [playerUrl]);
  useEffect(() => {
    if (frameLoaded || !playerUrl || mode !== "full") return;
    const total = sources.length;
    const timer = window.setTimeout(() => {
      setSourceIndex((i) => (i + 1 < total ? i + 1 : i));
    }, 9000);
    return () => window.clearTimeout(timer);
  }, [frameLoaded, playerUrl, mode, sources.length]);

  return (
    <div className="min-h-screen pb-16 pt-20">
      <div className="px-4 md:px-10">
        <Link
          to="/title/$type/$id"
          params={{ type, id: String(id) }}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to details
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 px-4 md:px-10">
        <button
          onClick={() => setMode("full")}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
            mode === "full" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface/60 hover:bg-surface-2"
          }`}
        >
          <Film className="h-4 w-4" /> {type === "tv" ? "Full episode" : "Full movie"}
        </button>
        <button
          onClick={() => setMode("trailer")}
          disabled={playable.length === 0}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-40 ${
            mode === "trailer" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface/60 hover:bg-surface-2"
          }`}
        >
          <Play className="h-4 w-4 fill-current" /> Trailers
        </button>
      </div>

      <div className="mt-4 bg-black md:px-0">
        <div
          ref={playerRef}
          className={`relative w-full bg-black ${
            isFullscreen
              ? "fixed inset-0 z-50 h-screen max-w-none"
              : "mx-auto aspect-video max-w-6xl"
          }`}
        >
          <button
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "Exit full screen" : "Watch full screen"}
            className="absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition-colors hover:bg-black/90"
          >
            {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
            {isFullscreen ? "Exit" : "Full screen"}
          </button>
          {mode === "full" ? (
            playerUrl ? (
              <iframe
                key={playerUrl}
                src={playerUrl}
                title={`${data.title} — full stream`}
                referrerPolicy="origin"
                onLoad={() => setFrameLoaded(true)}


                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                className="h-full w-full border-0"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-center">
                <Info className="h-6 w-6 text-primary" />
                <p className="text-sm text-muted-foreground">
                  {stream.isLoading ? "Loading player…" : stream.data?.error ?? "This title is not available to stream right now."}
                </p>
              </div>
            )
          ) : active ? (
            <iframe
              key={active.key}
              src={`https://www.youtube-nocookie.com/embed/${active.key}?autoplay=1&rel=0&modestbranding=1`}
              title={`${data.title} — ${active.name}`}
              sandbox="allow-scripts allow-same-origin allow-presentation"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              className="h-full w-full border-0"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-center">
              <Info className="h-6 w-6 text-primary" />
              <p className="text-sm text-muted-foreground">No trailer is available for this title yet.</p>
            </div>
          )}
        </div>
      </div>

      {mode === "full" && (
        <div className="mt-3 flex flex-wrap items-center gap-2 px-4 md:px-10">
          {sources.length > 1 &&
            sources.map((s, i) => (
              <button
                key={s.url}
                onClick={() => setSourceIndex(i)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  i === sourceIndex ? "border-primary bg-surface-2" : "border-border bg-surface/60 hover:bg-surface-2"
                }`}
              >
                {s.name || `Server ${i + 1}`}
              </button>
            ))}
          {playerUrl && (
            <a
              href={playerUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-border bg-surface/60 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-surface-2"
            >
              Open player in new tab
            </a>
          )}
          <span className="text-xs text-muted-foreground">If one server is unavailable, choose another source.</span>
        </div>
      )}

      <div className="px-4 pt-6 md:px-10">
        <h1 className="text-2xl font-extrabold md:text-3xl">
          {data.title}
          {type === "tv" && currentEp ? ` · S${seasonNumber}E${currentEp.episode_number} — ${currentEp.name}` : ""}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>{year(data.release_date) || "TBA"}</span>
          {data.runtime ? <span>{runtimeLabel(data.runtime)}</span> : null}
          <span className="rounded border border-border px-1.5 py-0.5 text-xs uppercase">{type}</span>
          {active && <span className="rounded border border-border px-1.5 py-0.5 text-xs">{active.type}</span>}
        </div>
        <p className="mt-4 max-w-3xl text-sm text-foreground/80">
          {currentEp?.overview || data.overview}
        </p>
      </div>

      {playable.length > 1 && (
        <section className="px-4 py-8 md:px-10">
          <h2 className="text-lg font-bold">Videos</h2>
          <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto pb-2">
            {playable.map((v) => (
              <button
                key={v.key}
                onClick={() => { setMode("trailer"); navigate({ search: (prev) => ({ ...prev, v: v.key }) }); }}
                className={`w-56 shrink-0 rounded-xl border p-3 text-left transition-colors ${
                  active?.key === v.key ? "border-primary bg-surface-2" : "border-border bg-surface/60 hover:bg-surface-2"
                }`}
              >
                <span className="flex items-center gap-2 text-xs font-semibold">
                  <Play className="h-3 w-3 fill-current text-primary" /> {v.type}
                </span>
                <span className="mt-1 line-clamp-2 block text-sm">{v.name}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {type === "tv" && data.seasons.length > 0 && (
        <section className="px-4 py-8 md:px-10">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-bold">Episodes</h2>
            <select
              value={seasonNumber}
              onChange={(ev) => navigate({ search: (prev) => ({ ...prev, s: Number(ev.target.value), e: 1 }) })}
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
            {episodes.map((ep) => (
              <button
                key={ep.id}
                onClick={() => navigate({ search: (prev) => ({ ...prev, s: ep.season_number, e: ep.episode_number }) })}
                className={`flex gap-4 rounded-xl border p-3 text-left transition-colors ${
                  currentEp?.id === ep.id ? "border-primary bg-surface-2" : "border-border bg-surface/60 hover:bg-surface-2"
                }`}
              >
                <div className="aspect-video w-28 shrink-0 overflow-hidden rounded-lg bg-surface-2 sm:w-40">
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
              </button>
            ))}
            {seasonData.isLoading && <p className="text-sm text-muted-foreground">Loading episodes…</p>}
          </div>
        </section>
      )}
    </div>
  );
}
