// scripts/migrate/report.mjs
import { readFileSync, readdirSync } from "node:fs";
const read = (d, base) => readdirSync(base).filter((s) => !s.startsWith("_")).map((slug) => {
  const md = readFileSync(`${base}/${slug}/index.md`, "utf8");
  const f = (k) => (md.match(new RegExp(`^${k}: "?(.*?)"?$`, "m")) || [])[1] || "";
  const body = md.split("---\n").slice(2).join("---\n").replace(/\s+/g, " ").trim();
  return { slug, field: f, first: body.slice(0, 120) };
});
console.log("=== PROJECTS: sector · slug · opening ===");
for (const r of read("p", "src/content/projects"))
  console.log(`${(r.field("sector")).padEnd(11)} ${r.slug.padEnd(46)} ${r.first}`);
const cats = {};
for (const r of read("n", "src/content/news")) cats[r.field("category")] = (cats[r.field("category")] || 0) + 1;
console.log("\n=== NEWS category distribution ===", cats);
