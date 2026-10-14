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
      className={`group relative block min-w-0 transition-all duration-300 focus-visible:outline-none focus-visible:underline hover:-translate-y-1 ${className}`}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden">
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
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/35 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <Play className="h-8 w-8 fill-current text-primary" />
        </span>
      </div>
      <div className="pt-3">
        <span className="block truncate text-sm font-medium text-foreground">{item.title}</span>
        <span className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 text-primary">
            <Star className="h-3 w-3 fill-current" /> {item.vote_average.toFixed(1)}
          </span>
          <span className="text-border">·</span>
          <span>{year(item.release_date) || "TBA"}</span>
          <span className="text-border">·</span>
          <span>{item.media_type === "tv" ? "Series" : "Movie"}</span>
        </span>
      </div>
    </Link>
  );
}
