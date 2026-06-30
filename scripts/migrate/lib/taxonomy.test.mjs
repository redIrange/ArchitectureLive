// scripts/migrate/lib/taxonomy.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { extractOne, ARCHIVE } from "./wpress.mjs";
import { rowObjects } from "./sql.mjs";
import { SECTOR_BY_SLUG, newsCategory } from "./taxonomy.mjs";
const sql = extractOne(ARCHIVE, "database.sql").toString("utf8");

test("SECTOR_BY_SLUG covers all 27 published project slugs exactly", () => {
  const slugs = rowObjects(sql, "SERVMASK_PREFIX_posts")
    .filter((p) => p.post_type === "page" && p.post_parent === "3861" && p.post_status === "publish")
    .map((p) => p.post_name);
  assert.equal(slugs.length, 27);
  for (const s of slugs) assert.ok(SECTOR_BY_SLUG[s], `unclassified slug: ${s}`);
  assert.equal(Object.keys(SECTOR_BY_SLUG).length, 27, "no stray slugs in table");
});

test("newsCategory real-data distribution: at least 2 distinct categories, not all General", () => {
  const posts = rowObjects(sql, "SERVMASK_PREFIX_posts")
    .filter((p) => p.post_type === "post" && p.post_status === "publish");
  assert.equal(posts.length, 112, `expected 112 published news posts, got ${posts.length}`);

  const distribution = {};
  for (const p of posts) {
    const cat = newsCategory(sql, p.ID);
    distribution[cat] = (distribution[cat] ?? 0) + 1;
  }

  console.log("newsCategory distribution:", JSON.stringify(distribution, null, 2));

  const distinct = Object.keys(distribution).length;
  assert.ok(distinct >= 2, `expected at least 2 distinct categories, got ${distinct}: ${JSON.stringify(distribution)}`);

  const generalCount = distribution["General"] ?? 0;
  assert.ok(generalCount < 112, `all 112 posts mapped to "General" — join or alias is broken`);
});
