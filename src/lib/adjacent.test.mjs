// src/lib/adjacent.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { adjacent } from "./adjacent.mjs";
test("adjacent returns wrapped neighbours", () => {
  const ids = ["a", "b", "c"];
  assert.deepEqual(adjacent(ids, "b"), { prev: "a", next: "c" });
  assert.deepEqual(adjacent(ids, "a"), { prev: "c", next: "b" });
  assert.deepEqual(adjacent(ids, "c"), { prev: "b", next: "a" });
});
