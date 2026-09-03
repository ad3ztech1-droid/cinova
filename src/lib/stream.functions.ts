import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  type: z.enum(["movie", "tv"]),
  id: z.number().int().positive(),
  season: z.number().int().positive().optional(),
  episode: z.number().int().positive().optional(),
});

export type StreamSource = { name: string; url: string; quality?: string };

/**
 * Frameable embed players, best-first. CodeSpecter's own player is kept last
 * because its inner host refuses cross-origin framing, so it renders blank.
 */
function embedServers(data: z.infer<typeof schema>): StreamSource[] {
  const s = data.season ?? 1;
  const e = data.episode ?? 1;
  const isTv = data.type === "tv";
  return [
    {
      name: "Server 1 · HD",
      url: isTv ? `https://vidlink.pro/tv/${data.id}/${s}/${e}` : `https://vidlink.pro/movie/${data.id}`,
    },
    {
      name: "Server 2",
      url: isTv
        ? `https://vidsrc.to/embed/tv/${data.id}/${s}/${e}`
        : `https://vidsrc.to/embed/movie/${data.id}`,
    },
    {
      name: "Server 3",
      url: isTv
        ? `https://player.videasy.net/tv/${data.id}/${s}/${e}`
        : `https://player.videasy.net/movie/${data.id}`,
    },
    {
      name: "Server 4",
      url: isTv
        ? `https://www.2embed.cc/embedtv/${data.id}&s=${s}&e=${e}`
        : `https://www.2embed.cc/embed/${data.id}`,
    },
  ];
}

/**
 * Resolves playable embed players for a title. The CodeSpecter key stays on
 * the server; only playback URLs reach the browser.
 */
export const getStreamSources = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env["CODESPECTER_API_KEY"] ?? process.env["NEXSTREAM_API_KEY"];

    const path =
      data.type === "movie"
        ? `movie/${data.id}`
        : `tv/${data.id}/${data.season ?? 1}/${data.episode ?? 1}`;

    const sources = embedServers(data);
    if (apiKey) {
      const key = encodeURIComponent(apiKey);
      sources.push({ name: "CodeSpecter Player", url: `https://api.codespecters.com/embed/${path}?apikey=${key}` });
    }

    return { sources, embed: null as string | null, error: null as string | null };
  });

