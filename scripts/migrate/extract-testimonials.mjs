// scripts/migrate/extract-testimonials.mjs
import { writeFileSync } from "node:fs";
import { extractOne, ARCHIVE } from "./lib/wpress.mjs";
import { rowObjects } from "./lib/sql.mjs";

const sql = extractOne(ARCHIVE, "database.sql").toString("utf8");
const projects = rowObjects(sql, "SERVMASK_PREFIX_posts").filter(
  (p) => p.post_type === "page" && p.post_parent === "3861" && p.post_status === "publish",
);

const stripHtml = (s) => String(s || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
// reject credits blocks, gallery-id lists, urls, shortcode attrs, and the practice's own philosophy voice
const isNoise = (q) =>
  /^[\d,\s]+$/.test(q) ||
  /https?:|et_pb_|gallery|\bid(s)?=|architect ArchitectureLIVE|\bengineer\b|\bcontractor\b|\bclient\b\s*$/i.test(q) ||
  /\bwe (love|find|take a holistic|believe that to be the best)\b/i.test(q); // practice philosophy, not a client
// client-voice cues raise confidence
const clientCue = /\b(we chose|we think|exceeded|delighted|recommend|highly|thrilled|couldn'?t|our (home|brief|expectations)|listens? well|every (challenge|part))\b/i;

const out = {};
for (const p of projects) {
  const body = stripHtml(p.post_content);
  const quotes = [...body.matchAll(/[""]([^"""]{30,400})[""]/g)]
    .map((m) => m[1].replace(/\s+/g, " ").trim())
    .filter((q) => q.length >= 30 && !isNoise(q));
  if (!quotes.length) continue;
  // best candidate: prefer a client-cue quote, else the longest
  const ranked = quotes.sort((a, b) => (clientCue.test(b) - clientCue.test(a)) || (b.length - a.length));
  out[p.post_name] = { quote: ranked[0], author: "", candidates: ranked.slice(0, 4) };
}
writeFileSync("scripts/migrate/testimonials.suggested.json", JSON.stringify(out, null, 2) + "\n");
console.log(`${Object.keys(out).length} projects with a testimonial candidate.`);
