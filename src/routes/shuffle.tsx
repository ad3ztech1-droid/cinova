import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Clapperboard, Dices, Loader2, Play, Star } from "lucide-react";
import { moodShuffle } from "@/lib/tmdb.functions";
import { img, year, type MediaItem, type MediaType } from "@/lib/tmdb";
import { Img } from "@/components/Img";

export const Route = createFileRoute("/shuffle")({
  head: () => ({
    meta: [
      { title: "Mood Shuffle — Lumiere" },
      { name: "description", content: "Can't decide what to watch? Pick a mood and let Lumiere surprise you with the perfect movie or series." },
      { property: "og:title", content: "Mood Shuffle — Lumiere" },
      { property: "og:description", content: "Pick a mood, get a surprise pick tailored to it." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ShufflePage,
});

const MOODS: { id: string; label: string; movie: number[]; tv: number[] }[] = [
  { id: "feelgood", label: "Feel-good", movie: [35, 10751], tv: [35, 10751] },
  { id: "laugh", label: "Make me laugh", movie: [35], tv: [35] },
  { id: "thrilling", label: "Edge of my seat", movie: [53, 28], tv: [10759, 80] },
  { id: "scary", label: "Scare me", movie: [27], tv: [9648] },
  { id: "romantic", label: "Romantic", movie: [10749], tv: [18] },
  { id: "mindbending", label: "Mind-bending", movie: [878, 9648], tv: [10765, 9648] },
  { id: "epic", label: "Epic adventure", movie: [12, 14], tv: [10759, 10765] },
  { id: "cozy", label: "Cozy drama", movie: [18, 10751], tv: [18, 10751] },
];

function ShufflePage() {
  const [mood, setMood] = useState(MOODS[0]!);
  const [type, setType] = useState<MediaType>("movie");
  const [pick, setPick] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [shuffling, setShuffling] = useState(false);

  const shuffle = async () => {
    setLoading(true);
    setShuffling(true);
    try {
      const result = await moodShuffle({ data: { type, genres: type === "movie" ? mood.movie : mood.tv } });
      // brief suspense beat before the reveal
      setTimeout(() => {
        setPick(result);
        setShuffling(false);
        setLoading(false);
      }, 900);
    } catch {
      setShuffling(false);
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-5 pb-16 pt-28 md:px-12 md:pt-36">
      <p className="text-xs uppercase tracking-[0.3em] text-primary">Lumiere originals</p>
      <h1 className="mt-2 font-display text-4xl md:text-6xl">Mood Shuffle</h1>
      <p className="mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
        No endless scrolling. Tell us how you feel and we'll deal you one perfect pick.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        {MOODS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMood(m)}
            className={`px-1 py-2 text-xs font-semibold transition-colors ${
              mood.id === m.id
                ? "text-primary underline underline-offset-8"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-2">
        {(["movie", "tv"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`px-1 py-2 text-xs font-semibold transition-colors ${
              type === t
                ? "text-primary underline underline-offset-8"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "movie" ? "Movies" : "Series"}
          </button>
        ))}
        <button
          type="button"
          onClick={shuffle}
          disabled={loading}
          className="ml-auto inline-flex items-center gap-2 px-2 py-3 text-sm font-bold text-primary underline-offset-8 transition-colors hover:underline disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Dices className="h-4 w-4" />}
          {pick ? "Shuffle again" : "Deal me a pick"}
        </button>
      </div>

      <div className="mt-10">
        {shuffling && (
          <div className="flex aspect-video w-full items-center justify-center rounded-sm border border-border bg-surface">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Dices className="h-10 w-10 animate-bounce text-primary" />
              <p className="text-xs uppercase tracking-[0.3em]">Shuffling…</p>
            </div>
          </div>
        )}

        {!shuffling && pick && (
          <div className="relative overflow-hidden rounded-sm border border-border bg-surface shadow-poster">
            <div className="relative aspect-video w-full">
              <Img src={img(pick.backdrop_path, "w1280")} alt={pick.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
            </div>
            <div className="relative -mt-24 p-6 md:-mt-32 md:p-10">
              <p className="text-xs uppercase tracking-[0.3em] text-primary">
                Your {mood.label.toLowerCase()} pick
              </p>
              <h2 className="mt-2 font-display text-3xl md:text-5xl">{pick.title}</h2>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span>{year(pick.release_date)}</span>
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                  {pick.vote_average.toFixed(1)}
                </span>
                <span>{pick.media_type === "tv" ? "Series" : "Movie"}</span>
              </div>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                {pick.overview}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/watch/$type/$id"
                  params={{ type: pick.media_type, id: String(pick.id) }}
                  search={{}}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.03]"
                >
                  <Play className="h-4 w-4 fill-current" /> Watch now
                </Link>
                <Link
                  to="/title/$type/$id"
                  params={{ type: pick.media_type, id: String(pick.id) }}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-6 py-3 text-sm font-semibold transition-colors hover:border-primary/60"
                >
                  <Clapperboard className="h-4 w-4" /> Details
                </Link>
              </div>
            </div>
          </div>
        )}

        {!shuffling && !pick && (
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-sm border border-dashed border-border bg-surface/50 text-muted-foreground">
            <Dices className="h-10 w-10 text-primary/60" />
            <p className="text-sm">Choose a mood and hit the button — one pick, no scrolling.</p>
          </div>
        )}
      </div>
    </div>
  );
}
