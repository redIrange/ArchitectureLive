// scripts/upscale/run.mjs — upscale every source JPEG with Real-ESRGAN, then
// downscale the 4x result to a sane cap and overwrite the source in place.
// Idempotent: a SHA-256 manifest records processed files so re-runs skip them.
//
// Usage:
//   node scripts/upscale/run.mjs                 # every project + news image
//   node scripts/upscale/run.mjs <slug> [slug…]  # only the named folders
//
// Env overrides (for the Upscayl fallback engine):
//   UPSCALE_BIN, UPSCALE_MODELS, UPSCALE_MODEL
import { readdirSync, existsSync, readFileSync, writeFileSync, statSync, rmSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import sharp from "sharp";

const BIN = process.env.UPSCALE_BIN || "scripts/upscale/vendor/realesrgan-ncnn-vulkan";
const MODELS = process.env.UPSCALE_MODELS || "scripts/upscale/vendor/models";
const MODEL = process.env.UPSCALE_MODEL || "realesrgan-x4plus";
const MANIFEST = "scripts/upscale/done.json";
const CAP = 2560;
const QUALITY = 88;
const SOURCE_DIRS = ["src/content/projects", "src/content/news"];
const IMG_RE = /^(hero-\d+|g\d+)\.jpg$/i;

export const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

export function shouldSkip(manifest, file, hash) {
  return manifest[file] === hash;
}

export async function downscaleEncode(inputBuffer, { cap = CAP, quality = QUALITY } = {}) {
  return sharp(inputBuffer)
    .resize({ width: cap, height: cap, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();
}

export async function processImage(file, { bin = BIN, models = MODELS, model = MODEL, cap = CAP, quality = QUALITY } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "upscale-"));
  const out = join(dir, "out.png");
  try {
    execFileSync(bin, ["-i", file, "-o", out, "-n", model, "-s", "4", "-m", models], { stdio: "pipe" });
    const buf = await downscaleEncode(readFileSync(out), { cap, quality });
    writeFileSync(file, buf);
    return sha256(buf);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export function collectImages(dirs = SOURCE_DIRS) {
  const files = [];
  for (const base of dirs) {
    if (!existsSync(base)) continue;
    for (const slug of readdirSync(base)) {
      const d = join(base, slug);
      if (!statSync(d).isDirectory()) continue;
      for (const f of readdirSync(d)) if (IMG_RE.test(f)) files.push(join(d, f));
    }
  }
  return files.sort();
}

async function main() {
  const only = process.argv.slice(2);
  const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")) : {};
  let files = collectImages();
  if (only.length) files = files.filter((f) => only.some((s) => f.includes(`/${s}/`)));
  let done = 0, skipped = 0;
  const failed = [];
  for (const file of files) {
    const cur = sha256(readFileSync(file));
    if (shouldSkip(manifest, file, cur)) { skipped++; continue; }
    process.stdout.write(`upscaling ${file} … `);
    try {
      manifest[file] = await processImage(file);
      writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
      done++;
      console.log("ok");
    } catch (e) {
      failed.push(file);
      console.log("FAILED");
      console.error(`  ${e.message}`);
    }
  }
  console.log(`\n${done} upscaled · ${skipped} already done · ${failed.length} failed · ${files.length} total`);
  if (failed.length) { console.error("failed:\n" + failed.map((f) => "  " + f).join("\n")); process.exitCode = 1; }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
