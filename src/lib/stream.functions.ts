import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  type: z.enum(["movie", "tv"]),
  id: z.number().int().positive(),
  season: z.number().int().positive().optional(),
  episode: z.number().int().positive().optional(),
});

export type StreamSource = { name: string; url: string; quality?: string };

/** Higher score = preferred server. CodeSpecter is the primary provider. */
const rank = (s: StreamSource): number => {
  const n = (s.name || "").toLowerCase();
  let score = 0;
  if (n.includes("codespecter")) score += 100;
  if (n.includes("embedmaster")) score += 60;
  const q = `${s.quality ?? ""} ${s.url}`.toLowerCase();
  if (q.includes("2160") || q.includes("4k")) score += 40;
  else if (q.includes("1080")) score += 30;
  else if (q.includes("720")) score += 20;
  return score;
};

/**
 * Resolves playable stream sources from the NexStream provider.
 * The API key stays on the server; only playback URLs reach the browser.
 */
export const getStreamSources = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env["NEXSTREAM_API_KEY"];
    if (!apiKey) {
      return { sources: [] as StreamSource[], embed: null as string | null, error: "Streaming provider is not configured." };
    }

    const path =
      data.type === "movie"
        ? `movie/${data.id}`
        : `tv/${data.id}/${data.season ?? 1}/${data.episode ?? 1}`;
    const key = encodeURIComponent(apiKey);
    const embed = `https://api.codespecters.com/embed/${path}?apikey=${key}`;

    try {
      const res = await fetch(`https://api.codespecters.com/api/${path}?apikey=${key}`, {
        headers: { accept: "application/json" },
      });
      if (!res.ok) return { sources: [], embed, error: `Provider responded with ${res.status}.` };
      const json = (await res.json()) as { success?: boolean; sources?: StreamSource[] };
      const sources = (json.sources ?? []).filter((s) => typeof s?.url === "string");
      if (!sources.length) return { sources: [], embed, error: "No stream source available for this title yet." };
      return { sources, embed, error: null as string | null };
    } catch {
      return { sources: [], embed, error: "Could not reach the streaming provider." };
    }
  });
