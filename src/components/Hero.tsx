import { Img } from "@/components/Img";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Play, Info, Star } from "lucide-react";
import { img, year, type MediaItem } from "@/lib/tmdb";

const SLIDE_DURATION_MS = 10000;

export function Hero({ items }: { items: MediaItem[] }) {
  const slides = items.filter((i) => i.backdrop_path).slice(0, 5);
  const [index, setIndex] = useState(0);

  // Hold one title on screen for 10 seconds, then bring in the next.
  useEffect(() => {
    if (slides.length < 2) return;
    const t = setTimeout(
      () => setIndex((i) => (i + 1) % slides.length),
      SLIDE_DURATION_MS,
    );
    return () => clearTimeout(t);
  }, [index, slides.length]);

  const item = slides[index];
  if (!item) return null;

  return (
    <section className="relative h-[88vh] min-h-[620px] w-full overflow-hidden">
      {/* Only the active title is mounted, so nothing overlaps or flickers. */}
      <div key={item.id} className="animate-fade-in absolute inset-0">
        <Img
          src={img(item.backdrop_path, "w1280") ?? ""}
          alt={`${item.title} backdrop`}
          loading={index === 0 ? "eager" : "lazy"}
          fetchPriority={index === 0 ? "high" : "low"}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="absolute inset-0 side-fade" />
      <div className="absolute inset-0 hero-fade" />

      <div className="relative flex h-full max-w-3xl flex-col justify-end gap-5 px-5 pb-28 md:px-12 md:pb-36 lg:px-16">
        <div className="flex items-center gap-3 text-[11px] font-semibold uppercase text-primary">
          <span className="h-7 w-px bg-primary" /> Lumiere selection
        </div>
        <h1 className="max-w-2xl font-display text-5xl leading-[0.9] md:text-7xl lg:text-8xl">{item.title}</h1>
        <div className="flex flex-wrap items-center gap-3 text-xs font-medium uppercase text-muted-foreground">
          <span className="flex items-center gap-1 text-primary">
            <Star className="h-4 w-4 fill-current" /> {item.vote_average.toFixed(1)}
          </span>
          <span>{year(item.release_date)}</span>
          <span>{item.media_type === "tv" ? "Series" : "Film"}</span>
          <span className="border border-border px-2 py-1 text-[10px]">4K</span>
        </div>
        <p className="line-clamp-3 max-w-xl text-sm leading-relaxed text-foreground/75 md:text-base">{item.overview}</p>
        <div className="mt-2 flex flex-wrap gap-3">
          <Link
            to="/watch/$type/$id"
            params={{ type: item.media_type, id: String(item.id) }}
            className="inline-flex items-center gap-2 rounded-sm bg-foreground px-7 py-3 text-sm font-semibold text-background transition-colors hover:bg-primary"
          >
            <Play className="h-4 w-4 fill-current" /> Play
          </Link>
          <Link
            to="/title/$type/$id"
            params={{ type: item.media_type, id: String(item.id) }}
            className="inline-flex items-center gap-2 rounded-sm border border-border bg-background/40 px-7 py-3 text-sm font-semibold backdrop-blur-md transition-colors hover:bg-surface-2"
          >
            <Info className="h-4 w-4" /> More info
          </Link>
        </div>

        <div className="mt-4 flex gap-2">
          {slides.map((s, i) => (
            <button
              key={s.id}
              aria-label={`Show ${s.title}`}
              onClick={() => setIndex(i)}
              className={`h-px transition-all ${i === index ? "w-10 bg-primary" : "w-5 bg-border"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
