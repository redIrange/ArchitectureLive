/**
 * Mobile navigation drawer — open/close, ESC to dismiss, body scroll-lock.
 * Tiny, dependency-free. Included once via SiteHeader.
 */

const btn = document.querySelector<HTMLButtonElement>('.al-menu-btn');
const drawer = document.getElementById('al-nav-drawer');

function openMenu(): void {
  if (!drawer) return;
  drawer.classList.add('is-open');
  drawer.setAttribute('aria-hidden', 'false');
  btn?.setAttribute('aria-expanded', 'true');
}

function closeMenu(): void {
  if (!drawer) return;
  drawer.classList.remove('is-open');
  drawer.setAttribute('aria-hidden', 'true');
  btn?.setAttribute('aria-expanded', 'false');
}

btn?.addEventListener('click', (e: MouseEvent) => {
  e.stopPropagation();
  drawer?.classList.contains('is-open') ? closeMenu() : openMenu();
});

// Tap / click anywhere outside the open panel closes it.
document.addEventListener('click', (e: MouseEvent) => {
  if (
    drawer?.classList.contains('is-open') &&
    !drawer.contains(e.target as Node) &&
    !btn?.contains(e.target as Node)
  ) {
    closeMenu();
  }
});

document.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'Escape') closeMenu();
});
