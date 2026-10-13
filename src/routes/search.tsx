import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, SearchIcon } from "lucide-react";
import { z } from "zod";
import { searchMedia } from "@/lib/tmdb.functions";
import { MediaCard } from "@/components/MediaCard";

const searchSchema = z.object({ q: z.string().catch("") });

export const Route = createFileRoute("/search")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Search Movies & Series | Lumiere" },
      { name: "description", content: "Search the full Lumiere catalogue of movies and TV series by title, in seconds." },
      { property: "og:title", content: "Search Movies & Series | Lumiere" },
      { property: "og:description", content: "Find any movie or series in the Lumiere catalogue." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const [term, setTerm] = useState(q);

  useEffect(() => setTerm(q), [q]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (term !== q) navigate({ to: "/search", search: { q: term }, replace: true });
    }, 350);
    return () => clearTimeout(t);
  }, [term, q, navigate]);

  const { data, isFetching } = useQuery({
    queryKey: ["search", q],
    queryFn: () => searchMedia({ data: { q, page: 1 } }),
    enabled: q.trim().length > 0,
  });

  return (
    <div className="min-h-screen px-4 pb-16 pt-28 md:px-10">
      <h1 className="text-4xl md:text-6xl">Search</h1>
      <div className="glass-panel mt-5 flex max-w-xl items-center gap-3 rounded-md px-4 py-3 focus-within:border-primary/60">
        <SearchIcon className="h-5 w-5 text-muted-foreground" />
        <input
          autoFocus
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search for a movie or series…"
          aria-label="Search catalogue"
          className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
        />
        {isFetching && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
      </div>

      {q && (
        <p className="mt-6 text-sm text-muted-foreground">
          {data ? `${data.results.length} results for "${q}"` : "Searching…"}
        </p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {(data?.results ?? []).map((item) => (
          <MediaCard key={`${item.media_type}-${item.id}`} item={item} />
        ))}
      </div>

      {q && data && data.results.length === 0 && !isFetching && (
        <p className="py-16 text-center text-sm text-muted-foreground">Nothing found. Try another title.</p>
      )}
    </div>
  );
}
