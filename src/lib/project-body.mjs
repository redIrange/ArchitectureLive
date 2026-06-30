// Parse a migrated project Markdown body into a clean { testimonial, prose }.
//
// The WordPress migration left every project body in a consistent shape:
//   1. (optional) an inline testimonial as two headings:
//        ### _"quote…"_
//        ### _\- Author, Place_
//   2. two `##` headings that simply repeat the project title + sector/location
//      already shown in the page caption (e.g. "## Period House" +
//      "## Extension and Alterations, Haslemere, Surrey")
//   3. the actual prose paragraphs (and sometimes trailing credits)
//
// This module strips (1) and (2) so the page can render a proper lavender
// testimonial block and interleave the prose with gallery images — matching
// the design — instead of a wall of text with a duplicated title.

/** Split Markdown into top-level blocks separated by blank lines. */
export function splitBlocks(md) {
  return String(md)
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);
}

/** Strip heading marks, wrapping underscores/quotes and a leading dash. */
function clean(s) {
  return s
    .replace(/^#{1,6}\s*/, "")
    .replace(/^_+|_+$/g, "")
    .trim()
    .replace(/^["“”']+|["“”']+$/g, "")
    .replace(/^\\?[-–—]\s*/, "")
    .trim();
}

/**
 * Parse a project body.
 * @param {string} md - raw Markdown body
 * @param {{ hasFrontmatterTestimonial?: boolean }} [opts]
 * @returns {{ testimonial: {quote:string, author?:string}|null, prose: string[] }}
 *   testimonial — lifted from the body ONLY when the project has no
 *   frontmatter testimonial (otherwise the body copy is a duplicate and is
 *   simply dropped). prose — the remaining body blocks, in order.
 */
export function parseProjectBody(md, { hasFrontmatterTestimonial = false } = {}) {
  const blocks = splitBlocks(md);
  let i = 0;

  // 1. leading `###` blocks = inline testimonial (quote, then author)
  const quoteBlocks = [];
  while (i < blocks.length && /^###\s/.test(blocks[i])) {
    quoteBlocks.push(blocks[i]);
    i++;
  }

  // 2. leading `##` blocks = title/sector echo of the caption (cap at 2 so a
  //    genuine prose subheading later in the body is never swallowed)
  let dropped = 0;
  while (i < blocks.length && dropped < 2 && /^##\s/.test(blocks[i])) {
    i++;
    dropped++;
  }

  const prose = blocks.slice(i);

  let testimonial = null;
  if (!hasFrontmatterTestimonial && quoteBlocks.length) {
    testimonial = {
      quote: clean(quoteBlocks[0]),
      author: quoteBlocks[1] ? clean(quoteBlocks[1]) : undefined,
    };
  }

  return { testimonial, prose };
}

/** Group prose blocks into chunks of up to `size` paragraphs (joined back to Markdown). */
export function groupProse(prose, size = 2) {
  const out = [];
  for (let i = 0; i < prose.length; i += size) {
    out.push(prose.slice(i, i + size).join("\n\n"));
  }
  return out;
}
