// Light/dark theme toggle. An explicit choice is stored in localStorage; when
// the chosen theme matches the system preference the stored value is cleared
// so the site follows the system again (mirrors the template's ThemeWatcher).
// The initial theme is applied by the inline script in BaseHead.astro.

type Theme = "light" | "dark";

const media = window.matchMedia("(prefers-color-scheme: dark)");

function getSystemTheme(): Theme {
  return media.matches ? "dark" : "light";
}

function getStoredTheme(): Theme | null {
  try {
    const theme = localStorage.getItem("theme");
    return theme === "light" || theme === "dark" ? theme : null;
  } catch {
    return null;
  }
}

function storeTheme(theme: Theme | null) {
  try {
    if (theme) {
      localStorage.setItem("theme", theme);
    } else {
      localStorage.removeItem("theme");
    }
  } catch {}
}

function getResolvedTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  // Disable transitions while switching so colours change instantly.
  const style = document.createElement("style");
  style.textContent =
    "*,*::before,*::after{-webkit-transition:none!important;transition:none!important}";
  document.head.appendChild(style);

  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;

  window.getComputedStyle(document.body);
  setTimeout(() => style.remove(), 1);
}

export function initThemeToggle() {
  const button = document.querySelector<HTMLButtonElement>(
    "[data-theme-toggle]",
  );

  function updateLabel() {
    const otherTheme = getResolvedTheme() === "dark" ? "light" : "dark";
    button?.setAttribute("aria-label", `Switch to ${otherTheme} theme`);
  }

  button?.addEventListener("click", () => {
    const theme = getResolvedTheme() === "dark" ? "light" : "dark";
    storeTheme(theme === getSystemTheme() ? null : theme);
    applyTheme(theme);
    updateLabel();
  });

  media.addEventListener("change", () => {
    const stored = getStoredTheme();
    if (stored === getSystemTheme()) {
      storeTheme(null);
    }
    applyTheme(getStoredTheme() ?? getSystemTheme());
    updateLabel();
  });

  updateLabel();
}
