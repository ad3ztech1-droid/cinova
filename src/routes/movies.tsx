import { createFileRoute } from "@tanstack/react-router";
import { BrowseCatalog } from "@/components/BrowseCatalog";

export const Route = createFileRoute("/movies")({
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
  component: () => (
    <BrowseCatalog
      type="movie"
      title="Movies"
      subtitle="Every genre, sorted the way you like. Filter the full catalogue and press play."
    />
  ),
});
