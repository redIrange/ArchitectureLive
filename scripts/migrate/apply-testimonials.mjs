// scripts/migrate/apply-testimonials.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const map = JSON.parse(readFileSync("scripts/migrate/testimonials.json", "utf8"));
const esc = (s) => String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
let n = 0;
for (const [slug, t] of Object.entries(map)) {
  const file = `src/content/projects/${slug}/index.md`;
  if (!existsSync(file)) { console.warn(`! no project ${slug}`); continue; }
  let md = readFileSync(file, "utf8");
  if (/^testimonial:/m.test(md)) { console.warn(`~ ${slug} already has a testimonial, skipping`); continue; }
  const block =
    `testimonial:\n  quote: "${esc(t.quote)}"` + (t.author ? `\n  author: "${esc(t.author)}"` : "");
  // insert before the closing front-matter fence (the 2nd '---')
  md = md.replace(/\n---\n/, `\n${block}\n---\n`);
  writeFileSync(file, md);
  n++;
  console.log(`✓ ${slug}`);
}
console.log(`\nApplied ${n} testimonials. Run: npm run check`);
