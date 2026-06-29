/**
 * Sector filter — progressive enhancement.
 * Buttons carry [data-filter]; project wrappers carry [data-sector].
 * With JS off every card is visible (no display:none in initial HTML).
 */
const buttons = document.querySelectorAll<HTMLButtonElement>("[data-filter]");
const items = document.querySelectorAll<HTMLElement>("[data-sector]");
buttons.forEach((btn) =>
  btn.addEventListener("click", () => {
    const sel = btn.dataset.filter!;
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    items.forEach((it) => {
      it.style.display = sel === "All" || it.dataset.sector === sel ? "" : "none";
    });
  })
);
