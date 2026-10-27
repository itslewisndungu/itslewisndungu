// Keeps the /spotify "now playing" card current. Checks again shortly after
// the song should end (capped so skips show up quickly), backs off when
// nothing is playing, and pauses while the tab is hidden.

import type { NowPlaying } from "./spotify";

const ENDPOINT = "/api/spotify/now-playing.json";
const MIN_WAIT_MS = 5_000;
const MAX_WAIT_MS = 30_000;
const IDLE_WAIT_MS = 90_000;
const SONG_END_BUFFER_MS = 2_000;
// The endpoint can make two 5s Spotify calls (token + player).
const REQUEST_TIMEOUT_MS = 12_000;

export function initNowPlaying() {
  const root = document.querySelector<HTMLElement>("[data-now-playing]");
  const card = root?.querySelector<HTMLAnchorElement>(
    "[data-now-playing-card]",
  );
  const empty = root?.querySelector<HTMLElement>("[data-now-playing-empty]");
  if (!root || !card || !empty) {
    return;
  }

  const setText = (name: string, text: string) => {
    const element = card.querySelector(`[data-field="${name}"]`);
    if (element) {
      element.textContent = text;
    }
  };
  const image = card.querySelector<HTMLImageElement>('[data-field="image"]');

  let current: NowPlaying | null = JSON.parse(root.dataset.initial ?? "null");
  let timer: number | undefined;

  function render(nowPlaying: NowPlaying | null) {
    if (!card || !empty) return;

    card.hidden = !nowPlaying;
    empty.hidden = !!nowPlaying;
    if (!nowPlaying) {
      return;
    }

    card.href = nowPlaying.songUrl;
    setText("status", nowPlaying.isPlaying ? "Now playing" : "Paused");
    setText("title", nowPlaying.title);
    setText("artist", nowPlaying.artist);

    if (image) {
      image.hidden = !nowPlaying.albumImageUrl;
      if (nowPlaying.albumImageUrl) {
        image.src = nowPlaying.albumImageUrl;
      } else {
        image.removeAttribute("src");
      }
      image.alt = `Album art for ${nowPlaying.album}`;
    }
  }

  function nextDelay(nowPlaying: NowPlaying | null) {
    if (!nowPlaying?.isPlaying) {
      return IDLE_WAIT_MS;
    }
    const remaining =
      nowPlaying.durationMs - nowPlaying.progressMs + SONG_END_BUFFER_MS;
    // The floor stops rapid re-polling while the CDN still serves the
    // previous song's cached response.
    return Math.min(Math.max(remaining, MIN_WAIT_MS), MAX_WAIT_MS);
  }

  function schedule(delay: number) {
    window.clearTimeout(timer);
    if (!document.hidden) {
      timer = window.setTimeout(check, delay);
    }
  }

  async function check() {
    try {
      const response = await fetch(ENDPOINT, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!response.ok) {
        throw new Error(`Now playing request failed: ${response.status}`);
      }
      current = await response.json();
      render(current);
      schedule(nextDelay(current));
    } catch {
      schedule(MAX_WAIT_MS);
    }
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      window.clearTimeout(timer);
    } else {
      check();
    }
  });

  schedule(
    root.dataset.failed !== undefined ? MAX_WAIT_MS : nextDelay(current),
  );
}
