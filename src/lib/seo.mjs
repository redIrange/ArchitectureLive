// Small SEO helpers shared across pages.

/**
 * Alt text for a project/news image without doubling the location.
 * Many project titles already contain their town (e.g. "1960s Bungalow,
 * Haslemere, Surrey"), so appending the location again produces a
 * keyword-stuffed alt. Return the title alone when it already covers the
 * location; otherwise append it once.
 */
export function imageAlt(title, location) {
  if (!location) return title;
  return title.toLowerCase().includes(location.toLowerCase())
    ? title
    : `${title}, ${location}`;
}

/**
 * Clamp a meta-description to a sensible length (default 155 chars) on a word
 * boundary, adding an ellipsis when truncated. Used so reused post excerpts
 * don't overflow the SERP snippet. On-page copy keeps the full text.
 */
export function clampDescription(text, max = 155) {
  const s = String(text || "").trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : max).trimEnd()}…`;
}

/**
 * The town (first comma-separated token) of a "Town, County" location string,
 * lower-cased for matching. "Haslemere, Surrey" → "haslemere".
 */
export function townOf(location) {
  return String(location || "")
    .split(",")[0]
    .trim()
    .toLowerCase();
}

/**
 * Does a piece of text (a news title/excerpt) reference a project's town?
 * Used to relate news posts to the project they document.
 */
export function mentionsTown(text, location) {
  const town = townOf(location);
  if (!town) return false;
  return String(text || "").toLowerCase().includes(town);
}
