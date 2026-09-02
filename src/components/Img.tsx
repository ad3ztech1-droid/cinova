import { useEffect, useRef, useState } from "react";

/**
 * Resilient image element.
 *
 * TMDB posters occasionally fail to load (CDN hiccups, ISP/DNS filtering of
 * image.tmdb.org, or rate limiting when many posters load at once). This
 * component silently retries the same asset through mirror hosts before
 * giving up, so the catalog keeps showing artwork instead of blank tiles.
 * A watchdog also rolls over to the next mirror when a source simply hangs
 * (no error event) so the page never sits on empty grey tiles.
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

export function Img({ src, fallback = null, alt = "", className = "", ...rest }: Props) {
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  const sources = src ? mirrorsFor(src) : [];
  const current = sources[attempt];

  useEffect(() => {
    setAttempt(0);
    setLoaded(false);
  }, [src]);

  // Watchdog: if a *visible* source neither loads nor errors within 8s, try the
  // next mirror. Off-screen lazy images are skipped — they simply haven't
  // started downloading yet and must not burn through the mirror list.
  useEffect(() => {
    if (!current || loaded) return;
    const t = setTimeout(() => {
      const el = ref.current;
      if (!el || (el.complete && el.naturalWidth > 0)) return;
      const r = el.getBoundingClientRect();
      const visible =
        r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth && r.width > 0;
      if (visible) setAttempt((a) => (a + 1 < sources.length ? a + 1 : a));
    }, 8000);
    return () => clearTimeout(t);
  }, [current, loaded, sources.length]);

  if (!src || attempt >= sources.length) return <>{fallback}</>;

  return (
    <img
      {...rest}
      ref={ref}
      key={current}
      src={current}
      alt={alt}
      referrerPolicy="no-referrer"
      decoding="async"
      className={`${className} ${loaded ? "" : "animate-pulse bg-surface-2"}`}
      onLoad={(e) => {
        setLoaded(true);
        rest.onLoad?.(e);
      }}
      onError={() => setAttempt((a) => a + 1)}
    />
  );
}
