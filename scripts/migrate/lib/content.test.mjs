// scripts/migrate/lib/content.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { extractOne, ARCHIVE } from "./wpress.mjs";
import { rowObjects } from "./sql.mjs";
import { convert } from "./content.mjs";
const sql = extractOne(ARCHIVE, "database.sql").toString("utf8");
const posts = rowObjects(sql, "SERVMASK_PREFIX_posts");

test("converts a Divi project: gallery ids + clean markdown, no shortcodes", () => {
  const p = posts.find((x) => x.post_name === "near-passivhaus-office-extension");
  const { markdown, galleryIds } = convert(p.post_content);
  assert.deepEqual(galleryIds, ["5728", "8013", "8686", "6822", "4522"]);
  assert.ok(!markdown.includes("[et_pb"), "no Divi shortcodes remain");
  assert.ok(/Passivhaus/i.test(markdown), "prose preserved");
});
