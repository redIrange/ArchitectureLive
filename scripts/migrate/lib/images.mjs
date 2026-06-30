// scripts/migrate/lib/images.mjs
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { extractPaths } from "./wpress.mjs";
import { uploadPath } from "./attachments.mjs";

// ONE archive pass for every needed id. Returns Map<id, rawLocalPath>.
export function extractRawImages(archive, attMap, ids, tmpDir) {
  const pathById = new Map();                    // archivePath -> id
  for (const id of new Set(ids)) {
    const rel = attMap.get(id);
    if (!rel) { console.warn(`  ! attachment ${id} has no file, skipping`); continue; }
    pathById.set(uploadPath(rel), id);
  }
  rmSync(tmpDir, { recursive: true, force: true });
  mkdirSync(tmpDir, { recursive: true });
  const written = extractPaths(archive, new Set(pathById.keys()), tmpDir);  // single pass
  const rawById = new Map();
  for (const [apath, dest] of written) rawById.set(pathById.get(apath), dest);
  return rawById;
}

// Normalize a specific ordered id list into destDir from the prebuilt raw tree. No archive access.
export async function normalizeImages(rawById, ids, destDir, prefix) {
  mkdirSync(destDir, { recursive: true });
  const out = [];
  let n = 0;
  for (const id of ids) {
    const src = rawById.get(id);
    if (!src) continue;
    const name = `${prefix}${String(++n).padStart(2, "0")}.jpg`;
    await sharp(src).rotate().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true }).toFile(join(destDir, name));
    out.push(name);
  }
  return out;
}
