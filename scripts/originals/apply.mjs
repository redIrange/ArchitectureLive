// scripts/originals/apply.mjs — re-materialize project images from the high-res originals.
// Reads scripts/originals/mapping.json; for each mapped project, normalizes the chosen
// originals with the Plan 2 settings (auto-rotate, cap 2400px, JPEG q82 mozjpeg) into the
// project folder as hero-01.jpg + gNN.jpg, and rewrites the heroImage/gallery frontmatter.
// Idempotent per project (deletes old hero-/g images first, then writes fresh).
//
// Usage: node scripts/originals/apply.mjs
import { readFileSync, writeFileSync, readdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const LIB = "Original_Images/03 Image Library";
const MAP = "scripts/originals/mapping.json";
if (!existsSync(MAP)) {
  console.error(`! No mapping file: ${MAP}`);
  console.error("  Build it with scripts/originals/suggest.mjs + the owner's knowledge first.");
  process.exit(1);
}
const map = JSON.parse(readFileSync(MAP, "utf8"));
const isImg = (f) => /\.(jpe?g|png|tiff?|webp)$/i.test(f);

let applied = 0;
for (const [slug, cfg] of Object.entries(map)) {
  const dir = `src/content/projects/${slug}`;
  if (!existsSync(dir)) { console.warn(`! ${slug}: no such project folder, skipping`); continue; }
  const srcDir = join(LIB, cfg.dir);
  if (!existsSync(srcDir)) { console.warn(`! ${slug}: source dir missing: ${cfg.dir}`); continue; }
  const files = readdirSync(srcDir).filter(isImg).sort();
  if (!files.length) { console.warn(`! ${slug}: no images in ${cfg.dir}`); continue; }

  const ordered = cfg.hero ? [cfg.hero, ...files.filter((f) => f !== cfg.hero)] : files;

  // Remove existing hero-/gallery JPEGs (idempotent re-run); leave index.md + anything else.
  for (const f of readdirSync(dir)) {
    if (/^hero-\d+\.jpg$/i.test(f) || /^g\d+\.jpg$/i.test(f)) rmSync(join(dir, f));
  }

  const names = [];
  let n = 0;
  for (const f of ordered) {
    const name = n === 0 ? "hero-01.jpg" : `g${String(n).padStart(2, "0")}.jpg`;
    await sharp(join(srcDir, f))
      .rotate()
      .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(join(dir, name));
    names.push(name);
    n++;
  }

  let md = readFileSync(`${dir}/index.md`, "utf8");
  md = md
    .replace(/^heroImage:.*$/m, `heroImage: "./${names[0]}"`)
    .replace(/^gallery:.*$/m, `gallery: [${names.slice(1).map((x) => `"./${x}"`).join(", ")}]`);
  writeFileSync(`${dir}/index.md`, md);
  applied++;
  console.log(`✓ ${slug}: ${names.length} originals (${cfg.dir})`);
}
console.log(`\nDone: ${applied} project(s) upgraded. Now run: npm run check && npm run build`);
