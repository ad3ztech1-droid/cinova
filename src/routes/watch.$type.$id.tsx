import { Img } from "@/components/Img";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Info, Play, Film, Maximize, Minimize } from "lucide-react";
import { z } from "zod";
import { getDetail, getSeason } from "@/lib/tmdb.functions";
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

const CINESRC_ORIGIN = "https://cinesrc.st";

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

  // Single CineSrc player. The accent colour matches the Lumiere gold.
  const cinesrcUrlFor = useCallback(
    (season: number, episode: number) => {
      const params = new URLSearchParams({
        color: "#D9B45B",
        autonext: "true",
        autoplay: "true",
      });
      const base =
        type === "tv"
          ? `${CINESRC_ORIGIN}/embed/tv/${id}?s=${season}&e=${episode}`
          : `${CINESRC_ORIGIN}/embed/movie/${id}`;
      return `${base}${base.includes("?") ? "&" : "?"}${params.toString()}`;
    },
    [type, id],
  );

  const cinesrcUrl = useMemo(() => cinesrcUrlFor(seasonNumber, episodeNumber), [cinesrcUrlFor, seasonNumber, episodeNumber]);

  // The iframe keeps its own lifecycle: URL changes only on user-driven
  // navigation or a player-initiated episode switch we must load ourselves.
  const [iframeUrl, setIframeUrl] = useState(cinesrcUrl);
  const [frameKey, setFrameKey] = useState(0);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [showLoading, setShowLoading] = useState(true);
  const suppressSyncRef = useRef<string | null>(null);
  const progressRef = useRef<{ currentTime: number; duration: number } | null>(null);

  useEffect(() => {
    if (suppressSyncRef.current === cinesrcUrl) {
      // Player switched episodes internally; the iframe must not be replaced.
      suppressSyncRef.current = null;
      return;
    }
    setIframeUrl(cinesrcUrl);
  }, [cinesrcUrl]);

  useEffect(() => {
    setStreamError(null);
    setPlayerReady(false);
    setShowLoading(true);
    const fallback = window.setTimeout(() => setShowLoading(false), 10000);
    return () => window.clearTimeout(fallback);
  }, [iframeUrl, frameKey]);

  // CineSrc player events: readiness, real playback progress, errors and
  // episode changes inside the player.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== CINESRC_ORIGIN) return;
      const payload = event.data as {
        type?: string;
        error?: unknown;
        currentTime?: number;
        duration?: number;
        season?: number;
        episode?: number;
        internalNavigation?: boolean;
      } | null;
      if (!payload || typeof payload !== "object") return;
      if (typeof payload.type !== "string" || !payload.type.startsWith("cinesrc:")) return;

      switch (payload.type) {
        case "cinesrc:ready":
          setPlayerReady(true);
          setShowLoading(false);
          break;
        case "cinesrc:play":
          setShowLoading(false);
          break;
        case "cinesrc:timeupdate":
          if (
            typeof payload.currentTime === "number" &&
            typeof payload.duration === "number" &&
            payload.duration > 0
          ) {
            progressRef.current = { currentTime: payload.currentTime, duration: payload.duration };
          }
          break;
        case "cinesrc:error": {
          const message =
            typeof payload.error === "string" && payload.error
              ? payload.error
              : "This title is not available to stream right now.";
          setStreamError(message);
          setShowLoading(false);
          break;
        }
        case "cinesrc:nextepisode": {
          const s = typeof payload.season === "number" ? payload.season : undefined;
          const e = typeof payload.episode === "number" ? payload.episode : undefined;
          if (!s || !e) break;
          if (payload.internalNavigation) {
            // Player already switched: sync the page only, never reload the iframe.
            suppressSyncRef.current = cinesrcUrlFor(s, e);
          } else {
            setFrameKey((k) => k + 1);
            setIframeUrl(cinesrcUrlFor(s, e));
          }
          navigate({ search: (prev) => ({ ...prev, s, e }) });
          break;
        }
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [navigate, cinesrcUrlFor]);

  // Record into Continue Watching, preferring the player's real playback time.
  useEffect(() => {
    const totalSecs = (data.runtime ?? (type === "tv" ? 45 : 120)) * 60;
    const start = Date.now();
    const episodeLabel =
      type === "tv"
        ? `S${seasonNumber} E${episodeNumber}${currentEp?.name ? ` — ${currentEp.name}` : ""}`
        : undefined;
    const save = () => {
      const live = progressRef.current;
      const elapsed = (Date.now() - start) / 1000;
      const progress = live && live.duration > 0
        ? Math.max(2, Math.min(95, (live.currentTime / live.duration) * 100))
        : Math.max(2, Math.min(95, (elapsed / totalSecs) * 100));
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

  const retryPlayback = () => {
    setStreamError(null);
    setPlayerReady(false);
    setFrameKey((k) => k + 1);
  };

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
          className={`inline-flex items-center gap-2 px-1 py-2 text-sm font-semibold transition-colors ${
            mode === "full" ? "text-primary underline underline-offset-8" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Film className="h-4 w-4" /> {type === "tv" ? "Full episode" : "Full movie"}
        </button>
        <button
          onClick={() => setMode("trailer")}
          disabled={playable.length === 0}
          className={`inline-flex items-center gap-2 px-1 py-2 text-sm font-semibold transition-colors disabled:opacity-40 ${
            mode === "trailer" ? "text-primary underline underline-offset-8" : "text-muted-foreground hover:text-foreground"
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
            className="absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 px-2 py-1.5 text-xs font-semibold text-foreground drop-shadow-md transition-colors hover:text-primary"
          >
            {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
            {isFullscreen ? "Exit" : "Full screen"}
          </button>
          {mode === "full" ? (
            iframeUrl ? (
              <iframe
                key={frameKey}
                src={iframeUrl}
                title={`${data.title} — full stream`}
                referrerPolicy="origin"
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                allowFullScreen
                className="h-full w-full border-0"
              />
            ) : null
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
          {mode === "full" && showLoading && !streamError && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">{playerReady ? "" : "Loading player…"}</p>
            </div>
          )}
        </div>
      </div>

      {mode === "full" && streamError && (
        <div className="mt-3 flex flex-wrap items-center gap-3 px-4 md:px-10">
          <Info className="h-4 w-4 text-primary" />
          <span className="text-xs text-muted-foreground">{streamError}</span>
          <button
            onClick={retryPlayback}
            className="text-xs font-semibold text-primary underline underline-offset-4 transition-colors hover:text-foreground"
          >
            Try again
          </button>
          {iframeUrl && (
            <a
              href={iframeUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-muted-foreground underline underline-offset-4 transition-colors hover:text-primary"
            >
              Open player in new tab
            </a>
          )}
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
          <span className="text-xs uppercase tracking-wider">{type}</span>
          {active && <span className="text-xs">{active.type}</span>}
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
                className={`w-56 shrink-0 p-1 text-left transition-colors ${
                  active?.key === v.key ? "text-primary" : "text-muted-foreground hover:text-foreground"
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
              className="border-b border-border bg-transparent py-1 pr-2 text-sm outline-none"
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
                className={`flex gap-4 border-b border-border/60 p-1 text-left transition-colors last:border-0 ${
                  currentEp?.id === ep.id ? "text-primary" : "hover:text-primary"
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
