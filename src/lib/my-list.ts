import { useCallback, useEffect, useState } from "react";
import type { MediaItem } from "./tmdb";

const KEY = "lumiere.mylist.v1";
const EVENT = "lumiere-mylist-change";

function read(): MediaItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as MediaItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: MediaItem[]) {
  window.localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(EVENT));
}

export function useMyList() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setItems(read());
    sync();
    setReady(true);
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const has = useCallback(
    (id: number, type: string) => items.some((i) => i.id === id && i.media_type === type),
    [items],
  );

  const toggle = useCallback(
    (item: MediaItem) => {
      const current = read();
      const exists = current.some((i) => i.id === item.id && i.media_type === item.media_type);
      write(exists ? current.filter((i) => !(i.id === item.id && i.media_type === item.media_type)) : [item, ...current]);
      return !exists;
    },
    [],
  );

  return { items, ready, has, toggle };
}

const HISTORY_KEY = "lumiere.continue.v1";

export interface HistoryEntry extends MediaItem {
  progress: number;
  watchedAt: number;
  episodeLabel?: string;
}

export function recordWatch(entry: Omit<HistoryEntry, "watchedAt">) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    const list: HistoryEntry[] = raw ? JSON.parse(raw) : [];
    const next = [
      { ...entry, watchedAt: Date.now() },
      ...list.filter((i) => !(i.id === entry.id && i.media_type === entry.media_type)),
    ].slice(0, 20);
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("lumiere-history-change"));
  } catch {
    /* ignore */
  }
}

export function removeWatch(id: number, mediaType: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    const list: HistoryEntry[] = raw ? JSON.parse(raw) : [];
    window.localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify(list.filter((i) => !(i.id === id && i.media_type === mediaType))),
    );
    window.dispatchEvent(new Event("lumiere-history-change"));
  } catch {
    /* ignore */
  }
}

export function clearHistory() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(HISTORY_KEY);
    window.dispatchEvent(new Event("lumiere-history-change"));
  } catch {
    /* ignore */
  }
}

export function useContinueWatching() {
  const [items, setItems] = useState<HistoryEntry[]>([]);
  useEffect(() => {
    const sync = () => {
      try {
        const raw = window.localStorage.getItem(HISTORY_KEY);
        setItems(raw ? (JSON.parse(raw) as HistoryEntry[]) : []);
      } catch {
        setItems([]);
      }
    };
    sync();
    window.addEventListener("lumiere-history-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("lumiere-history-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return items;
}
