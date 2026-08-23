import { Link } from "@tanstack/react-router";
import { Clapperboard } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-surface/40 px-4 py-12 md:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:justify-between">
        <div className="max-w-sm">
          <div className="flex items-center gap-2">
            <Clapperboard className="h-5 w-5 text-primary" />
            <span className="font-display text-base font-extrabold">
              LUM<span className="text-gold">IERE</span>
            </span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Stream trailers, browse full catalogues and track what you want to watch next — powered by live data
            from The Movie Database.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <span className="font-semibold">Browse</span>
            <Link to="/movies" className="text-muted-foreground hover:text-foreground">Movies</Link>
            <Link to="/series" className="text-muted-foreground hover:text-foreground">Series</Link>
            <Link to="/my-list" className="text-muted-foreground hover:text-foreground">My List</Link>
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-semibold">Discover</span>
            <Link to="/search" search={{ q: "action" }} className="text-muted-foreground hover:text-foreground">Action</Link>
            <Link to="/search" search={{ q: "comedy" }} className="text-muted-foreground hover:text-foreground">Comedy</Link>
            <Link to="/search" search={{ q: "documentary" }} className="text-muted-foreground hover:text-foreground">Documentary</Link>
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-semibold">About</span>
            <span className="text-muted-foreground">Data by TMDB</span>
            <span className="text-muted-foreground">Trailers via YouTube</span>
          </div>
        </div>
      </div>
      <p className="mx-auto mt-10 max-w-6xl text-xs text-muted-foreground">
        © {new Date().getFullYear()} Lumiere. This product uses the TMDB API but is not endorsed or certified by TMDB.
      </p>
    </footer>
  );
}
