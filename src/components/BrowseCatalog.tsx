import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, RotateCcw } from "lucide-react";
import { z } from "zod";
import { discover, getGenres, getProviders } from "@/lib/tmdb.functions";
import type { MediaItem, MediaType } from "@/lib/tmdb";
import { MediaCard } from "./MediaCard";
import { Button } from "@/components/ui/button";

export interface CatalogFilters {
  genre?: number | undefined;
  year: string;
  rating?: number | undefined;
  provider?: number | undefined;
  sort: string;
}

export const defaultFilters: CatalogFilters = { year: "any", sort: "popularity.desc" };

export const filterSearchSchema = z.object({
  genre: z.coerce.number().int().positive().optional(),
  year: z.string().optional(),
  rating: z.coerce.number().min(0).max(10).optional(),
  provider: z.coerce.number().int().positive().optional(),
  sort: z.string().max(40).optional(),
});

const yearRanges = [
  { value: "any", label: "Any year" },
  { value: "2020s", label: "2020s", from: 2020, to: 2029 },
  { value: "2010s", label: "2010s", from: 2010, to: 2019 },
  { value: "2000s", label: "2000s", from: 2000, to: 2009 },
  { value: "1990s", label: "1990s", from: 1990, to: 1999 },
  { value: "1980s", label: "1980s", from: 1980, to: 1989 },
  { value: "classic", label: "1979 & earlier", from: 1900, to: 1979 },
];

const ratings = [
  { value: undefined, label: "Any rating" },
  { value: 8, label: "8+ exceptional" },
  { value: 7, label: "7+ great" },
  { value: 6, label: "6+ good" },
  { value: 5, label: "5+ watchable" },
];

const sorts = [
  { value: "popularity.desc", label: "Most popular" },
  { value: "vote_average.desc", label: "Highest rated" },
  { value: "primary_release_date.desc", label: "Newest first" },
  { value: "revenue.desc", label: "Biggest hits" },
];

