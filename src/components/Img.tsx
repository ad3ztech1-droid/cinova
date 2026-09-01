import { useEffect, useState } from "react";

/**
 * Resilient image element.
 *
 * TMDB posters occasionally fail to load (CDN hiccups, ISP/DNS filtering of
 * image.tmdb.org, or rate limiting when many posters load at once). This
 * component silently retries the same asset through mirror hosts before
 * giving up, so the catalog keeps showing artwork instead of blank tiles.
 */

const mirrorsFor = (src: string): string[] => {
  const list = [src];
  if (src.includes("image.tmdb.org")) {
    list.push(src.replace("image.tmdb.org", "media.themoviedb.org"));
  }
  // Last resort: an image proxy that can reach TMDB even when the CDN
  // host itself is unreachable from the visitor's network.
  list.push(`https://images.weserv.nl/?url=${encodeURIComponent(src.replace(/^https?:\/\//, ""))}`);
  return list;
};

type Props = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string | null | undefined;
  /** Rendered when every source fails (or no path exists). */
  fallback?: React.ReactNode;
};

export function Img({ src, fallback = null, alt = "", ...rest }: Props) {
  const [attempt, setAttempt] = useState(0);
  const sources = src ? mirrorsFor(src) : [];

  useEffect(() => {
    setAttempt(0);
  }, [src]);

  if (!src || attempt >= sources.length) return <>{fallback}</>;

  return (
    <img
      {...rest}
      key={sources[attempt]}
      src={sources[attempt]}
      alt={alt}
      referrerPolicy="no-referrer"
      decoding="async"
      onError={() => setAttempt((a) => a + 1)}
    />
  );
}
