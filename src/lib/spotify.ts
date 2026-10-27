import { randomBytes } from "node:crypto";

const CLIENT_ID = import.meta.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.SPOTIFY_CLIENT_SECRET;
const REFRESH_TOKEN = import.meta.env.SPOTIFY_REFRESH_TOKEN;

const ACCOUNTS_URL = "https://accounts.spotify.com";
const API_URL = "https://api.spotify.com/v1";

export const REDIRECT_URI = "http://127.0.0.1:4321/api/spotify/callback";
export const SCOPES = [
  "user-read-playback-state",
  "user-read-currently-playing",
  "user-top-read",
];

const REQUEST_TIMEOUT_MS = 5_000;

// Lets Vercel's CDN reuse responses briefly instead of calling Spotify on every visit.
export const NOW_PLAYING_CACHE_CONTROL =
  "public, s-maxage=30, stale-while-revalidate=30";

export const STATE_COOKIE = "spotify_auth_state";

type TokenResponse = {
  access_token: string;
  // Only returned when exchanging a code; refreshes usually omit it.
  refresh_token?: string;
  scope: string;
  token_type: "Bearer";
  expires_in: number;
};

export type NowPlaying = {
  title: string;
  artist: string;
  album: string;
  albumImageUrl?: string;
  songUrl: string;
  isPlaying: boolean;
  progressMs: number;
  durationMs: number;
};

export function createState(): string {
  return randomBytes(16).toString("hex");
}

export function getAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    scope: SCOPES.join(" "),
    redirect_uri: REDIRECT_URI,
    state,
  });

  return `${ACCOUNTS_URL}/authorize?${params.toString()}`;
}

async function requestToken(params: URLSearchParams): Promise<TokenResponse> {
  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString(
    "base64",
  );

  const response = await fetch(`${ACCOUNTS_URL}/api/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(
      `Spotify token request failed: ${response.status} ${await response.text()}`,
    );
  }

  return response.json();
}

export function exchangeCode(code: string): Promise<TokenResponse> {
  return requestToken(
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
    }),
  );
}

let cachedToken: { value: string; expiresAt: number } | null = null;

export async function getAccessToken(): Promise<string> {
  // Refresh a minute early so a token never expires mid-request.
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.value;
  }

  if (!REFRESH_TOKEN) {
    throw new Error("SPOTIFY_REFRESH_TOKEN is not set");
  }

  const body = await requestToken(
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: REFRESH_TOKEN,
    }),
  );

  cachedToken = {
    value: body.access_token,
    expiresAt: Date.now() + body.expires_in * 1000,
  };

  return cachedToken.value;
}

export async function getNowPlaying(): Promise<NowPlaying | null> {
  const token = await getAccessToken();

  const response = await fetch(`${API_URL}/me/player/currently-playing`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  // 204 means nothing is playing.
  if (response.status === 204) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `Spotify currently-playing request failed: ${response.status} ${await response.text()}`,
    );
  }

  const body = await response.json();

  // `item` is null during ads and is an episode when a podcast is playing.
  if (body.currently_playing_type !== "track" || !body.item) {
    return null;
  }

  const track = body.item;

  return {
    title: track.name,
    artist: track.artists
      .map((artist: { name: string }) => artist.name)
      .join(", "),
    album: track.album.name,
    albumImageUrl: track.album.images[0]?.url,
    songUrl: track.external_urls.spotify,
    isPlaying: body.is_playing,
    progressMs: body.progress_ms ?? 0,
    durationMs: track.duration_ms,
  };
}

export async function getTop10Songs() {}