function FilterSelect({
  label,
  value,
  active,
  onChange,
  children,
}: {
  label: string;
  value: string;
  active: boolean;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        aria-label={label}
        onChange={(e) => onChange(e.target.value)}
        className={`max-w-full appearance-none border-b border-border bg-transparent py-2 pl-1 pr-7 text-xs font-medium outline-none transition-colors focus:border-primary ${
          active ? "border-primary text-primary" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-1 h-3.5 w-3.5 text-muted-foreground" />
    </label>
  );
}

export function BrowseCatalog({
  type,
  title,
  subtitle,
  filters,
  onFiltersChange,
}: {
  type: MediaType;
  title: string;
  subtitle: string;
  filters: CatalogFilters;
  onFiltersChange: (next: CatalogFilters) => void;
}) {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<MediaItem[]>([]);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const setFilter = useCallback(
    (patch: Partial<CatalogFilters>) => onFiltersChange({ ...filters, ...patch }),
    [filters, onFiltersChange],
  );

  const yearRange = useMemo(() => yearRanges.find((y) => y.value === filters.year), [filters.year]);
  const hasActiveFilters =
    filters.genre !== undefined ||
    filters.year !== "any" ||
    filters.rating !== undefined ||
    filters.provider !== undefined ||
    filters.sort !== "popularity.desc";

  const genresQuery = useQuery({
    queryKey: ["genres", type],
    queryFn: () => getGenres({ data: { type } }),
    staleTime: Infinity,
  });

  const providersQuery = useQuery({
    queryKey: ["providers"],
    queryFn: () => getProviders(),
    staleTime: 1000 * 60 * 60,
  });

  const listQuery = useQuery({
    queryKey: ["discover", type, filters.genre, filters.sort, filters.year, filters.rating, filters.provider, page],
    queryFn: () =>
      discover({
        data: {
          type,
          genre: filters.genre,
          sort: filters.sort,
          yearFrom: yearRange?.from,
          yearTo: yearRange?.to,
          minRating: filters.rating,
          provider: filters.provider,
          page,
        },
      }),
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    setPage(1);
    setItems([]);
  }, [type, filters.genre, filters.sort, filters.year, filters.rating, filters.provider]);

  useEffect(() => {
    if (!listQuery.data) return;
    setItems((prev) => {
      const merged = listQuery.data.page === 1 ? listQuery.data.results : [...prev, ...listQuery.data.results];
      const seen = new Set<number>();
      return merged.filter((m) => (seen.has(m.id) ? false : seen.add(m.id)));
    });
  }, [listQuery.data]);

  const canLoadMore = listQuery.data ? listQuery.data.page < listQuery.data.total_pages : false;
  const totalLabel = listQuery.data
    ? listQuery.data.total_pages >= 500
      ? "10,000+"
      : listQuery.data.total_pages * 20 > listQuery.data.results.length
        ? `${(listQuery.data.total_pages - 1) * 20 + listQuery.data.results.length}+`
        : `${(listQuery.data.total_pages - 1) * 20 + listQuery.data.results.length}`
    : "";

  // Infinite scroll: load the next page automatically when the sentinel enters view.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && canLoadMore && !listQuery.isFetching) {
          setPage((p) => p + 1);
        }
      },
      { rootMargin: "800px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [canLoadMore, listQuery.isFetching]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-20 pt-28 md:px-10 md:pt-36">
      <p className="text-[0.65rem] font-semibold uppercase text-primary">Browse the collection</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <h1 className="font-display text-4xl md:text-5xl">{title}</h1>
        {totalLabel && (
            <p className="pb-1 text-xs text-muted-foreground">{totalLabel} titles</p>
        )}
      </div>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">{subtitle}</p>

      <div className="mt-8 flex flex-wrap items-center gap-2 border-y border-border py-5" role="group" aria-label="Filters">
        <FilterSelect
          label="Genre"
          value={filters.genre !== undefined ? String(filters.genre) : "any"}
          active={filters.genre !== undefined}
          onChange={(v) => setFilter({ genre: v === "any" ? undefined : Number(v) })}
        >
          <option value="any">All genres</option>
          {(genresQuery.data ?? []).map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          label="Release period"
          value={filters.year}
          active={filters.year !== "any"}
          onChange={(v) => setFilter({ year: v })}
        >
          {yearRanges.map((y) => (
            <option key={y.value} value={y.value}>
              {y.label}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          label="Streaming service"
          value={filters.provider !== undefined ? String(filters.provider) : "any"}
          active={filters.provider !== undefined}
          onChange={(v) => setFilter({ provider: v === "any" ? undefined : Number(v) })}
        >
          <option value="any">All services</option>
          {(providersQuery.data ?? []).map((p) => (
            <option key={p.provider_id} value={p.provider_id}>
              {p.provider_name}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          label="Minimum rating"
          value={filters.rating !== undefined ? String(filters.rating) : "any"}
          active={filters.rating !== undefined}
          onChange={(v) => setFilter({ rating: v === "any" ? undefined : Number(v) })}
        >
          {ratings.map((r) => (
            <option key={r.label} value={r.value !== undefined ? String(r.value) : "any"}>
              {r.label}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          label="Sort by"
          value={filters.sort}
          active={filters.sort !== "popularity.desc"}
          onChange={(v) => setFilter({ sort: v })}
        >
          {sorts.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </FilterSelect>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm"
            type="button"
            onClick={() => onFiltersChange({ ...defaultFilters })}
            className="text-primary hover:bg-surface hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        )}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {items.map((item) => (
          <MediaCard key={item.id} item={item} />
        ))}
        {listQuery.isLoading &&
          items.length === 0 &&
          Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] animate-pulse rounded-md bg-surface" aria-hidden="true" />
          ))}
      </div>

      {!listQuery.isLoading && !items.length && (
        <p className="py-16 text-center text-sm text-muted-foreground">
          No titles match these filters. Try widening the year or rating.
        </p>
      )}

      <div ref={sentinelRef} className="h-px" aria-hidden="true" />

      {listQuery.isFetching && items.length > 0 && (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary" role="status" aria-label="Loading more titles" />
        </div>
      )}
    </div>
  );
}
