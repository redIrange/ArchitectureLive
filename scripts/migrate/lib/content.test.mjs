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
  assert.ok(!markdown.includes("#filter="), "no WP projects-filter nav links remain");
});

test("strips trailing credits block, preserves narrative prose", () => {
  // Simulate a Divi post_content already converted to markdown with a credits block at the end.
  // We test the credits stripping by constructing a synthetic markdown string and calling convert
  // with a fake HTML body (wrapped in et_pb_text so convert processes it).
  const syntheticContent = `[et_pb_text]<p>This is the narrative paragraph describing the project in detail and it is long enough.</p>

<p>architect</p>

<p>ArchitectureLIVE</p>

<p>contractor</p>

<p>JCT Project Services Ltd</p>

<p>photographer</p>

<p>Chris Murphy</p>[/et_pb_text]`;
  const { markdown } = convert(syntheticContent);
  assert.ok(/narrative paragraph/i.test(markdown), "narrative prose preserved");
  assert.ok(!/^architect$/im.test(markdown), "credits lead label 'architect' removed");
  assert.ok(!/ArchitectureLIVE/.test(markdown), "credit value 'ArchitectureLIVE' removed");
  assert.ok(!/JCT Project Services/.test(markdown), "credit value 'JCT Project Services' removed");
  assert.ok(!/photographer/i.test(markdown), "credits trailing label 'photographer' removed");
});
