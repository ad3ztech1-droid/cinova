import { Img } from "@/components/Img";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Play, Info, Star, Pause, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { img, year, type MediaItem } from "@/lib/tmdb";

const SLIDE_DURATION_MS = 10000;

export function Hero({ items }: { items: MediaItem[] }) {
  const slides = items.filter((i) => i.backdrop_path).slice(0, 5);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (slides.length < 2 || paused) return;
    const timer = setTimeout(() => setIndex((i) => (i + 1) % slides.length), SLIDE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [index, slides.length, paused, cycle]);

  const select = (next: number) => {
    setIndex((next + slides.length) % slides.length);
    setCycle((value) => value + 1);
  };
  const item = slides[index] ?? slides[0];
  if (!item) return null;

  return (
    <section className="relative h-[82svh] min-h-[560px] max-h-[960px] w-full overflow-hidden" aria-label="Featured titles" aria-roledescription="carousel">
      <div key={item.id} className="animate-fade-in absolute inset-0">
        <Img src={img(item.backdrop_path, "w1280")} alt={`${item.title} backdrop`} loading="eager" fetchPriority="high" className="h-full w-full object-cover" />
      </div>
      <div className="absolute inset-0 side-fade" />
      <div className="absolute inset-0 hero-fade" />
      <div className="relative mx-auto flex h-full max-w-[1600px] flex-col justify-end px-5 pb-20 pt-28 md:px-12 md:pb-24 lg:px-16">
        <h1 className="hero-title max-w-3xl break-words font-display text-5xl leading-[1.02] md:text-7xl lg:text-8xl">{item.title}</h1>
        <div className="mt-5 flex flex-wrap items-center gap-3 text-xs font-medium text-foreground/80">
          <span className="flex items-center gap-1 text-primary" title="TMDB rating"><Star className="h-3.5 w-3.5 fill-current" /> {item.vote_average.toFixed(1)}<span className="text-muted-foreground">/ 10</span></span>
          <span className="h-3 w-px bg-border" />
          <span>{year(item.release_date)}</span>
          <span>{item.media_type === "tv" ? "TV series" : "Movie"}</span>
        </div>
        <p className="mt-4 line-clamp-3 max-w-lg text-sm leading-relaxed text-foreground/80 md:text-base">{item.overview}</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Button asChild size="lg" className="h-11 px-6"><Link to="/watch/$type/$id" params={{ type: item.media_type, id: String(item.id) }}><Play className="fill-current" /> Watch now</Link></Button>
          <Button asChild variant="glass" size="lg" className="h-11 px-5"><Link to="/title/$type/$id" params={{ type: item.media_type, id: String(item.id) }}><Info /> Details</Link></Button>
        </div>
        {slides.length > 1 && (
          <div className="mt-7 flex items-center gap-3" aria-label="Selection controls">
            <div className="flex gap-1">
              <Button variant="glass" size="icon" aria-label="Previous selection" title="Previous selection" onClick={() => select(index - 1)}><ChevronLeft /></Button>
              <Button variant="glass" size="icon" aria-label={paused ? "Resume selections" : "Pause selections"} title={paused ? "Resume selections" : "Pause selections"} aria-pressed={paused} onClick={() => setPaused((value) => !value)}>{paused ? <Play /> : <Pause />}</Button>
              <Button variant="glass" size="icon" aria-label="Next selection" title="Next selection" onClick={() => select(index + 1)}><ChevronRight /></Button>
            </div>
            <span className="text-xs tabular-nums text-muted-foreground">{String(index + 1).padStart(2, "0")} <span className="mx-1 text-border">/</span> {String(slides.length).padStart(2, "0")}</span>
          </div>
        )}
      </div>
    </section>
  );
}
