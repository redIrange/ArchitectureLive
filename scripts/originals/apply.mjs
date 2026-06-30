// scripts/originals/apply.mjs — re-materialize project images from the high-res originals.
// Reads scripts/originals/mapping.json; for each mapped project, gathers the chosen
// originals (one or several source folders), de-dupes near-duplicate variants, normalizes
// them with the Plan 2 settings (auto-rotate, cap 2400px, JPEG q82 mozjpeg) into the project
// folder as hero-01.jpg + gNN.jpg, and rewrites the heroImage/gallery frontmatter.
// Idempotent per project (deletes old hero-/g images first, then writes fresh).
//
// mapping.json entry shape (per project slug):
//   { "dir": "<one dir under the library>" }                       // single folder
//   { "dirs": ["<dir a>", "<dir b>"], "hero": "<filename.jpg>" }   // merged folders + chosen hero
//
// Usage: node scripts/originals/apply.mjs [slug ...]   (no args = every slug in mapping.json)
import { readFileSync, writeFileSync, readdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const LIB = "Original_Images/03 Image Library";
const MAP = "scripts/originals/mapping.json";
if (!existsSync(MAP)) {
  console.error(`! No mapping file: ${MAP}`);
  process.exit(1);
}
const map = JSON.parse(readFileSync(MAP, "utf8"));
const only = process.argv.slice(2);
const MAX_GALLERY = 14; // hero + up to 13 gallery images; override per project with "max" in mapping.json

const isImg = (f) => /\.(jpe?g|png|tiff?|webp)$/i.test(f);
// Drop collages, thumbnails, business cards, postcards, directory/guide listings, mood boards,
// before/after & "existing" marketing crops, temp/PSD files — not real project photos.
const JUNK = /thumbs\.db|collage|thumbnail|business|directory|\bguide\b|mood.?board|\bcard\b|post.?card|pos.?r?card|\blogo\b|-tn\.|~\$|\.psd$|before.?.?after|\bexisting\b|\d+\s*x\s*\d+|darker|_distorted/i;
// Collapse near-duplicate variants of the same shot (X.jpg / X_RIBA.jpg / X_edited-1.jpg / X small).
const baseKey = (f) =>
  f.toLowerCase()
    .replace(/\.[a-z0-9]+$/, "")
    .replace(/[ _-]+(riba|edited|small|distorted|copy|final|crop|web|v\d+)([ _-]*\d+)?$/g, "")
    .replace(/[ _-]+/g, " ")
    .trim();

function gather(dirs) {
  const seen = new Set();
  const out = [];
  for (const d of dirs) {
    const abs = join(LIB, d);
    if (!existsSync(abs)) { console.warn(`  ! missing source dir: ${d}`); continue; }
    for (const f of readdirSync(abs).filter(isImg).sort()) {
      if (JUNK.test(f)) continue;
      const k = baseKey(f);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push({ abs: join(abs, f), file: f });
    }
  }
  return out;
}

function pickHero(imgs, heroName) {
  if (heroName) {
    const i = imgs.findIndex((x) => x.file === heroName);
    if (i >= 0) return i;
    console.warn(`  ! hero "${heroName}" not found in sources — using heuristic`);
  }
  // Heuristic: prefer an exterior/approach shot, avoid before/detail/render.
  let best = 0, bestScore = -99;
  imgs.forEach((x, i) => {
    const s =
      (/exterior|front|street|approach|aerial|garden|elevation/i.test(x.file) ? 2 : 0) -
      (/before|sketch|\bplan\b|render|interior|kitchen|bathroom|stair|detail|socket/i.test(x.file) ? 1 : 0);
    if (s > bestScore) { bestScore = s; best = i; }
  });
  return best;
}

let applied = 0;
for (const [slug, cfg] of Object.entries(map)) {
  if (only.length && !only.includes(slug)) continue;
  const dir = `src/content/projects/${slug}`;
  if (!existsSync(dir)) { console.warn(`! ${slug}: no such project folder, skipping`); continue; }
  const dirs = cfg.dirs || (cfg.dir ? [cfg.dir] : []);
  const imgs = gather(dirs);
  if (!imgs.length) { console.warn(`! ${slug}: no usable images in ${dirs.join(", ")}`); continue; }

  const heroIdx = pickHero(imgs, cfg.hero);
  let ordered = [imgs[heroIdx], ...imgs.filter((_, i) => i !== heroIdx)];
  const cap = cfg.max || MAX_GALLERY;
  if (ordered.length > cap) {
    console.log(`  (capped ${slug}: ${ordered.length} → ${cap})`);
    ordered = ordered.slice(0, cap);
  }

  // Remove existing hero-/gallery JPEGs (idempotent); leave index.md + anything else.
  for (const f of readdirSync(dir)) {
    if (/^hero-\d+\.jpg$/i.test(f) || /^g\d+\.jpg$/i.test(f)) rmSync(join(dir, f));
  }

  const names = [];
  let n = 0;
  for (const x of ordered) {
    const name = n === 0 ? "hero-01.jpg" : `g${String(n).padStart(2, "0")}.jpg`;
    await sharp(x.abs)
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
  console.log(`✓ ${slug}: ${names.length} image(s) from ${dirs.length} folder(s) [${dirs.join(" + ")}]`);
}
console.log(`\nDone: ${applied} project(s) upgraded. Now run: npm run check && npm run build`);
