// scripts/migrate/lib/attachments.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { extractOne, ARCHIVE } from "./wpress.mjs";
import { attachmentMap } from "./attachments.mjs";
const sql = extractOne(ARCHIVE, "database.sql").toString("utf8");

test("attachment ids resolve to uploads-relative image paths", () => {
  const map = attachmentMap(sql);
  assert.ok(map.size > 500, `expected many attachments, got ${map.size}`);
  // ids referenced by the Near Passivhaus project gallery
  for (const id of ["5728", "8013", "8686", "6822", "4522"]) {
    const p = map.get(id);
    assert.ok(p && /\.(jpe?g|png|webp)$/i.test(p), `id ${id} → ${p}`);
  }
});
