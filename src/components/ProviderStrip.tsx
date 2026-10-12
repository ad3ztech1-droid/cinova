import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { getProviders } from "@/lib/tmdb.functions";
import { img } from "@/lib/tmdb";
import { Img } from "./Img";

/**
 * Homepage strip of major streaming services. Each tile deep-links into the
 * Movies catalogue pre-filtered to that provider.
 */
export function ProviderStrip() {
  const { data: providers } = useQuery({
    queryKey: ["providers"],
    queryFn: () => getProviders(),
    staleTime: 1000 * 60 * 60,
  });

  if (!providers?.length) return null;

  return (
    <section className="py-8 md:py-10" aria-label="Browse by provider">
      <div className="mb-6 flex items-baseline gap-4 px-5 md:px-12 lg:px-16">
        <h2 className="font-display text-3xl md:text-4xl">Browse by provider</h2>
        <span className="hidden text-xs uppercase text-muted-foreground sm:inline">Filter the collection by service</span>
        <Link
          to="/movies"
          className="ml-auto shrink-0 text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-primary"
        >
          View all
        </Link>
      </div>
      <div className="no-scrollbar flex gap-4 overflow-x-auto px-5 pb-2 md:px-12 lg:px-16">
        {providers.map((p) => {
          const logo = img(p.logo_path, "w154");
          return (
            <Link
              key={p.provider_id}
              to="/movies"
              search={{ provider: p.provider_id }}
              className="group flex w-28 shrink-0 flex-col items-center gap-3 rounded-sm border border-border bg-surface px-3 py-5 transition-colors hover:border-primary/50 md:w-32"
            >
              <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-surface-2 p-2 shadow-poster">
                {logo && (
                  <Img
                    src={logo}
                    alt={`${p.provider_name} logo`}
                    loading="lazy"
                    className="h-full w-full object-contain"
                  />
                )}
              </span>
              <span className="line-clamp-2 text-center text-xs font-medium leading-snug text-muted-foreground transition-colors group-hover:text-foreground">
                {p.provider_name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
