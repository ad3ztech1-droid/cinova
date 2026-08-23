import { createFileRoute, Link } from "@tanstack/react-router";
import { Bookmark } from "lucide-react";
import { useMyList } from "@/lib/my-list";
import { MediaCard } from "@/components/MediaCard";

export const Route = createFileRoute("/my-list")({
  head: () => ({
    meta: [
      { title: "My List — Your Saved Titles | Lumiere" },
      { name: "description", content: "Everything you saved on Lumiere, ready to watch whenever you are." },
      { property: "og:title", content: "My List — Your Saved Titles | Lumiere" },
      { property: "og:description", content: "Your personal watchlist of movies and series on Lumiere." },
    ],
  }),
  component: MyList,
});

function MyList() {
  const { items, ready } = useMyList();

  return (
    <div className="min-h-screen px-4 pb-16 pt-28 md:px-10">
      <h1 className="text-3xl font-extrabold md:text-4xl">My List</h1>
      <p className="mt-2 text-sm text-muted-foreground">Saved on this device — add titles from any detail page.</p>

      {ready && items.length === 0 && (
        <div className="mt-16 flex flex-col items-center gap-4 text-center">
          <Bookmark className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Your list is empty.</p>
          <Link
            to="/movies"
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Browse movies
          </Link>
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
