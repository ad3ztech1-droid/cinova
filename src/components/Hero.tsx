import { Img } from "@/components/Img";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Play, Info, Star } from "lucide-react";
import { img, year, type MediaItem } from "@/lib/tmdb";

export function Hero({ items }: { items: MediaItem[] }) {
  const slides = items.filter((i) => i.backdrop_path).slice(0, 5);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 9000);
    return () => clearInterval(t);
  }, [slides.length]);

  const item = slides[index];
  if (!item) return null;

  return (
    <section className="relative h-[78vh] min-h-[520px] w-full overflow-hidden">
      {slides.map((s, i) => (
        <Img
          key={s.id}
          src={img(s.backdrop_path, "w1280") ?? ""}
          alt={`${s.title} backdrop`}
          loading={i === 0 ? "eager" : "lazy"}
          fetchPriority={i === 0 ? "high" : "low"}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      <div className="absolute inset-0 side-fade" />
      <div className="absolute inset-0 hero-fade" />

      <div className="relative flex h-full max-w-2xl flex-col justify-end gap-4 px-4 pb-20 md:px-10 md:pb-24">
        <span className="w-fit rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
          Featured today
        </span>
        <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">{item.title}</h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1 text-primary">
            <Star className="h-4 w-4 fill-current" /> {item.vote_average.toFixed(1)}
          </span>
          <span>{year(item.release_date)}</span>
          <span className="rounded border border-border px-1.5 py-0.5 text-xs uppercase">{item.media_type}</span>
          <span className="rounded border border-border px-1.5 py-0.5 text-xs">HD</span>
        </div>
        <p className="line-clamp-3 max-w-xl text-sm text-foreground/80 md:text-base">{item.overview}</p>
        <div className="mt-2 flex flex-wrap gap-3">
          <Link
            to="/watch/$type/$id"
            params={{ type: item.media_type, id: String(item.id) }}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-transform hover:scale-105"
          >
            <Play className="h-4 w-4 fill-current" /> Play
          </Link>
          <Link
            to="/title/$type/$id"
            params={{ type: item.media_type, id: String(item.id) }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-6 py-3 text-sm font-semibold backdrop-blur transition-colors hover:bg-surface-2"
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
              className={`h-1 rounded-full transition-all ${i === index ? "w-8 bg-primary" : "w-4 bg-border"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
