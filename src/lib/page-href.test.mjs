// src/lib/page-href.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { pageHref } from "./page-href.mjs";

test("pageHref — news scheme: page 1 → firstPageUrl (trailing slash)", () => {
  assert.strictEqual(
    pageHref(1, { firstPageUrl: "/news/", pageBase: "/news/page" }),
    "/news/"
  );
});

test("pageHref — news scheme: page 2 → pageBase/2/ (trailing slash)", () => {
  assert.strictEqual(
    pageHref(2, { firstPageUrl: "/news/", pageBase: "/news/page" }),
    "/news/page/2/"
  );
});

test("pageHref — news scheme: page 3 → pageBase/3/ (trailing slash)", () => {
  assert.strictEqual(
    pageHref(3, { firstPageUrl: "/news/", pageBase: "/news/page" }),
    "/news/page/3/"
  );
});
