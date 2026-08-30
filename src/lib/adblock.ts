/**
 * Internal, silent request/popup shield.
 *
 * Runs once on the client and neutralises the ad, popunder and redirect
 * behaviour that third-party embed players try to trigger. It is intentionally
 * invisible: nothing is rendered, nothing is logged, and blocked activity fails
 * quietly so the surrounding app keeps working normally.
 */

const BLOCKED_HOST_PATTERNS = [
  // generic ad / tracking networks
  "doubleclick", "googlesyndication", "googleadservices", "adservice.google",
  "adnxs", "adsystem", "adform", "adroll", "taboola", "outbrain", "criteo",
  "pubmatic", "rubiconproject", "openx", "smartadserver", "sharethrough",
  "media.net", "mgid", "revcontent", "zedo", "propellerads", "popads",
  "popcash", "popunder", "adsterra", "hilltopads", "exoclick", "juicyads",
  "trafficjunky", "clickadu", "adcash", "onclickads", "monetag", "clksite",
  "bidgear", "bidvertiser", "adskeeper", "adnium", "trafficstars", "tsyndicate",
  "ad-maven", "admaven", "vidoomy", "aniview", "spotxchange", "teads",
  // analytics / fingerprinting commonly injected by embed hosts
  "google-analytics", "googletagmanager", "googletagservices", "scorecardresearch",
  "quantserve", "hotjar", "yandex.ru/metrika", "mc.yandex", "histats",
  "statcounter", "clarity.ms", "amplitude", "mixpanel", "segment.io",
  // misc creative/redirect hosts
  "/ads/", "/adsbygoogle", "banner", "prebid", "pixel.gif", "track.php",
];

const isBlockedUrl = (raw: string): boolean => {
  if (!raw) return false;
  const url = raw.toLowerCase();
  if (url.startsWith("data:") || url.startsWith("blob:")) return false;
  return BLOCKED_HOST_PATTERNS.some((p) => url.includes(p));
};

let installed = false;

export function installShield() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  // 1. Popups / popunders / tab-unders.
  const noop = () => null;
  try {
    Object.defineProperty(window, "open", {
      configurable: true,
      writable: true,
      value: noop as unknown as typeof window.open,
    });
  } catch {
    /* noop */
  }

  // 2. Anchor-based redirects injected into the page (target=_blank ad links).
  window.addEventListener(
    "click",
    (event) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (isBlockedUrl(anchor.href)) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    true,
  );

  // 3. Forced top-level navigation away from the app by embedded content.
  window.addEventListener("beforeunload", (event) => {
    // Only guard scripted unloads that were not triggered by a user gesture.
    if (!navigator.userActivation || navigator.userActivation.isActive) return;
    event.preventDefault();
  });

  // 4. Network layer: silently drop ad/tracker requests.
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (isBlockedUrl(url)) {
      return Promise.resolve(
        new Response("", { status: 204, statusText: "No Content" }),
      );
    }
    return originalFetch(input as RequestInfo, init);
  };

  const OriginalXHR = window.XMLHttpRequest;
  const originalOpen = OriginalXHR.prototype.open;
  OriginalXHR.prototype.open = function (
    this: XMLHttpRequest & { __blocked?: boolean },
    method: string,
    url: string | URL,
    ...rest: unknown[]
  ) {
    this.__blocked = isBlockedUrl(String(url));
    // Point blocked calls at a harmless no-op endpoint instead of throwing.
    return originalOpen.apply(this, [
      method,
      this.__blocked ? "data:text/plain," : url,
      ...(rest as []),
    ] as unknown as Parameters<typeof originalOpen>);
  } as typeof originalOpen;

  if (typeof navigator.sendBeacon === "function") {
    const originalBeacon = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = (url: string | URL, data?: BodyInit | null) =>
      isBlockedUrl(String(url)) ? true : originalBeacon(url, data);
  }

  // 5. DOM layer: strip ad scripts, pixels and full-page overlay creatives.
  const cleanNode = (node: Node) => {
    if (!(node instanceof HTMLElement)) return;

    const src =
      (node as HTMLScriptElement).src ||
      (node as HTMLIFrameElement).src ||
      (node as HTMLImageElement).src ||
      "";
    if (src && isBlockedUrl(src)) {
      node.remove();
      return;
    }

    // Invisible/fixed overlays covering the viewport are classic click-jack ads.
    if (node.tagName === "DIV" || node.tagName === "A") {
      const style = node.getAttribute("style") ?? "";
      const s = style.replace(/\s/g, "").toLowerCase();
      const covering =
        (s.includes("position:fixed") || s.includes("position:absolute")) &&
        (s.includes("z-index:99") || s.includes("z-index:2147483647")) &&
        (s.includes("width:100%") || s.includes("width:100vw"));
      if (covering && node.closest("[data-app-root]") === null) node.remove();
    }
  };

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) m.addedNodes.forEach(cleanNode);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}
