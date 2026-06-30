// scripts/migrate/lib/wpress.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { entries, extractOne, ARCHIVE } from "./wpress.mjs";

test("entries finds the database dump and a large uploads tree", () => {
  let count = 0, hasDb = false, hasUploads = false;
  for (const e of entries(ARCHIVE)) {
    count++;
    if (e.name === "database.sql") hasDb = true;
    if (e.path.startsWith("uploads/")) hasUploads = true;
  }
  assert.ok(count > 70000, `expected >70k entries, got ${count}`);
  assert.ok(hasDb, "database.sql present");
  assert.ok(hasUploads, "uploads/ present");
});

test("extractOne returns a SQL dump buffer", () => {
  const buf = extractOne(ARCHIVE, "database.sql");
  assert.ok(buf.length > 1_000_000);
  assert.ok(buf.toString("utf8", 0, 500).includes("SERVMASK_PREFIX_"));
});
