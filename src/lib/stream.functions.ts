import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  type: z.enum(["movie", "tv"]),
  id: z.number().int().positive(),
  season: z.number().int().positive().optional(),
  episode: z.number().int().positive().optional(),
});

/**
 * Builds the NexStream player embed URL on the server so the API key
 * never ships to the browser bundle.
 */
export const getStreamEmbed = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env["NEXSTREAM_API_KEY"];
    if (!apiKey) return { url: null as string | null, error: "Streaming provider is not configured." };

    const path =
      data.type === "movie"
        ? `movie/${data.id}`
        : `tv/${data.id}/${data.season ?? 1}/${data.episode ?? 1}`;

    return {
      url: `https://api.codespecters.com/embed/${path}?apikey=${encodeURIComponent(apiKey)}`,
      error: null as string | null,
    };
  });
