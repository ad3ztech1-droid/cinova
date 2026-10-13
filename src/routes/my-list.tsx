import { createFileRoute, Link } from "@tanstack/react-router";
import { Bookmark } from "lucide-react";
import { useMyList } from "@/lib/my-list";
import { MediaCard } from "@/components/MediaCard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/my-list")({
  head: () => ({
    meta: [
      { title: "My List — Your Saved Titles | Lumiere" },
      { name: "description", content: "Everything you saved on Lumiere, ready to watch whenever you are." },
      { property: "og:title", content: "My List — Your Saved Titles | Lumiere" },
      { property: "og:description", content: "Your personal watchlist of movies and series on Lumiere." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MyList,
});

function MyList() {
  const { items, ready } = useMyList();

  return (
    <div className="min-h-screen px-4 pb-16 pt-28 md:px-10">
      <h1 className="text-4xl md:text-6xl">My List</h1>
      <p className="mt-2 text-sm text-muted-foreground">Your next great watch.</p>

      {ready && items.length === 0 && (
        <div className="mt-16 flex flex-col items-center gap-4 text-center">
          <Bookmark className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Your list is empty.</p>
          <Button asChild><Link
            to="/movies"
          >
            Browse movies
          </Link></Button>
        </div>
      )}

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {items.map((item) => (
          <MediaCard key={`${item.media_type}-${item.id}`} item={item} />
        ))}
      </div>
    </div>
  );
}
