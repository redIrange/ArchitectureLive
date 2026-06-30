// scripts/migrate/lib/content.mjs
import TurndownService from "turndown";
const td = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced", bulletListMarker: "-" });

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

  const markdown = td.turndown(html).replace(/\n{3,}/g, "\n\n").trim();
  return { markdown, galleryIds: [...new Set(galleryIds)], videoUrls };
}
