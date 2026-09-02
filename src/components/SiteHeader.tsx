import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, Menu, X, Clapperboard, Loader2 } from "lucide-react";
import { searchMedia } from "@/lib/tmdb.functions";
import { img, year } from "@/lib/tmdb";
import { Img } from "@/components/Img";

const links = [
  { to: "/", label: "Home" },
  { to: "/movies", label: "Movies" },
  { to: "/series", label: "Series" },
  { to: "/my-list", label: "My List" },
] as const;

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [showSuggest, setShowSuggest] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

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
    queryKey: ["suggest", debounced],
    queryFn: () => searchMedia({ data: { q: debounced, page: 1 } }),
    enabled: debounced.length > 1,
    staleTime: 60_000,
  });

  const suggestions = (data?.results ?? []).slice(0, 8);

  const go = (item: (typeof suggestions)[number]) => {
    setShowSuggest(false);
    setQ("");
    navigate({ to: "/title/$type/$id", params: { type: item.media_type, id: String(item.id) } });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (active >= 0 && suggestions[active]) {
      go(suggestions[active]);
      return;
    }
    if (!q.trim()) return;
    setShowSuggest(false);
    navigate({ to: "/search", search: { q: q.trim() } });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggest || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a <= 0 ? suggestions.length - 1 : a - 1));
    } else if (e.key === "Escape") {
      setShowSuggest(false);
    }
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled ? "border-b border-border bg-background/90 backdrop-blur-xl" : "bg-gradient-to-b from-background/90 to-transparent"
      }`}
    >
      <div className="flex h-16 items-center gap-4 px-4 md:h-18 md:px-10">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <Clapperboard className="h-6 w-6 text-primary" />
          <span className="font-display text-lg font-extrabold tracking-tight">
            LUM<span className="text-gold">IERE</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              activeProps={{ className: "text-foreground bg-surface-2" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="rounded-full px-3 py-1.5 text-sm font-medium transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div ref={boxRef} className="relative ml-auto w-full max-w-xs">
          <form onSubmit={submit} className="flex items-center gap-2">
            <div className="flex w-full items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1.5 focus-within:border-primary/60">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setActive(-1);
                  setShowSuggest(true);
                }}
                onFocus={() => setShowSuggest(true)}
                onKeyDown={onKeyDown}
                placeholder="Search movies, series…"
                aria-label="Search"
                autoComplete="off"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              {isFetching && debounced.length > 1 && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />}
            </div>
          </form>

          {showSuggest && debounced.length > 1 && (
            <div className="absolute right-0 top-full z-50 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-border bg-background/95 shadow-2xl backdrop-blur-xl">
              {suggestions.length === 0 && !isFetching && (
                <p className="px-4 py-5 text-center text-sm text-muted-foreground">No matches found.</p>
              )}
              <ul className="max-h-[60vh] overflow-y-auto">
                {suggestions.map((item, i) => (
                  <li key={`${item.media_type}-${item.id}`}>
                    <button
                      type="button"
                      onMouseEnter={() => setActive(i)}
                      onClick={() => go(item)}
                      className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${
                        active === i ? "bg-surface-2" : "hover:bg-surface"
                      }`}
                    >
                      <div className="h-14 w-10 shrink-0 overflow-hidden rounded-md bg-surface-2">
                        <Img
                          src={img(item.poster_path, "w185")}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{item.title}</span>
                        <span className="block text-xs text-muted-foreground">
                          {year(item.release_date)} · {item.media_type === "tv" ? "Series" : "Movie"}
                          {item.vote_average ? ` · ★ ${item.vote_average.toFixed(1)}` : ""}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {q.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    setShowSuggest(false);
                    navigate({ to: "/search", search: { q: q.trim() } });
                  }}
                  className="block w-full border-t border-border px-4 py-2.5 text-left text-xs font-medium text-primary hover:bg-surface"
                >
                  See all results for “{q.trim()}”
                </button>
              )}
            </div>
          )}
        </div>

        <button
          className="md:hidden"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav className="flex flex-col border-t border-border bg-background/95 px-4 py-2 backdrop-blur-xl md:hidden">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="py-2.5 text-sm font-medium text-muted-foreground">
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
