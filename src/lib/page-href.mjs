/**
 * Generates the href for a numbered pagination link.
 *
 * News routing scheme:
 *   page 1  → firstPageUrl  (e.g. "/news")
 *   page N  → pageBase/N    (e.g. "/news/page/2")
 *
 * @param {number} p - Page number (1-based)
 * @param {{ firstPageUrl: string, pageBase: string }} opts
 */
export function pageHref(p, { firstPageUrl, pageBase }) {
  return p === 1 ? firstPageUrl : `${pageBase}/${p}`;
}
