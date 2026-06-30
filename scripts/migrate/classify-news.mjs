// scripts/migrate/classify-news.mjs
import { writeFileSync } from "node:fs";
import { extractOne, ARCHIVE } from "./lib/wpress.mjs";
import { rowObjects } from "./lib/sql.mjs";

const sql = extractOne(ARCHIVE, "database.sql").toString("utf8");
const posts = rowObjects(sql, "SERVMASK_PREFIX_posts").filter(
  (p) => p.post_type === "post" && p.post_status === "publish",
);
const slugify = (s) => String(s || "").toLowerCase();

// keyword → category signals (checked against title + body)
const RULES = [
  ["Awards", /\baward|waverley|shortlist|winner|won\b|commended|finalist|riba\b/i],
  ["Press", /\bfeatured|magazine|press|grand designs|channel 4|houzz|25 beautiful homes|tv\b|published|interview/i],
  ["Studio", /\bwe('| a)re (hiring|recruiting)|welcome|joins|anniversary|our (team|studio|office)|new member|christmas|year in review/i],
  ["Insight", /\bwhy |how to|guide|explained|what is|passivhaus\?|tips|considering|thinking about|sustainab/i],
  ["Projects", /\bcompleted|completion|planning (granted|approved|permission)|on site|construction|underway|breaking ground|topping out|handover/i],
];

const out = {};
for (const p of posts) {
  const hay = `${p.post_title} ${p.post_content}`;
  const scores = {};
  let best = "Projects", bestScore = 0; // default Projects (most news is project-related)
  for (const [cat, re] of RULES) {
    const c = (hay.match(re) || []).length;
    scores[cat] = c;
    if (c > bestScore) { bestScore = c; best = cat; }
  }
  out[p.post_name] = { category: best, scores };
}
writeFileSync("scripts/migrate/news-categories.suggested.json", JSON.stringify(out, null, 2) + "\n");
const tally = Object.values(out).reduce((m, x) => ((m[x.category] = (m[x.category] || 0) + 1), m), {});
console.log(`classified ${Object.keys(out).length} posts:`, tally);
