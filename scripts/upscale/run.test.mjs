import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { downscaleEncode, shouldSkip } from "./run.mjs";

test("downscaleEncode caps the long edge at 2560 and outputs mozjpeg", async () => {
  const big = await sharp({ create: { width: 4000, height: 3000, channels: 3, background: { r: 100, g: 120, b: 140 } } }).png().toBuffer();
  const out = await downscaleEncode(big, { cap: 2560, quality: 88 });
  const meta = await sharp(out).metadata();
  assert.equal(meta.format, "jpeg");
  assert.equal(meta.width, 2560);
  assert.ok(meta.height <= 2560);
});

test("downscaleEncode never enlarges a small source", async () => {
  const small = await sharp({ create: { width: 800, height: 600, channels: 3, background: { r: 10, g: 20, b: 30 } } }).png().toBuffer();
  const out = await downscaleEncode(small, { cap: 2560 });
  const meta = await sharp(out).metadata();
  assert.equal(meta.width, 800);
});

test("shouldSkip is true only when the manifest hash matches", () => {
  assert.equal(shouldSkip({ "a.jpg": "h1" }, "a.jpg", "h1"), true);
  assert.equal(shouldSkip({ "a.jpg": "h1" }, "a.jpg", "h2"), false);
  assert.equal(shouldSkip({}, "a.jpg", "h1"), false);
});
