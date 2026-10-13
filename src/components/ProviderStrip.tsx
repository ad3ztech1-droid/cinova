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
        <Link
          to="/movies"
          className="ml-auto shrink-0 text-xs text-muted-foreground transition-colors hover:text-primary"
        >
          View all
        </Link>
      </div>
      <div className="no-scrollbar flex gap-5 overflow-x-auto px-5 pb-2 md:gap-7 md:px-12 lg:px-16">
        {providers.map((p) => {
          const logo = img(p.logo_path, "original");
          return (
            <Link
              key={p.provider_id}
              to="/movies"
              search={{ provider: p.provider_id }}
              className="group flex w-24 shrink-0 flex-col items-center gap-3 md:w-28"
            >
              <span className="block h-16 w-16 overflow-hidden rounded-lg transition duration-300 group-hover:-translate-y-1 md:h-20 md:w-20">
                {logo && (
                  <Img
                    src={logo}
                    alt={`${p.provider_name} logo`}
                    loading="eager"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                )}
              </span>
              <span className="text-center text-xs font-medium leading-snug text-muted-foreground transition-colors group-hover:text-foreground">
                {p.provider_name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
