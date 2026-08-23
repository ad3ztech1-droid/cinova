import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Search, Menu, X, Clapperboard } from "lucide-react";

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
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    navigate({ to: "/search", search: { q: q.trim() } });
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

        <form onSubmit={submit} className="ml-auto flex max-w-xs flex-1 items-center gap-2">
          <div className="flex w-full items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1.5 focus-within:border-primary/60">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search movies, series…"
              aria-label="Search"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        </form>

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
