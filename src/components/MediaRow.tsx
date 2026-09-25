import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { MediaItem } from "@/lib/tmdb";
import { MediaCard } from "./MediaCard";

export function MediaRow({ title, items }: { title: string; items: MediaItem[] }) {
  const ref = useRef<HTMLDivElement>(null);

  const scroll = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.85), behavior: "smooth" });
  };

  if (!items.length) return null;

  return (
    <section className="group/row relative py-8 md:py-10">
      <div className="mb-6 flex items-end justify-between px-5 md:px-12 lg:px-16">
        <div className="flex items-baseline gap-4"><h2 className="font-display text-3xl md:text-4xl">{title}</h2><span className="hidden text-xs uppercase text-muted-foreground sm:inline">Curated for you</span></div>
        <div className="hidden gap-2 md:flex">
          <button
            aria-label={`Scroll ${title} left`}
            onClick={() => scroll(-1)}
            className="rounded-full border border-border bg-surface/80 p-2 text-foreground/80 transition-colors hover:border-primary hover:text-primary"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            aria-label={`Scroll ${title} right`}
            onClick={() => scroll(1)}
            className="rounded-full border border-border bg-surface/80 p-2 text-foreground/80 transition-colors hover:border-primary hover:text-primary"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={ref}
        className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 md:gap-5 md:px-12 lg:px-16"
      >
        {items.map((item) => (
          <MediaCard
            key={`${item.media_type}-${item.id}`}
            item={item}
            className="w-[44vw] shrink-0 snap-start sm:w-44 md:w-48 lg:w-52"
          />
        ))}
      </div>
    </section>
  );
}
