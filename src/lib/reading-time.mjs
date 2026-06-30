// src/lib/reading-time.mjs
/**
 * Estimate reading time in whole minutes (200 wpm, minimum 1).
 * Strips markdown punctuation/links so word counts are realistic.
 */
export function readingTime(markdown) {
  const text = String(markdown || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~|-]+/g, " ");
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}
