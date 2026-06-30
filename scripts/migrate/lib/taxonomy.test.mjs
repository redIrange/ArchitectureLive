// scripts/migrate/lib/taxonomy.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { extractOne, ARCHIVE } from "./wpress.mjs";
import { rowObjects } from "./sql.mjs";
import { SECTOR_BY_SLUG } from "./taxonomy.mjs";
const sql = extractOne(ARCHIVE, "database.sql").toString("utf8");

test("SECTOR_BY_SLUG covers all 27 published project slugs exactly", () => {
  const slugs = rowObjects(sql, "SERVMASK_PREFIX_posts")
    .filter((p) => p.post_type === "page" && p.post_parent === "3861" && p.post_status === "publish")
    .map((p) => p.post_name);
  assert.equal(slugs.length, 27);
  for (const s of slugs) assert.ok(SECTOR_BY_SLUG[s], `unclassified slug: ${s}`);
  assert.equal(Object.keys(SECTOR_BY_SLUG).length, 27, "no stray slugs in table");
});
