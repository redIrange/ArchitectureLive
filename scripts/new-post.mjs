// scripts/new-post.mjs — scaffold a new project or news post.
// Slugifies the title, creates the content folder, normalizes any supplied images
// (auto-rotate, cap 2400px, JPEG q82 mozjpeg — same as the migration) into hero-01.jpg +
// gNN.jpg, and writes a draft frontmatter skeleton ready to edit.
//
// Usage: node scripts/new-post.mjs <project|news> "<Title>" [image-folder]
// Then: edit src/content/<coll>/<slug>/index.md, set draft:false, and `git push` to deploy.
import { readdirSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const [type, title, imgDir] = process.argv.slice(2);
if (!["project", "news"].includes(type) || !title) {
  console.error('usage: node scripts/new-post.mjs <project|news> "<Title>" [image-folder]');
  process.exit(1);
}

const slug = title
  .toLowerCase()
  .replace(/&/g, "and")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/(^-|-$)/g, "");
const dir = `src/content/${type === "project" ? "projects" : "news"}/${slug}`;
mkdirSync(dir, { recursive: true });

const names = [];
if (imgDir) {
  const files = readdirSync(imgDir)
    .filter((f) => /\.(jpe?g|png|tiff?|webp)$/i.test(f))
    .sort();
  let n = 0;
  for (const f of files) {
    const name = n === 0 ? "hero-01.jpg" : `g${String(n).padStart(2, "0")}.jpg`;
    await sharp(join(imgDir, f))
      .rotate()
      .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(join(dir, name));
    names.push(name);
    n++;
  }
}

const today = new Date().toISOString().slice(0, 10); // run-time only; fine for a CLI scaffolder
const hero = names[0] || "hero-01.jpg";
const fm =
  type === "project"
    ? `---
title: "${title}"
sector: "Extensions"        # Extensions | New Build | Education | Commercial
location: ""
status: "Completed"
year: ${today.slice(0, 4)}
features: []
heroImage: "./${hero}"
gallery: [${names.slice(1).map((x) => `"./${x}"`).join(", ")}]
excerpt: ""
featured: false
draft: true
---

Write the project narrative here.
`
    : `---
title: "${title}"
date: ${today}
category: "General"         # Extensions | New Build | Education | Commercial | General
heroImage: "./${hero}"
excerpt: ""
draft: true
---

Write the article here.
`;
writeFileSync(`${dir}/index.md`, fm);

console.log(`Created ${dir}/index.md (draft) with ${names.length} image(s).`);
if (!names.length) {
  console.log(`! No images supplied — add a hero image named ${hero} to ${dir}/ before building (heroImage is required).`);
}
console.log("Edit the frontmatter + body, set draft:false, then `git push` to deploy.");
