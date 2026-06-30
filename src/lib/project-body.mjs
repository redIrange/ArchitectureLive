// Segment a project's Markdown body so the page can drop image bands BETWEEN
// prose paragraphs — without altering, reordering, or removing any content.
// Every block stays in its original position and renders with the same Markdown
// styling as before; segmentation only decides where a full-width image may go.

/** Split Markdown into top-level blocks separated by blank lines. */
export function splitBlocks(md) {
  return String(md)
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);
}

const isHeading = (b) => /^#{1,6}\s/.test(b);
// A paragraph long enough to be worth breaking after (keeps short trailing
// lines like a credit or "ArchitectureLIVE" attached to the previous prose).
const SUBSTANTIAL = 50;

/**
 * Split a body into ordered segments for image interleaving. Leading headings
 * (e.g. an inline testimonial or the title echo) stay attached to the first
 * paragraph, so images only ever break up the prose below — never between
 * headings or mid-credit. Returns an array of Markdown strings, in order.
 */
export function bodySegments(md) {
  const blocks = splitBlocks(md);
  const segments = [];
  let cur = [];
  let started = false; // first substantial paragraph placed yet?
  for (const b of blocks) {
    const substantial = !isHeading(b) && b.length >= SUBSTANTIAL;
    if (substantial && started) {
      segments.push(cur.join("\n\n"));
      cur = [];
    }
    if (substantial) started = true;
    cur.push(b);
  }
  if (cur.length) segments.push(cur.join("\n\n"));
  return segments;
}
