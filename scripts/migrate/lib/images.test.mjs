// scripts/migrate/lib/images.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { rmSync, existsSync } from "node:fs";
import { extractOne, ARCHIVE } from "./wpress.mjs";
import { attachmentMap } from "./attachments.mjs";
import { extractRawImages, normalizeImages } from "./images.mjs";
const sql = extractOne(ARCHIVE, "database.sql").toString("utf8");

test("single-pass extract + normalize writes jpgs for resolvable ids", async () => {
  const tmp = "scripts/migrate/.tmp-raw";
  const dir = "scripts/migrate/.tmp-imgtest";
  rmSync(dir, { recursive: true, force: true });
  const raw = extractRawImages(ARCHIVE, attachmentMap(sql), ["5728", "8013"], tmp);
  assert.ok(raw.size >= 1, "extracted at least one raw image in one pass");
  const out = await normalizeImages(raw, ["5728", "8013"], dir, "g");
  assert.ok(out.length >= 1);
  for (const f of out) assert.ok(existsSync(`${dir}/${f}`));
  rmSync(dir, { recursive: true, force: true });
  rmSync(tmp, { recursive: true, force: true });
});
