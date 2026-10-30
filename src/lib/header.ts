// Spotlight header scroll behaviour: the header hides on scroll
// down and reveals on scroll up, and on the home page the large avatar shrinks
// into the header bar as you scroll.

function clamp(number: number, a: number, b: number) {
  const min = Math.min(a, b);
  const max = Math.max(a, b);
  return Math.min(Math.max(number, min), max);
}

function setProperty(property: string, value: string) {
  document.documentElement.style.setProperty(property, value);
}

function removeProperty(property: string) {
  document.documentElement.style.removeProperty(property);
}

export function initHeader() {
  const header = document.querySelector<HTMLElement>("[data-header]");
  const headerBar = document.querySelector<HTMLElement>("[data-header-bar]");
  if (!header || !headerBar) {
    return;
  }
  const bar = headerBar;

  const isHomePage = header.hasAttribute("data-home");
  const avatar = header.querySelector<HTMLElement>("[data-avatar]");

  const downDelay = avatar?.offsetTop ?? 0;
  const upDelay = 64;
  let isInitial = true;

  function updateHeaderStyles() {
    const { top, height } = bar.getBoundingClientRect();
    const scrollY = clamp(
      window.scrollY,
      0,
      document.body.scrollHeight - window.innerHeight,
    );

    if (isInitial) {
      setProperty("--header-position", "sticky");
    }

    setProperty("--content-offset", `${downDelay}px`);

    if (isInitial || scrollY < downDelay) {
      setProperty("--header-height", `${downDelay + height}px`);
      setProperty("--header-mb", `${-downDelay}px`);
    } else if (top + height < -upDelay) {
      const offset = Math.max(height, scrollY - upDelay);
      setProperty("--header-height", `${offset}px`);
      setProperty("--header-mb", `${height - offset}px`);
    } else if (top === 0) {
      setProperty("--header-height", `${scrollY + height}px`);
      setProperty("--header-mb", `${-scrollY}px`);
    }

    if (top === 0 && scrollY > 0 && scrollY >= downDelay) {
      setProperty("--header-inner-position", "fixed");
      removeProperty("--header-top");
      removeProperty("--avatar-top");
    } else {
      removeProperty("--header-inner-position");
      setProperty("--header-top", "0px");
      setProperty("--avatar-top", "0px");
    }
  }

  function updateAvatarStyles() {
    if (!isHomePage) {
      return;
    }

    const fromScale = 1;
    const toScale = 36 / 64;
    const fromX = 0;
    const toX = 2 / 16;

    const scrollY = downDelay - window.scrollY;

    let scale = (scrollY * (fromScale - toScale)) / downDelay + toScale;
    scale = clamp(scale, fromScale, toScale);

    let x = (scrollY * (fromX - toX)) / downDelay + toX;
    x = clamp(x, fromX, toX);

    setProperty(
      "--avatar-image-transform",
      `translate3d(${x}rem, 0, 0) scale(${scale})`,
    );

    const borderScale = 1 / (toScale / scale);
    const borderX = (-toX + x) * borderScale;
    const borderTransform = `translate3d(${borderX}rem, 0, 0) scale(${borderScale})`;

    setProperty("--avatar-border-transform", borderTransform);
    setProperty("--avatar-border-opacity", scale === toScale ? "1" : "0");
  }

  function updateStyles() {
    updateHeaderStyles();
    updateAvatarStyles();
    isInitial = false;
  }

  // window outlives client-side navigations, so hand back a way to remove
  // these listeners before the page is swapped.
  const controller = new AbortController();
  const { signal } = controller;

  updateStyles();
  window.addEventListener("scroll", updateStyles, { passive: true, signal });
  window.addEventListener("resize", updateStyles, { signal });

  return () => controller.abort();
}
