// scripts/migrate/apply-news-categories.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";
const map = JSON.parse(readFileSync("scripts/migrate/news-categories.json", "utf8"));
let n = 0;
for (const [slug, cat] of Object.entries(map)) {
  const file = `src/content/news/${slug}/index.md`;
  if (!existsSync(file)) { console.warn(`! no news ${slug}`); continue; }
  let md = readFileSync(file, "utf8");
  if (/^category:/m.test(md)) md = md.replace(/^category:.*$/m, `category: "${cat}"`);
  else md = md.replace(/^(date:.*)$/m, `$1\ncategory: "${cat}"`);
  writeFileSync(file, md);
  n++;
}
console.log(`Set category on ${n} posts. Run: npm run check`);
