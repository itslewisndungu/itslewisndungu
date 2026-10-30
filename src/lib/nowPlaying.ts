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

const trackKey = (nowPlaying: NowPlaying | null) => nowPlaying?.songUrl ?? "";

// Loads the next cover before the transition starts, so the new snapshot
// isn't a blank image.
async function preload(url?: string) {
  if (!url) return;
  const img = new Image();
  img.src = url;
  try {
    await img.decode();
  } catch {
    // A broken image shouldn't block the update.
  }
}

export function initNowPlaying() {
  const root = document.querySelector<HTMLElement>("[data-now-playing]");
  const card = root?.querySelector<HTMLElement>("[data-now-playing-card]");
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
  const link = card.querySelector<HTMLAnchorElement>('[data-field="link"]');

  let current: NowPlaying | null = JSON.parse(root.dataset.initial ?? "null");
  let timer: number | undefined;
  // Aborted by the returned cleanup, so polling stops when the page is
  // swapped out by a client-side navigation.
  const controller = new AbortController();
  const { signal } = controller;

  function render(nowPlaying: NowPlaying | null) {
    if (!card || !empty) return;

    card.hidden = !nowPlaying;
    empty.hidden = !!nowPlaying;
    if (!nowPlaying) {
      return;
    }

    if (link) link.href = nowPlaying.songUrl;
    setText("status", nowPlaying.isPlaying ? "Now playing" : "Paused");
    setText("title", nowPlaying.title);
    setText("artist", nowPlaying.artist);

    if (image) {
      image.hidden = !nowPlaying.albumImageUrl;
      if (nowPlaying.albumImageUrl) {
        // srcset/sizes from <Image> would override the new src.
        image.removeAttribute("srcset");
        image.removeAttribute("sizes");
        image.src = nowPlaying.albumImageUrl;
      } else {
        image.removeAttribute("src");
      }
      image.alt = `Album art for ${nowPlaying.album}`;
    }
  }

  // Animates song changes with a same-page view transition. The
  // view-transition-names only apply while data-track-changing is set, so
  // they don't leak into ClientRouter navigations.
  async function update(next: NowPlaying | null) {
    const changed = trackKey(next) !== trackKey(current);
    current = next;

    if (
      !changed ||
      !document.startViewTransition ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      render(next);
      return;
    }

    await preload(next?.albumImageUrl);
    if (signal.aborted || !root) return;

    root.dataset.trackChanging = "";
    const transition = document.startViewTransition(() => render(next));
    transition.finished.finally(() => {
      delete root.dataset.trackChanging;
    });
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
    if (!signal.aborted && !document.hidden) {
      timer = window.setTimeout(check, delay);
    }
  }

  async function check() {
    try {
      const response = await fetch(ENDPOINT, {
        signal: AbortSignal.any([
          signal,
          AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        ]),
      });
      if (!response.ok) {
        throw new Error(`Now playing request failed: ${response.status}`);
      }
      const next: NowPlaying | null = await response.json();
      await update(next);
      schedule(nextDelay(current));
    } catch {
      schedule(MAX_WAIT_MS);
    }
  }

  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) {
        window.clearTimeout(timer);
      } else {
        check();
      }
    },
    { signal },
  );

  schedule(
    root.dataset.failed !== undefined ? MAX_WAIT_MS : nextDelay(current),
  );

  return () => {
    controller.abort();
    window.clearTimeout(timer);
  };
}
