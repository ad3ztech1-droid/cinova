import { Link } from "@tanstack/react-router";
import { Star, Play } from "lucide-react";
import { img, year, type MediaItem } from "@/lib/tmdb";
import { Img } from "@/components/Img";

export function MediaCard({ item, className = "" }: { item: MediaItem; className?: string }) {
  const poster = img(item.poster_path, "w342") ?? img(item.backdrop_path, "w500");
  return (
    <Link
      to="/title/$type/$id"
      params={{ type: item.media_type, id: String(item.id) }}
      aria-label={`${item.title}, ${year(item.release_date)}, ${item.media_type === "tv" ? "TV series" : "movie"}`}
      className={`group relative block min-w-0 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary hover:-translate-y-1 ${className}`}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md bg-surface-2 shadow-poster ring-1 ring-border transition-shadow group-hover:ring-primary/50">
        <Img
          src={poster}
          alt={`${item.title} poster`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          fallback={
            <div className="flex h-full items-center justify-center px-2 text-center text-xs text-muted-foreground">
              {item.title}
            </div>
          }
        />
        <span className="glass-panel absolute left-2 top-2 flex items-center gap-1 rounded-sm px-2 py-1 text-[11px] font-medium text-primary">
          <Star className="h-3 w-3 fill-current" /> {item.vote_average.toFixed(1)}
        </span>
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/20 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <span className="glass-panel flex h-12 w-12 items-center justify-center rounded-full text-foreground"><Play className="h-5 w-5 fill-current" /></span>
        </span>
      </div>
      <div className="pt-3">
        <span className="block truncate text-sm font-medium text-foreground">{item.title}</span>
        <span className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{year(item.release_date) || "TBA"}</span><span className="h-0.5 w-0.5 rounded-full bg-muted-foreground" /><span>{item.media_type === "tv" ? "Series" : "Movie"}</span>
        </span>
      </div>
    </Link>
  );
}
