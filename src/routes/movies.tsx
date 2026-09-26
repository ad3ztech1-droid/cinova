import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BrowseCatalog, defaultFilters, filterSearchSchema, type CatalogFilters } from "@/components/BrowseCatalog";

export const Route = createFileRoute("/movies")({
  validateSearch: filterSearchSchema,
  head: () => ({
    meta: [
      { title: "Movies — Browse Every Genre | Lumiere" },
      {
        name: "description",
        content: "Browse thousands of movies by genre, rating and release date. Filter, sort and start watching on Lumiere.",
      },
      { property: "og:title", content: "Movies — Browse Every Genre | Lumiere" },
      { property: "og:description", content: "Filter thousands of movies by genre, rating and release date." },
    ],
  }),
  component: MoviesPage,
});

function MoviesPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();

  const filters: CatalogFilters = {
    genre: search.genre,
    year: search.year ?? "any",
    rating: search.rating,
    sort: search.sort ?? "popularity.desc",
  };

  const onFiltersChange = (next: CatalogFilters) => {
    navigate({
      to: "/movies",
      search: {
        genre: next.genre,
        year: next.year === "any" ? undefined : next.year,
        rating: next.rating,
        sort: next.sort === "popularity.desc" ? undefined : next.sort,
      },
      replace: true,
    });
  };

  return (
    <BrowseCatalog
      type="movie"
      title="Movies"
      subtitle="Every genre, sorted the way you like. Filter the full catalogue and press play."
      filters={filters ?? defaultFilters}
      onFiltersChange={onFiltersChange}
    />
  );
}
