import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search, Sparkles, X } from "lucide-react";
import { searchMedia, tasteMix } from "@/lib/tmdb.functions";
import { img, year, type MediaItem } from "@/lib/tmdb";
import { Img } from "@/components/Img";
import { MediaCard } from "@/components/MediaCard";

export const Route = createFileRoute("/mixer")({
  head: () => ({
    meta: [
      { title: "Taste Mixer — Lumiere" },
      { name: "description", content: "Pick up to three titles you love and Lumiere blends them into a row of hidden gems you'll actually like." },
      { property: "og:title", content: "Taste Mixer — Lumiere" },
      { property: "og:description", content: "Blend your favourite titles into a curated row of hidden gems." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MixerPage,
});

function MixerPage() {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [picks, setPicks] = useState<MediaItem[]>([]);
  const [results, setResults] = useState<MediaItem[] | null>(null);
  const [mixing, setMixing] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const [showSuggest, setShowSuggest] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setShowSuggest(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const { data, isFetching } = useQuery({
    queryKey: ["mixer-suggest", debounced],
    queryFn: () => searchMedia({ data: { q: debounced, page: 1 } }),
    enabled: debounced.length > 1,
    staleTime: 60_000,
  });

  const suggestions = (data?.results ?? [])
    .filter((r) => !picks.some((p) => p.id === r.id && p.media_type === r.media_type))
    .slice(0, 6);

  const addPick = (item: MediaItem) => {
    if (picks.length >= 3) return;
    setPicks((p) => [...p, item]);
    setQ("");
    setShowSuggest(false);
    setResults(null);
  };

  const mix = async () => {
    setMixing(true);
    try {
      const res = await tasteMix({
        data: { picks: picks.map((p) => ({ type: p.media_type, id: p.id })) },
      });
      setResults(res);
    } finally {
      setMixing(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-5 pb-16 pt-28 md:px-12 md:pt-36">
      <p className="text-xs uppercase tracking-[0.3em] text-primary">Lumiere originals</p>
      <h1 className="mt-2 font-display text-4xl md:text-6xl">Taste Mixer</h1>
      <p className="mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
        Pick up to three titles you love. We blend their DNA into a row of hidden gems — smarter than "more like this".
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        {picks.map((p) => (
          <span
            key={`${p.media_type}-${p.id}`}
            className="inline-flex items-center gap-2 py-1.5 pr-1 text-xs font-semibold"
          >
            <span className="h-7 w-5 overflow-hidden rounded-sm bg-surface-2">
              <Img src={img(p.poster_path, "w185")} alt="" className="h-full w-full object-cover" />
            </span>
            {p.title}
            <button
              type="button"
              aria-label={`Remove ${p.title}`}
              onClick={() => {
                setPicks((prev) => prev.filter((x) => !(x.id === p.id && x.media_type === p.media_type)));
                setResults(null);
              }}
              className="text-muted-foreground transition-colors hover:text-primary"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}

        {picks.length < 3 && (
          <div ref={boxRef} className="relative w-full max-w-sm">
            <div className="flex items-center gap-2 border-b border-border bg-transparent px-1 py-2 focus-within:border-primary">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setShowSuggest(true);
                }}
                onFocus={() => setShowSuggest(true)}
                placeholder={picks.length ? "Add another title…" : "Search a title you love…"}
                aria-label="Add a title"
                autoComplete="off"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              {isFetching && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
            </div>
            {showSuggest && debounced.length > 1 && (
              <div className="bg-background absolute left-0 top-full z-50 mt-2 w-full overflow-hidden py-2">
                {suggestions.length === 0 && !isFetching && (
                  <p className="px-4 py-4 text-center text-sm text-muted-foreground">No matches found.</p>
                )}
                <ul>
                  {suggestions.map((item) => (
                    <li key={`${item.media_type}-${item.id}`}>
                      <button
                        type="button"
                        onClick={() => addPick(item)}
                        className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-surface"
                      >
                        <div className="h-14 w-10 shrink-0 overflow-hidden rounded-md bg-surface-2">
                          <Img src={img(item.poster_path, "w185")} alt="" className="h-full w-full object-cover" loading="lazy" />
                        </div>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{item.title}</span>
                          <span className="block text-xs text-muted-foreground">
                            {year(item.release_date)} · {item.media_type === "tv" ? "Series" : "Movie"}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={mix}
          disabled={picks.length === 0 || mixing}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.03] disabled:opacity-50"
        >
          {mixing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Mix my taste
        </button>
      </div>

      {results && (
        <div className="mt-12">
          <h2 className="font-display text-2xl md:text-3xl">Your blend</h2>
          <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
            {results.length ? `${results.length} picks from your mix` : "No blend found — try different titles"}
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {results.map((item) => (
              <MediaCard key={`${item.media_type}-${item.id}`} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
