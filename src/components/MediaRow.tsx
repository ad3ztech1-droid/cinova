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
    <section className="group/row relative py-5">
      <div className="mb-3 flex items-end justify-between px-4 md:px-10">
        <h2 className="text-lg font-bold md:text-xl">{title}</h2>
        <div className="hidden gap-2 md:flex">
          <button
            aria-label={`Scroll ${title} left`}
            onClick={() => scroll(-1)}
            className="rounded-full border border-border bg-surface/80 p-2 text-foreground/80 transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            aria-label={`Scroll ${title} right`}
            onClick={() => scroll(1)}
            className="rounded-full border border-border bg-surface/80 p-2 text-foreground/80 transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={ref}
        className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:px-10"
      >
        {items.map((item) => (
          <MediaCard
            key={`${item.media_type}-${item.id}`}
            item={item}
            className="w-[43vw] shrink-0 snap-start sm:w-44 md:w-48"
          />
        ))}
      </div>
    </section>
  );
}
