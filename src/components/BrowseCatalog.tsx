import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { discover, getGenres } from "@/lib/tmdb.functions";
import type { MediaItem, MediaType } from "@/lib/tmdb";
import { MediaCard } from "./MediaCard";

const sorts = [
  { value: "popularity.desc", label: "Most popular" },
  { value: "vote_average.desc", label: "Highest rated" },
  { value: "primary_release_date.desc", label: "Newest" },
  { value: "revenue.desc", label: "Biggest hits" },
];

export function BrowseCatalog({ type, title, subtitle }: { type: MediaType; title: string; subtitle: string }) {
  const [genre, setGenre] = useState<number | undefined>(undefined);
  const [sort, setSort] = useState("popularity.desc");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<MediaItem[]>([]);

  const genresQuery = useQuery({
    queryKey: ["genres", type],
    queryFn: () => getGenres({ data: { type } }),
    staleTime: Infinity,
  });

  const listQuery = useQuery({
    queryKey: ["discover", type, genre, sort, page],
    queryFn: () => discover({ data: { type, genre, sort, page } }),
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    setPage(1);
    setItems([]);
  }, [genre, sort, type]);

  useEffect(() => {
    if (!listQuery.data) return;
    setItems((prev) => {
      const merged = listQuery.data.page === 1 ? listQuery.data.results : [...prev, ...listQuery.data.results];
      const seen = new Set<number>();
      return merged.filter((m) => (seen.has(m.id) ? false : seen.add(m.id)));
    });
  }, [listQuery.data]);

  const canLoadMore = useMemo(
    () => (listQuery.data ? listQuery.data.page < listQuery.data.total_pages : false),
    [listQuery.data],
  );

  return (
    <div className="px-4 pb-16 pt-28 md:px-10">
      <h1 className="text-3xl font-extrabold md:text-4xl">{title}</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">{subtitle}</p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setGenre(undefined)}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
            genre === undefined ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface text-muted-foreground hover:text-foreground"
          }`}
        >
          All
        </button>
        {(genresQuery.data ?? []).map((g) => (
          <button
            key={g.id}
            onClick={() => setGenre(g.id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              genre === g.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface text-muted-foreground hover:text-foreground"
            }`}
          >
            {g.name}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {sorts.map((s) => (
          <button
            key={s.value}
            onClick={() => setSort(s.value)}
            className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
              sort === s.value ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {items.map((item) => (
          <MediaCard key={item.id} item={item} />
        ))}
      </div>

      {listQuery.isLoading && (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {!listQuery.isLoading && !items.length && (
        <p className="py-16 text-center text-sm text-muted-foreground">No titles match these filters.</p>
      )}

      {canLoadMore && (
        <div className="mt-10 flex justify-center">
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={listQuery.isFetching}
            className="rounded-full border border-border bg-surface px-6 py-3 text-sm font-semibold transition-colors hover:bg-surface-2 disabled:opacity-60"
          >
            {listQuery.isFetching ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
