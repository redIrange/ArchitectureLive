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
  document.body.style.overflow = 'hidden';
  btn?.setAttribute('aria-expanded', 'true');
}

function closeMenu(): void {
  if (!drawer) return;
  drawer.classList.remove('is-open');
  drawer.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  btn?.setAttribute('aria-expanded', 'false');
}

btn?.addEventListener('click', () => {
  drawer?.classList.contains('is-open') ? closeMenu() : openMenu();
});

document.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'Escape') closeMenu();
});
