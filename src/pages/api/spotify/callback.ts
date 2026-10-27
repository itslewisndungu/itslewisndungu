import type { APIRoute } from "astro";
import { exchangeCode, STATE_COOKIE } from "../../../lib/spotify";

export const prerender = false;

// One-time setup route for getting a refresh token; not served in production.
export const GET = (async ({ cookies, url }) => {
  if (import.meta.env.PROD) {
    return new Response(null, { status: 404 });
  }

  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const state = url.searchParams.get("state");

  const storedState = cookies.get(STATE_COOKIE)?.value;
  cookies.delete(STATE_COOKIE, { path: "/api/spotify" });

  if (!state || state !== storedState) {
    return new Response("State mismatch", { status: 400 });
  }

  if (error || !code) {
    return new Response(`Spotify authorization failed: ${error ?? "no code"}`, {
      status: 400,
    });
  }

  const tokens = await exchangeCode(code);

  return new Response(JSON.stringify(tokens, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
}) satisfies APIRoute;
