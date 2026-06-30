// scripts/migrate/lib/content.mjs
import TurndownService from "turndown";
const td = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced", bulletListMarker: "-" });

// Lead labels that always introduce the credits block (case-insensitive, whole-line match).
const CREDIT_LEAD_LABELS = new Set([
  "architect", "architects", "contractor", "contractors",
  "engineer", "engineers", "structural engineer", "structural engineers",
  "client", "self-build", "self build",
]);

function stripTrailingCredits(markdown) {
  const paras = markdown.split(/\n\n+/);
  const idx = paras.findIndex((p) => CREDIT_LEAD_LABELS.has(p.trim().toLowerCase()));
  if (idx === -1) return markdown;
  const kept = paras.slice(0, idx);
  return kept.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
}

export const cleanExcerpt = (s) => String(s || "")
  .replace(/%%[^%]*%%/g, "")                  // strip leftover Yoast merge vars like %%primary_category%%
  .replace(/\[([^\]]*)\]\([^)]*$/g, "$1")     // a truncated trailing markdown link → keep just its text
  .replace(/\s+/g, " ").trim();

export function convert(postContent) {
  const content = postContent ?? "";
  const galleryIds = [];
  for (const m of content.matchAll(/\[gallery[^\]]*\bids="([^"]+)"/g))
    galleryIds.push(...m[1].split(",").map((s) => s.trim()).filter(Boolean));

  const videoUrls = [];
  for (const m of content.matchAll(/\[et_pb_video[^\]]*\bsrc="([^"]+)"/g)) videoUrls.push(m[1]);

  // Concatenate the inner HTML of every et_pb_text module (the prose).
  let html = "";
  for (const m of content.matchAll(/\[et_pb_text[^\]]*\]([\s\S]*?)\[\/et_pb_text\]/g)) html += m[1] + "\n";
  if (!html.trim()) html = content;                 // classic-editor posts: use as-is

  html = html
    .replace(/\[gallery[^\]]*\]/g, "")              // drop gallery placeholders (images handled separately)
    .replace(/\[\/?et_pb_[^\]]*\]/g, "")            // drop Divi wrappers
    .replace(/\[\/?[a-z_]+[^\]]*\]/g, "");          // drop any other shortcodes

  // Strip old WordPress projects-filter nav links (UI chrome, not editorial content).
  // These look like: [label](https://...#filter=something "title")
  const rawMarkdown = td.turndown(html)
    .replace(/\[[^\]]*\]\([^)]*#filter=[^)]*\)/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const markdown = stripTrailingCredits(rawMarkdown);
  return { markdown, galleryIds: [...new Set(galleryIds)], videoUrls };
}
