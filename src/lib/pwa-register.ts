// Guarded service-worker registration. This is the ONLY place /sw.js is registered.
// Never registers in dev, in iframes, or on Lovable preview hosts; in those
// contexts it actively unregisters any stale copy of /sw.js instead.

function isRefusedContext(): boolean {
  if (!import.meta.env.PROD) return true;
  if (typeof window === "undefined") return true;
  if (window.self !== window.top) return true; // inside an iframe
  const host = window.location.hostname;
  if (host.startsWith("id-preview--") || host.startsWith("preview--")) return true;
  if (host === "lovableproject.com" || host.endsWith(".lovableproject.com")) return true;
  if (host === "lovableproject-dev.com" || host.endsWith(".lovableproject-dev.com")) return true;
  if (host === "beta.lovable.dev" || host.endsWith(".beta.lovable.dev")) return true;
  if (new URLSearchParams(window.location.search).get("sw") === "off") return true;
  return false;
}

async function unregisterStale(): Promise<void> {
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      regs
        .filter((r) => r.active?.scriptURL.endsWith("/sw.js"))
        .map((r) => r.unregister()),
    );
  } catch {
    /* ignore */
  }
}

export async function registerServiceWorker(): Promise<void> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

  if (isRefusedContext()) {
    await unregisterStale();
    return;
  }

  try {
    await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch {
    /* registration failed — app still works fine without it */
  }
}
