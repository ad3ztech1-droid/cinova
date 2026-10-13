import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BrowseCatalog, defaultFilters, filterSearchSchema, type CatalogFilters } from "@/components/BrowseCatalog";

export const Route = createFileRoute("/series")({
  validateSearch: filterSearchSchema,
  head: () => ({
    meta: [
      { title: "TV Series — Full Seasons & Episodes | Lumiere" },
      {
        name: "description",
        content: "Explore TV series by genre and rating, browse seasons and episodes, and keep track of what you watch.",
      },
      { property: "og:title", content: "TV Series — Full Seasons & Episodes | Lumiere" },
      { property: "og:description", content: "Explore series by genre and rating, with full season and episode guides." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SeriesPage,
});

function SeriesPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();

  const filters: CatalogFilters = {
    genre: search.genre,
    year: search.year ?? "any",
    rating: search.rating,
    provider: search.provider,
    sort: search.sort ?? "popularity.desc",
  };

  const onFiltersChange = (next: CatalogFilters) => {
    navigate({
      to: "/series",
      search: {
        genre: next.genre,
        year: next.year === "any" ? undefined : next.year,
        rating: next.rating,
        provider: next.provider,
        sort: next.sort === "popularity.desc" ? undefined : next.sort,
      },
      replace: true,
    });
  };

  return (
    <BrowseCatalog
      type="tv"
      title="Series"
      subtitle="Stories worth staying in for."
      filters={filters ?? defaultFilters}
      onFiltersChange={onFiltersChange}
    />
  );
}
