// src/lib/reading-time.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readingTime } from "./reading-time.mjs";

test("200 words is 1 minute", () => {
  assert.equal(readingTime(Array(200).fill("word").join(" ")), 1);
});
test("rounds up partial minutes", () => {
  assert.equal(readingTime(Array(250).fill("word").join(" ")), 2);
});
test("empty string is at least 1 minute", () => {
  assert.equal(readingTime(""), 1);
});
test("strips markdown syntax and counts words", () => {
  assert.equal(readingTime("# Heading\n\n[link](/x) **bold** word"), 1);
});
