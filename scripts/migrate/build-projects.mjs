// scripts/migrate/build-projects.mjs
import { writeFileSync, rmSync, mkdirSync } from "node:fs";
import { extractOne, ARCHIVE } from "./lib/wpress.mjs";
import { rowObjects } from "./lib/sql.mjs";
import { attachmentMap, thumbnailMap } from "./lib/attachments.mjs";
import { convert } from "./lib/content.mjs";
import { SECTOR_BY_SLUG } from "./lib/taxonomy.mjs";
import { extractRawImages, normalizeImages } from "./lib/images.mjs";

const sql = extractOne(ARCHIVE, "database.sql").toString("utf8");
const posts = rowObjects(sql, "SERVMASK_PREFIX_posts");
const metaDesc = new Map(rowObjects(sql, "SERVMASK_PREFIX_postmeta")
  .filter((m) => m.meta_key === "_yoast_wpseo_metadesc").map((m) => [m.post_id, m.meta_value]));
const attMap = attachmentMap(sql);
const thumbs = thumbnailMap(sql);

const projects = posts
  .filter((p) => p.post_type === "page" && p.post_parent === "3861" && p.post_status === "publish")
  .sort((a, b) => (a.post_date < b.post_date ? 1 : -1));

const yaml = (s) => '"' + String(s ?? "").replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
const firstPara = (md) => (md.split("\n\n").find((b) => b.trim().length > 40) || "").replace(/\s+/g, " ").slice(0, 200);

// First pass: parse content + plan each project's image ids; collect ALL ids for one extraction.
const items = projects.map((p) => {
  const { markdown, galleryIds } = convert(p.post_content);
  const heroId = thumbs.get(p.ID);
  const heroIds = heroId ? [heroId] : galleryIds.slice(0, 1);
  return { p, slug: p.post_name, markdown, galleryIds, heroIds };
});
const allIds = items.flatMap((it) => [...it.heroIds, ...it.galleryIds]);

// ONE archive pass for every project image (see Task 6 timing rationale).
const tmpDir = "scripts/migrate/.raw-projects";
const raw = extractRawImages(ARCHIVE, attMap, allIds, tmpDir);

for (const it of items) {
  const { p, slug, markdown, galleryIds, heroIds } = it;
  const dir = `src/content/projects/${slug}`;
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });

  const heroFiles = await normalizeImages(raw, heroIds, dir, "hero-");
  const heroName = heroFiles[0] ?? null;
  const galleryFiles = await normalizeImages(raw, galleryIds, dir, "g");
  if (!heroName && galleryFiles.length === 0) console.warn(`  ! ${slug}: no images resolved`);

  const title = (p.post_title || slug).replace(/&amp;/g, "&");
  const locationPart = title.includes(",") ? title.split(",").slice(1).join(",").trim() : "";
  const excerpt = (metaDesc.get(p.ID) || firstPara(markdown)).replace(/\s+/g, " ").trim();
  const year = Number((p.post_date || "").slice(0, 4)) || undefined;

  const fm = [
    "---",
    `title: ${yaml(title)}`,
    `sector: ${yaml(SECTOR_BY_SLUG[slug] || "Extensions")}`,
    `location: ${yaml(locationPart)}`,
    `status: "Completed"`,
    year ? `year: ${year}` : null,
    `features: []`,
    heroName ? `heroImage: ${yaml("./" + heroName)}` : `# heroImage: MISSING`,
    `gallery: [${galleryFiles.map((f) => yaml("./" + f)).join(", ")}]`,
    `excerpt: ${yaml(excerpt)}`,
    `featured: false`,
    `draft: false`,
    "---",
    "",
    markdown,
    "",
  ].filter((l) => l !== null).join("\n");
  writeFileSync(`${dir}/index.md`, fm);
  console.log(`✓ ${slug}  hero=${heroName ? "y" : "n"} gallery=${galleryFiles.length}`);
}
rmSync(tmpDir, { recursive: true, force: true });
console.log(`\nBuilt ${projects.length} projects.`);
