import type { APIRoute } from "astro";
import {
  createState,
  getAuthorizeUrl,
  STATE_COOKIE,
} from "../../../lib/spotify";

export const prerender = false;

// One-time setup route for getting a refresh token; not served in production.
export const GET = (async ({ cookies, redirect }) => {
  if (import.meta.env.PROD) {
    return new Response(null, { status: 404 });
  }

  const state = createState();

  // `lax` still sends the cookie on Spotify's redirect back to the callback.
  cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/api/spotify",
    maxAge: 600,
  });

  return redirect(getAuthorizeUrl(state));
}) satisfies APIRoute;
