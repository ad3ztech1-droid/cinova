import { Link } from "@tanstack/react-router";
import { Star, Play } from "lucide-react";
import { img, year, type MediaItem } from "@/lib/tmdb";

export function MediaCard({ item, className = "" }: { item: MediaItem; className?: string }) {
  const poster = img(item.poster_path, "w342") ?? img(item.backdrop_path, "w500");
  return (
    <Link
      to="/title/$type/$id"
      params={{ type: item.media_type, id: String(item.id) }}
      className={`group relative block overflow-hidden rounded-xl bg-surface shadow-poster transition-transform duration-300 hover:z-10 hover:-translate-y-1 hover:scale-[1.03] ${className}`}
    >
      <div className="aspect-[2/3] w-full overflow-hidden bg-surface-2">
        {poster ? (
          <img
            src={poster}
            alt={`${item.title} poster`}
            loading="lazy"
            className="h-full w-full object-cover transition-opacity duration-300 group-hover:opacity-80"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-2 text-center text-xs text-muted-foreground">
            {item.title}
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-background via-background/40 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 text-primary">
            <Star className="h-3 w-3 fill-current" />
            {item.vote_average.toFixed(1)}
          </span>
          <span>{year(item.release_date)}</span>
          <span className="uppercase">{item.media_type}</span>
        </div>
        <span className="mt-1 line-clamp-2 text-sm font-semibold">{item.title}</span>
      </div>

      <span className="absolute right-2 top-2 flex h-9 w-9 scale-75 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100">
        <Play className="h-4 w-4 fill-current" />
      </span>
    </Link>
  );
}
