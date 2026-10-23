// Mobile navigation menu, built on a native modal <dialog>. Esc closes it
// natively; this wires up the open/close buttons and backdrop clicks.

export function initMobileNavigation() {
  const dialog = document.querySelector<HTMLDialogElement>("[data-mobile-nav]");
  const openButton = document.querySelector<HTMLButtonElement>(
    "[data-mobile-nav-open]",
  );
  if (!dialog || !openButton) {
    return;
  }

  openButton.addEventListener("click", () => dialog.showModal());

  dialog
    .querySelector("[data-mobile-nav-close]")
    ?.addEventListener("click", () => dialog.close());

  // Clicks on the ::backdrop are reported on the dialog itself, so close
  // when the click lands outside the panel's box.
  dialog.addEventListener("click", (event) => {
    const rect = dialog.getBoundingClientRect();
    const isInside =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;
    if (!isInside) {
      dialog.close();
    }
  });
}
