import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, Menu, X, Loader2 } from "lucide-react";
import { searchMedia } from "@/lib/tmdb.functions";
import { img, year } from "@/lib/tmdb";
import { Img } from "@/components/Img";
import { InstallAppButton } from "@/components/InstallAppButton";
import { Button } from "@/components/ui/button";

const links = [
  { to: "/", label: "Home" },
  { to: "/movies", label: "Movies" },
  { to: "/series", label: "Series" },
  { to: "/shuffle", label: "Shuffle" },
  { to: "/mixer", label: "Mixer" },
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
      className={`fixed inset-x-0 top-0 z-50 px-3 pt-3 transition-all duration-300 md:px-8 md:pt-4 ${
        scrolled ? "" : ""
      }`}
    >
      <div className={`glass-panel mx-auto flex h-14 max-w-[1600px] items-center gap-3 rounded-lg px-3 transition-colors md:h-16 md:gap-5 md:px-6 ${scrolled ? "bg-glass-hover" : ""}`}>
        <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="Lumiere home">
          <span className="font-display text-2xl md:text-3xl">Lumiere</span>
        </Link>

        <nav className="ml-2 hidden items-center gap-5 lg:flex" aria-label="Main navigation">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              activeProps={{ className: "text-foreground border-b border-primary" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="py-2 text-xs font-semibold transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div ref={boxRef} className="relative ml-auto w-full max-w-[12rem] sm:max-w-xs">
          <form onSubmit={submit} className="flex items-center gap-2">
            <div className="flex w-full items-center gap-2 rounded-md border border-glass-border bg-background/30 px-3 py-2 transition-colors focus-within:border-primary/60 focus-within:bg-surface">
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
                placeholder="Search films & series"
                aria-label="Search"
                autoComplete="off"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              {isFetching && debounced.length > 1 && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />}
            </div>
          </form>

          {showSuggest && debounced.length > 1 && (
            <div className="glass-panel absolute right-0 top-full z-50 mt-3 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg">
              {suggestions.length === 0 && !isFetching && (
                <p className="px-4 py-5 text-center text-sm text-muted-foreground">No matches found.</p>
              )}
              <ul className="max-h-[60vh] overflow-y-auto">
                {suggestions.map((item, i) => (
                  <li key={`${item.media_type}-${item.id}`}>
                    <Button
                      variant="ghost"
                      type="button"
                      onMouseEnter={() => setActive(i)}
                      onClick={() => go(item)}
                      className={`flex h-auto w-full justify-start rounded-none items-center gap-3 px-3 py-2 text-left transition-colors ${
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
                    </Button>
                  </li>
                ))}
              </ul>
              {q.trim() && (
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => {
                    setShowSuggest(false);
                    navigate({ to: "/search", search: { q: q.trim() } });
                  }}
                  className="block h-auto w-full truncate rounded-none border-t border-border px-4 py-2.5 text-left text-xs font-medium text-primary hover:bg-surface"
                >
                  See all results for “{q.trim()}”
                </Button>
              )}
            </div>
          )}
        </div>

        <InstallAppButton className="shrink-0" />

        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 lg:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {open && (
        <nav aria-label="Mobile navigation" className="glass-panel mt-2 flex flex-col rounded-lg px-4 py-2 lg:hidden">
          {links.map((l) => (
            <Link key={l.to} to={l.to} activeOptions={{ exact: l.to === "/" }} activeProps={{ className: "text-primary" }} className="py-2.5 text-sm font-medium text-muted-foreground">
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
