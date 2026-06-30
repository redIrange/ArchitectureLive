// scripts/migrate/lib/sql.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { extractOne, ARCHIVE } from "./wpress.mjs";
import { columnsOf, rowObjects } from "./sql.mjs";

const sql = extractOne(ARCHIVE, "database.sql").toString("utf8");

test("posts columns include post_type and post_parent", () => {
  const cols = columnsOf(sql, "SERVMASK_PREFIX_posts");
  for (const c of ["ID", "post_content", "post_title", "post_status", "post_name", "post_parent", "post_type"])
    assert.ok(cols.includes(c), `missing ${c}`);
});

test("27 published project pages under parent 3861", () => {
  const posts = rowObjects(sql, "SERVMASK_PREFIX_posts");
  const projects = posts.filter((p) => p.post_type === "page" && p.post_parent === "3861" && p.post_status === "publish");
  assert.equal(projects.length, 27);
});

test("112 published news posts", () => {
  const posts = rowObjects(sql, "SERVMASK_PREFIX_posts");
  const news = posts.filter((p) => p.post_type === "post" && p.post_status === "publish");
  assert.equal(news.length, 112);
});
