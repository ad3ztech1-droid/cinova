import { createFileRoute } from "@tanstack/react-router";
import { BrowseCatalog } from "@/components/BrowseCatalog";

export const Route = createFileRoute("/series")({
  head: () => ({
    meta: [
      { title: "TV Series — Full Seasons & Episodes | Lumiere" },
      {
        name: "description",
        content: "Explore TV series by genre and rating, browse seasons and episodes, and keep track of what you watch.",
      },
      { property: "og:title", content: "TV Series — Full Seasons & Episodes | Lumiere" },
      { property: "og:description", content: "Explore series by genre and rating, with full season and episode guides." },
    ],
  }),
  component: () => (
    <BrowseCatalog
      type="tv"
      title="Series"
      subtitle="Binge-worthy shows with full season and episode guides, updated daily."
    />
  ),
});
