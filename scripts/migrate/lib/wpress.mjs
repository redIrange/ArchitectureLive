// scripts/migrate/lib/wpress.mjs
import { openSync, readSync, closeSync, mkdirSync, writeFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";

const HEADER = 4377;
function field(buf, off, len) {
  const s = buf.subarray(off, off + len);
  const nul = s.indexOf(0);
  return s.toString("utf8", 0, nul === -1 ? len : nul);
}

export function* entries(archivePath) {
  const fileSize = statSync(archivePath).size;
  const fd = openSync(archivePath, "r");
  const h = Buffer.alloc(HEADER);
  let pos = 0;
  try {
    while (pos + HEADER <= fileSize) {
      if (readSync(fd, h, 0, HEADER, pos) < HEADER) break;
      let zero = true;
      for (let i = 0; i < HEADER; i++) if (h[i] !== 0) { zero = false; break; }
      if (zero) break;                                  // EOF marker
      const name = field(h, 0, 255);
      const size = parseInt(field(h, 255, 14), 10);
      const prefix = field(h, 281, 4096);               // 255+14+12
      if (!name || Number.isNaN(size) || pos + HEADER + size > fileSize) break; // guards the trailing phantom
      const path = prefix && prefix !== "." ? `${prefix}/${name}` : name;
      pos += HEADER;
      yield { name, size, prefix, path, dataPos: pos };
      pos += size;
    }
  } finally { closeSync(fd); }
}

export function extractPaths(archivePath, wantSet, destDir) {
  const fd = openSync(archivePath, "r");
  const out = new Map();
  try {
    for (const e of entries(archivePath)) {
      if (!wantSet.has(e.path)) continue;
      const buf = Buffer.alloc(e.size);
      readSync(fd, buf, 0, e.size, e.dataPos);
      const dest = join(destDir, e.path);
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, buf);
      out.set(e.path, dest);
    }
  } finally { closeSync(fd); }
  return out;
}

export function extractOne(archivePath, name) {
  const fd = openSync(archivePath, "r");
  try {
    for (const e of entries(archivePath)) {
      if (e.name !== name) continue;
      const buf = Buffer.alloc(e.size);
      readSync(fd, buf, 0, e.size, e.dataPos);
      return buf;
    }
  } finally { closeSync(fd); }
  throw new Error(`not found: ${name}`);
}

export const ARCHIVE = "Old_Website/www-architecturelive-co-uk-20260629-223836-r16wj2klbu8r.wpress";
