// scripts/migrate/build-news.mjs
import { writeFileSync, rmSync, mkdirSync } from "node:fs";
import { extractOne, ARCHIVE } from "./lib/wpress.mjs";
import { rowObjects } from "./lib/sql.mjs";
import { attachmentMap, thumbnailMap } from "./lib/attachments.mjs";
import { convert, cleanExcerpt } from "./lib/content.mjs";
import { newsCategory } from "./lib/taxonomy.mjs";
import { extractRawImages, normalizeImages } from "./lib/images.mjs";

const sql = extractOne(ARCHIVE, "database.sql").toString("utf8");
const posts = rowObjects(sql, "SERVMASK_PREFIX_posts");
const metaDesc = new Map(rowObjects(sql, "SERVMASK_PREFIX_postmeta")
  .filter((m) => m.meta_key === "_yoast_wpseo_metadesc").map((m) => [m.post_id, m.meta_value]));
const attMap = attachmentMap(sql), thumbs = thumbnailMap(sql);

const news = posts.filter((p) => p.post_type === "post" && p.post_status === "publish");
const yaml = (s) => '"' + String(s ?? "").replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
const firstPara = (md) => (md.split("\n\n").find((b) => b.trim().length > 40) || "").replace(/\s+/g, " ").slice(0, 200);

// First pass: parse + plan image ids; collect all ids. Hero is excluded from the inline body gallery.
const items = news.map((p) => {
  const { markdown, galleryIds } = convert(p.post_content);
  const heroId = thumbs.get(p.ID) || galleryIds[0];
  const bodyGalleryIds = galleryIds.filter((id) => id !== heroId);   // don't duplicate the hero in the body
  return { p, slug: p.post_name, markdown, heroId, bodyGalleryIds };
});
const allIds = items.flatMap((it) => [it.heroId, ...it.bodyGalleryIds].filter(Boolean));

// ONE archive pass for every news image (see Task 6 timing rationale).
const tmpDir = "scripts/migrate/.raw-news";
const raw = extractRawImages(ARCHIVE, attMap, allIds, tmpDir);

for (const it of items) {
  const { p, slug, markdown, heroId, bodyGalleryIds } = it;
  const dir = `src/content/news/${slug}`;
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const heroFiles = heroId ? await normalizeImages(raw, [heroId], dir, "hero-") : [];
  const galleryFiles = await normalizeImages(raw, bodyGalleryIds, dir, "g");
  const altText = (p.post_title || slug).replace(/&amp;/g, "&").replace(/\]/g, "");
  const body = markdown + (galleryFiles.length ? "\n\n" + galleryFiles.map((f) => `![${altText}](./${f})`).join("\n\n") : "");
  const title = (p.post_title || slug).replace(/&amp;/g, "&");
  const date = (p.post_date || "1970-01-01").slice(0, 10);
  const excerpt = cleanExcerpt(metaDesc.get(p.ID) || firstPara(markdown));
  const fm = ["---", `title: ${yaml(title)}`, `date: ${date}`, `category: ${yaml(newsCategory(sql, p.ID))}`,
    heroFiles[0] ? `heroImage: ${yaml("./" + heroFiles[0])}` : `# heroImage: MISSING`,
    `excerpt: ${yaml(excerpt)}`, `draft: false`, "---", "", body, ""]
    .filter((l) => l !== null).join("\n");
  writeFileSync(`${dir}/index.md`, fm);
  console.log(`✓ ${date} ${slug}`);
}
rmSync(tmpDir, { recursive: true, force: true });
console.log(`\nBuilt ${news.length} news posts.`);
