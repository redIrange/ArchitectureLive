// scripts/originals/suggest.mjs — scan the local studio image library and, for each
// project, suggest source folders ranked by keyword overlap with the project title.
// Codenames (Stonehurst, Tall Trees, St Barts, …) rarely match public titles, so this is
// only a starting point: the OWNER edits scripts/originals/mapping.json from here.
//
// Usage: node scripts/originals/suggest.mjs
import { readdirSync, statSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const LIB = "Original_Images/03 Image Library";
if (!existsSync(LIB)) {
  console.error(`! Library not found: ${LIB}`);
  console.error("  Original_Images/ is local-only (git-ignored). Make sure it's present.");
  process.exit(1);
}

function walkDirs(base, depth = 2, prefix = "") {
  const out = [];
  for (const e of readdirSync(base)) {
    if (e.startsWith(".") || e.startsWith("~$")) continue;
    const p = join(base, e);
    try {
      if (statSync(p).isDirectory()) {
        out.push(prefix + e);
        if (depth > 1) out.push(...walkDirs(p, depth - 1, prefix + e + "/"));
      }
    } catch {}
  }
  return out;
}

const dirs = walkDirs(LIB);
const slugs = readdirSync("src/content/projects").filter((s) => !s.startsWith("_"));
const words = (s) => s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3);

for (const slug of slugs) {
  const md = readFileSync(`src/content/projects/${slug}/index.md`, "utf8");
  const title = (md.match(/^title:\s*"(.*)"/m) || [])[1] || slug;
  const tw = new Set([...words(title), ...words(slug)]);
  const ranked = dirs
    .map((d) => ({ d, score: words(d).filter((w) => tw.has(w)).length }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  console.log(`${slug}\n   title: ${title}\n   candidates: ${ranked.map((r) => `${r.d}(${r.score})`).join("   ") || "— none, owner picks —"}`);
}
