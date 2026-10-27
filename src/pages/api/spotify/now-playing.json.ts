import type { APIRoute } from "astro";
import { getNowPlaying, NOW_PLAYING_CACHE_CONTROL } from "../../../lib/spotify";

export const prerender = false;

// `null` means nothing is playing; a 502 means Spotify failed.
export const GET = (async () => {
  try {
    const nowPlaying = await getNowPlaying();

    return new Response(JSON.stringify(nowPlaying), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": NOW_PLAYING_CACHE_CONTROL,
      },
    });
  } catch (error) {
    console.error(error);

    return new Response(null, {
      status: 502,
      headers: { "Cache-Control": "no-store" },
    });
  }
}) satisfies APIRoute;
