// TV mode: auto-detects smart TVs / TV boxes and enables remote (D-pad) navigation.
const TV_UA =
  /smart-?tv|smarttv|tizen|web0s|webos|netcast|hbbtv|bravia|aft[a-z]|android tv|googletv|google tv|crkey|roku|viera|philipstv|vidaa|appletv|tv safari|large screen|xbox|playstation/i;

export function isTvDevice(): boolean {
  if (typeof window === "undefined") return false;
  const q = new URLSearchParams(window.location.search).get("tv");
  if (q === "1") localStorage.setItem("lumiere-tv", "1");
  if (q === "0") localStorage.removeItem("lumiere-tv");
  if (localStorage.getItem("lumiere-tv") === "1") return true;
  return TV_UA.test(navigator.userAgent);
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([type=hidden]), select, textarea, iframe, [tabindex]:not([tabindex="-1"])';

function visible(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return false;
  const s = getComputedStyle(el);
  return s.visibility !== "hidden" && s.display !== "none";
}

type Dir = "left" | "right" | "up" | "down";

function move(dir: Dir) {
  const current = document.activeElement as HTMLElement | null;
  const all = Array.from(document.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el !== current && visible(el),
  );
  if (!current || current === document.body) {
    all.find((el) => el.getBoundingClientRect().top >= 0)?.focus();
    return;
  }
  const c = current.getBoundingClientRect();
  const cx = c.left + c.width / 2;
  const cy = c.top + c.height / 2;
  let best: HTMLElement | null = null;
  let bestScore = Infinity;
  for (const el of all) {
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const dx = x - cx;
    const dy = y - cy;
    let main: number, cross: number;
    if (dir === "right") { if (r.left < c.right - 4) continue; main = dx; cross = Math.abs(dy); }
    else if (dir === "left") { if (r.right > c.left + 4) continue; main = -dx; cross = Math.abs(dy); }
    else if (dir === "down") { if (r.top < c.bottom - 4) continue; main = dy; cross = Math.abs(dx); }
    else { if (r.bottom > c.top + 4) continue; main = -dy; cross = Math.abs(dx); }
    const score = main + cross * 2.5;
    if (score < bestScore) { bestScore = score; best = el; }
  }
  if (best) {
    best.focus({ preventScroll: true });
    best.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
  } else if (dir === "up") {
    window.scrollBy({ top: -400, behavior: "smooth" });
  } else if (dir === "down") {
    window.scrollBy({ top: 400, behavior: "smooth" });
  }
}

const KEYMAP: Record<number, Dir> = { 37: "left", 38: "up", 39: "right", 40: "down" };
const BACK_KEYS = new Set([8, 10009, 461, 27]); // Backspace, Tizen, webOS, Escape

let installed = false;
export function installTvMode() {
  if (installed || !isTvDevice()) return;
  installed = true;
  document.documentElement.classList.add("tv");

  window.addEventListener(
    "keydown",
    (e) => {
      const target = e.target as HTMLElement;
      const typing = target.tagName === "INPUT" || target.tagName === "TEXTAREA";
      const dir = KEYMAP[e.keyCode] ?? (e.key.startsWith("Arrow") ? (e.key.slice(5).toLowerCase() as Dir) : undefined);
      if (dir) {
        if (typing && (dir === "left" || dir === "right")) return;
        if (target.tagName === "SELECT" && (dir === "up" || dir === "down")) return;
        e.preventDefault();
        move(dir);
        return;
      }
      if (e.key === "Enter" && target.matches("[tabindex]:not(a):not(button)")) {
        e.preventDefault();
        target.click();
        return;
      }
      if (BACK_KEYS.has(e.keyCode) || e.key === "GoBack" || e.key === "BrowserBack") {
        if (typing && e.keyCode === 8) return;
        if (document.fullscreenElement) return;
        e.preventDefault();
        if (window.history.length > 1) window.history.back();
      }
    },
    true,
  );

  // Focus something on start so the remote works immediately.
  setTimeout(() => {
    if (document.activeElement === document.body) move("down");
  }, 800);
}
