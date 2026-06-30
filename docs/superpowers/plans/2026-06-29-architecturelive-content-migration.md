# ArchitectureLIVE Content Migration — Implementation Plan (Plan 2 of 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the 4 GB WordPress/Divi `.wpress` backup into real Astro content — **27 projects** and **112 published news posts**, each with co-located images and valid frontmatter matching `src/content.config.ts` — plus a Cloudflare `_redirects` map from old URLs, replacing Plan 1's `_sample-*` seeds.

**Architecture:** A small Node (ESM) toolchain in `scripts/migrate/`. Low-level libs read the archive and parse the SQL dump; higher-level builders convert Divi content to Markdown, resolve gallery/featured images via the attachment map, extract those image bytes from the archive, and emit collection folders. Pure functions are unit-tested with `node --test`; builders are verified by running them and asserting on the generated tree + an Astro build.

**Tech Stack:** Node 20+ (system has 26, native TS strip + `.mjs`) · `turndown` (HTML→Markdown) · `sharp` (image normalize) · the Plan 1 Astro project.

## Global Constraints

- **Source archive (git-ignored, local):** `Old_Website/www-architecturelive-co-uk-20260629-223836-r16wj2klbu8r.wpress`. The DB dump inside is `./database.sql`; table prefix placeholder is `SERVMASK_PREFIX_`.
- **Migrate published only:** projects = `post_type='page'`, `post_parent='3861'`, `post_status='publish'` (27). News = `post_type='post'`, `post_status='publish'` (112). Exclude private/draft/auto-draft.
- **Image embedding:** body images come from `[gallery … ids="a,b,c"]` (attachment IDs) inside `[et_pb_text]`; hero = `postmeta._thumbnail_id`. Resolve IDs → files via `postmeta._wp_attached_file` (relative to `uploads/`).
- **Schema is fixed by Plan 1** (`src/content.config.ts`). If a needed field is missing, change the schema and Plan 1 Task 4 together; do not silently diverge.
- **Slugs are preserved** from the old `post_name` (so redirects are 1:1).
- **This is Phase A** (backup images, which ShortPixel over-compressed). Phase B (swap in `Original_Images` originals) is Plan 3 — keep image handling in one place so re-running with better sources is trivial.
- **Idempotent:** re-running a builder regenerates a slug's folder from scratch (delete-then-write), never appends.
- **Commit after every task.**

---

### Task 1: Migration harness + `.wpress` reader

**Files:**
- Create: `scripts/migrate/lib/wpress.mjs`
- Test: `scripts/migrate/lib/wpress.test.mjs`
- Modify: `package.json` (add `turndown` devDependency)

**Interfaces:**
- Produces:
  - `entries(archivePath): Iterable<{name, size, prefix, path, dataPos}>` — streams the archive's file headers (no content read).
  - `extractPaths(archivePath, wantSet: Set<string>, destDir): Map<string,string>` — writes each matching entry's bytes to `destDir/<path>`, returns `path → absoluteWrittenPath`.
  - `extractOne(archivePath, name): Buffer` — returns the bytes of the first entry whose `name` matches (used for `database.sql`).

- [ ] **Step 1: Add turndown**

```bash
npm install -D turndown
```

- [ ] **Step 2: Write the archive reader** (validated format: 4377-byte header = name[255] + size[14] + mtime[12] + prefix[4096]; EOF = a zero header)

```js
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
```

- [ ] **Step 3: Write the test (real archive)**

```js
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
  assert.ok(buf.toString("utf8", 0, 200).includes("SERVMASK_PREFIX_"));
});
```

- [ ] **Step 4: Run the test**

Run: `node --test scripts/migrate/lib/wpress.test.mjs`
Expected: 2 tests pass (≈73,785 entries, `database.sql` found, prefix string present).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(migrate): wpress archive reader + tests"
```

---

### Task 2: mysqldump parser

**Files:**
- Create: `scripts/migrate/lib/sql.mjs`
- Test: `scripts/migrate/lib/sql.test.mjs`

**Interfaces:**
- Produces:
  - `columnsOf(sql, table): string[]` — column names from the `CREATE TABLE` block.
  - `rowObjects(sql, table): Array<Record<string,string|null>>` — every `INSERT … VALUES` tuple mapped to `{column: value}`. NULLs become `null`; backslash escapes are decoded to real characters.

- [ ] **Step 1: Implement the parser** (a character state machine; handles extended inserts, quotes, and `\n \t \r \0 \\ \'` escapes — the recon Python proved the structure, this fixes escape decoding)

```js
// scripts/migrate/lib/sql.mjs
const UNESCAPE = { n: "\n", t: "\t", r: "\r", "0": "\0", "\\": "\\", "'": "'", '"': '"' };

export function columnsOf(sql, table) {
  const start = sql.indexOf("CREATE TABLE `" + table + "`");
  if (start < 0) throw new Error("no CREATE TABLE for " + table);
  const cols = [];
  for (const line of sql.slice(start).split("\n").slice(1)) {
    const m = line.match(/^\s*`([A-Za-z0-9_]+)`\s/);
    if (m) cols.push(m[1]);
    if (line.trim().startsWith(")")) break;
  }
  return cols;
}

function* tuples(sql, table) {
  const needle = "INSERT INTO `" + table + "` VALUES ";
  let i = 0;
  while ((i = sql.indexOf(needle, i)) >= 0) {
    i += needle.length;
    const n = sql.length;
    while (i < n && sql[i] === "(") {
      i++;
      const fields = [];
      let cur = "", inStr = false, isNull = true;
      while (i < n) {
        const c = sql[i];
        if (inStr) {
          if (c === "\\") { const nx = sql[i + 1]; cur += UNESCAPE[nx] ?? nx; i += 2; continue; }
          if (c === "'") { inStr = false; i++; continue; }
          cur += c; i++; continue;
        }
        if (c === "'") { inStr = true; isNull = false; i++; continue; }
        if (c === ",") { fields.push(isNull && cur === "NULL" ? null : cur); cur = ""; isNull = true; i++; continue; }
        if (c === ")") { fields.push(isNull && cur === "NULL" ? null : cur); i++; break; }
        cur += c; i++;
      }
      yield fields;
      if (i < n && sql[i] === ",") { i++; continue; }
      break;
    }
  }
}

export function rowObjects(sql, table) {
  const cols = columnsOf(sql, table);
  const out = [];
  for (const f of tuples(sql, table)) {
    if (f.length !== cols.length) continue;
    const o = {};
    cols.forEach((c, k) => (o[c] = f[k]));
    out.push(o);
  }
  return out;
}
```

- [ ] **Step 2: Test against the real dump**

```js
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
```

- [ ] **Step 3: Run**

Run: `node --test scripts/migrate/lib/sql.test.mjs`
Expected: 3 tests pass (columns present, 27 projects, 112 news).

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(migrate): mysqldump parser + tests"
```

---

### Task 3: Attachment resolver

**Files:**
- Create: `scripts/migrate/lib/attachments.mjs`
- Test: `scripts/migrate/lib/attachments.test.mjs`

**Interfaces:**
- Produces:
  - `attachmentMap(sql): Map<string, string>` — attachment ID → uploads-relative path (e.g. `"5728" → "2019/12/foo.jpg"`), from `postmeta._wp_attached_file`.
  - `thumbnailMap(sql): Map<string, string>` — post ID → featured-image attachment ID, from `postmeta._thumbnail_id`.
  - `uploadPath(rel): string` — prefixes `uploads/` (archive path).

- [ ] **Step 1: Implement**

```js
// scripts/migrate/lib/attachments.mjs
import { rowObjects } from "./sql.mjs";

function metaMap(sql, key) {
  const m = new Map();
  for (const r of rowObjects(sql, "SERVMASK_PREFIX_postmeta")) {
    if (r.meta_key === key) m.set(r.post_id, r.meta_value);
  }
  return m;
}
export const attachmentMap = (sql) => metaMap(sql, "_wp_attached_file");
export const thumbnailMap = (sql) => metaMap(sql, "_thumbnail_id");
export const uploadPath = (rel) => "uploads/" + rel;
```

- [ ] **Step 2: Test**

```js
// scripts/migrate/lib/attachments.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { extractOne, ARCHIVE } from "./wpress.mjs";
import { attachmentMap } from "./attachments.mjs";
const sql = extractOne(ARCHIVE, "database.sql").toString("utf8");

test("attachment ids resolve to uploads-relative image paths", () => {
  const map = attachmentMap(sql);
  assert.ok(map.size > 500, `expected many attachments, got ${map.size}`);
  // ids referenced by the Near Passivhaus project gallery
  for (const id of ["5728", "8013", "8686", "6822", "4522"]) {
    const p = map.get(id);
    assert.ok(p && /\.(jpe?g|png|webp)$/i.test(p), `id ${id} → ${p}`);
  }
});
```

- [ ] **Step 3: Run**

Run: `node --test scripts/migrate/lib/attachments.test.mjs`
Expected: pass (gallery IDs resolve to image paths).

> If a specific ID has no `_wp_attached_file` (e.g. it was deleted), the builder (Task 6) skips it and logs a warning — never crash on a missing image.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(migrate): attachment + thumbnail resolvers"
```

---

### Task 4: Divi → Markdown content converter

**Files:**
- Create: `scripts/migrate/lib/content.mjs`
- Test: `scripts/migrate/lib/content.test.mjs`

**Interfaces:**
- Produces `convert(postContent: string): { markdown, galleryIds: string[], videoUrls: string[] }`:
  - pulls the HTML inside every `[et_pb_text]…[/et_pb_text]` (the readable copy),
  - collects attachment IDs from every `[gallery … ids="…"]`,
  - collects `[et_pb_video … src="…"]` URLs,
  - strips all remaining `[et_pb_*]`/shortcodes, converts the surviving HTML to Markdown via turndown.

- [ ] **Step 1: Implement**

```js
// scripts/migrate/lib/content.mjs
import TurndownService from "turndown";
const td = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced", bulletListMarker: "-" });

export function convert(postContent) {
  const content = postContent ?? "";
  const galleryIds = [];
  for (const m of content.matchAll(/\[gallery[^\]]*\bids="([^"]+)"/g))
    galleryIds.push(...m[1].split(",").map((s) => s.trim()).filter(Boolean));

  const videoUrls = [];
  for (const m of content.matchAll(/\[et_pb_video[^\]]*\bsrc="([^"]+)"/g)) videoUrls.push(m[1]);

  // Concatenate the inner HTML of every et_pb_text module (the prose).
  let html = "";
  for (const m of content.matchAll(/\[et_pb_text[^\]]*\]([\s\S]*?)\[\/et_pb_text\]/g)) html += m[1] + "\n";
  if (!html.trim()) html = content;                 // classic-editor posts: use as-is

  html = html
    .replace(/\[gallery[^\]]*\]/g, "")              // drop gallery placeholders (images handled separately)
    .replace(/\[\/?et_pb_[^\]]*\]/g, "")            // drop Divi wrappers
    .replace(/\[\/?[a-z_]+[^\]]*\]/g, "");          // drop any other shortcodes

  const markdown = td.turndown(html).replace(/\n{3,}/g, "\n\n").trim();
  return { markdown, galleryIds: [...new Set(galleryIds)], videoUrls };
}
```

- [ ] **Step 2: Test on the real Near Passivhaus project**

```js
// scripts/migrate/lib/content.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { extractOne, ARCHIVE } from "./wpress.mjs";
import { rowObjects } from "./sql.mjs";
import { convert } from "./content.mjs";
const sql = extractOne(ARCHIVE, "database.sql").toString("utf8");
const posts = rowObjects(sql, "SERVMASK_PREFIX_posts");

test("converts a Divi project: gallery ids + clean markdown, no shortcodes", () => {
  const p = posts.find((x) => x.post_name === "near-passivhaus-office-extension");
  const { markdown, galleryIds } = convert(p.post_content);
  assert.deepEqual(galleryIds, ["5728", "8013", "8686", "6822", "4522"]);
  assert.ok(!markdown.includes("[et_pb"), "no Divi shortcodes remain");
  assert.ok(/Passivhaus/i.test(markdown), "prose preserved");
});
```

- [ ] **Step 3: Run**

Run: `node --test scripts/migrate/lib/content.test.mjs`
Expected: pass (5 gallery IDs, clean Markdown).

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(migrate): Divi/HTML → Markdown converter"
```

---

### Task 5: Sector + news-category classification

**Files:**
- Create: `scripts/migrate/lib/taxonomy.mjs`
- Test: `scripts/migrate/lib/taxonomy.test.mjs`

**Interfaces:**
- Produces:
  - `SECTOR_BY_SLUG: Record<string, "Extensions"|"New Build"|"Education"|"Commercial">` — a hand-curated starting map covering all 27 project slugs (refined in Task 11).
  - `newsCategory(sql, postId): string` — reads the WP `category` taxonomy via `term_relationships`/`term_taxonomy`/`terms`, maps to the design's set (`Awards|Press|Insight|Studio|Projects`), default `Insight`.

- [ ] **Step 1: Sector table (starting classification — verified to cover the 27 slugs)**

```js
// scripts/migrate/lib/taxonomy.mjs
import { rowObjects } from "./sql.mjs";

export const SECTOR_BY_SLUG = {
  "6th-form-centre-newbury-west-berkshire": "Education",
  "secondary-school-newbury-west-berkshire": "Education",
  "replacement-sports-pavilion-newbury-berkshire": "Education",
  "new-build-conference-centre-newbury-berkshire": "Commercial",
  "restaurant-duke-of-york-square-london": "Commercial",
  "new-build-retirement-house-fareham-hampshire": "New Build",
  "eco-friendly-retirement-house-liss-hampshire": "New Build",
  "retirement-property-duncton-west-sussex": "New Build",
  "housing-development-crawley-west-sussex": "New Build",
  "housing-development-midhurst-west-sussex": "New Build",
  "near-passivhaus-office-extension": "Extensions",
  "1960s-bungalow-haslemere-surrey": "Extensions",
  "1920s-country-house-haslemere-surrey": "Extensions",
  "1930s-country-house-mole-valley-surrey": "Extensions",
  "1950s-house-lodsworth-west-sussex": "Extensions",
  "1960s-detached-house-haslemere-surrey": "Extensions",
  "1960s-house-fernhurst-west-sussex": "Extensions",
  "1960s-house-haslemere-surrey": "Extensions",
  "1960s-house-lodsworth-west-sussex": "Extensions",
  "arts-crafts-home-haslemere-surrey": "Extensions",
  "country-house-cranleigh-surrey": "Extensions",
  "country-house-lodsworth-west-sussex": "Extensions",
  "listed-country-house-chiddingfold-surrey": "Extensions",
  "period-house-haslemere-surrey": "Extensions",
  "period-property-haslemere-surrey": "Extensions",
  "period-property-hindhead-surrey": "Extensions",
  "workers-cottage-south-downs-national-park": "Extensions",
};

const CATEGORY_ALIAS = { news: "Insight", insight: "Insight", insights: "Insight", awards: "Awards",
  award: "Awards", press: "Press", media: "Press", "in-the-press": "Press", studio: "Studio",
  practice: "Studio", projects: "Projects", project: "Projects" };

let _cache = null;
function categoryIndex(sql) {
  if (_cache) return _cache;
  const terms = new Map(rowObjects(sql, "SERVMASK_PREFIX_terms").map((t) => [t.term_id, t]));
  const tax = rowObjects(sql, "SERVMASK_PREFIX_term_taxonomy").filter((t) => t.taxonomy === "category");
  const ttById = new Map(tax.map((t) => [t.term_taxonomy_id, t]));
  const rel = new Map(); // post_id -> [term_taxonomy_id]
  for (const r of rowObjects(sql, "SERVMASK_PREFIX_term_relationships")) {
    if (!rel.has(r.object_id)) rel.set(r.object_id, []);
    rel.get(r.object_id).push(r.term_taxonomy_id);
  }
  _cache = { terms, ttById, rel };
  return _cache;
}

export function newsCategory(sql, postId) {
  const { terms, ttById, rel } = categoryIndex(sql);
  for (const ttId of rel.get(postId) ?? []) {
    const tt = ttById.get(ttId);
    if (!tt) continue;
    const slug = (terms.get(tt.term_id)?.slug || "").toLowerCase();
    if (CATEGORY_ALIAS[slug]) return CATEGORY_ALIAS[slug];
  }
  return "Insight";
}
```

- [ ] **Step 2: Test — every project slug is classified**

```js
// scripts/migrate/lib/taxonomy.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { extractOne, ARCHIVE } from "./wpress.mjs";
import { rowObjects } from "./sql.mjs";
import { SECTOR_BY_SLUG } from "./taxonomy.mjs";
const sql = extractOne(ARCHIVE, "database.sql").toString("utf8");

test("SECTOR_BY_SLUG covers all 27 published project slugs exactly", () => {
  const slugs = rowObjects(sql, "SERVMASK_PREFIX_posts")
    .filter((p) => p.post_type === "page" && p.post_parent === "3861" && p.post_status === "publish")
    .map((p) => p.post_name);
  assert.equal(slugs.length, 27);
  for (const s of slugs) assert.ok(SECTOR_BY_SLUG[s], `unclassified slug: ${s}`);
  assert.equal(Object.keys(SECTOR_BY_SLUG).length, 27, "no stray slugs in table");
});
```

- [ ] **Step 3: Run**

Run: `node --test scripts/migrate/lib/taxonomy.test.mjs`
Expected: pass (all 27 slugs present, table has exactly 27 keys). If it fails with an "unclassified slug", a slug changed — add it.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(migrate): sector table + news-category mapping"
```

---

### Task 6: Image extraction + normalize

**Files:**
- Create: `scripts/migrate/lib/images.mjs`
- Test: `scripts/migrate/lib/images.test.mjs`

**Interfaces (SINGLE-PASS design — measured: a full archive scan is ~4 s cold / 0.5 s warm, so the naive per-item `extractPaths` of the original draft would do hundreds of scans and risk the 600 s command timeout if the page cache evicts; instead extract ALL needed images in ONE pass, then normalize from the local temp tree):**
- Produces `extractRawImages(archive, attMap, ids, tmpDir): Map<id, rawLocalPath>` — resolve every (deduped) attachment ID to its `uploads/<rel>` path and extract them all from the archive in **one** `extractPaths` call into `tmpDir`. Returns `id → extracted raw file path`. IDs with no `_wp_attached_file` (or that fail extraction) are absent + warned.
- Produces `normalizeImages(rawById, ids, destDir, prefix): Promise<string[]>` — for the given ordered `ids`, sharp-normalize each present raw file (auto-rotate via EXIF, strip metadata, cap longest edge 2400 px, JPEG q82) into `destDir/<prefix><nn>.jpg`; returns the written filenames in order. No archive access — reads only the local `rawById` tree. IDs absent from `rawById` are skipped.

The builders (Tasks 7–8) call `extractRawImages` ONCE with every hero+gallery id across all items, then call `normalizeImages` per item per image-group.

- [ ] **Step 1: Implement**

```js
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
```

- [ ] **Step 2: Test — one-pass extract + normalize the Near Passivhaus gallery**

```js
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
```

- [ ] **Step 3: Run**

Run: `node --test scripts/migrate/lib/images.test.mjs`
Expected: pass (normalized JPEGs written). Note: this reads the 4 GB archive, so it may take a few seconds.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(migrate): image extraction + sharp normalize"
```

---

### Task 7: Build the projects collection

**Files:**
- Create: `scripts/migrate/build-projects.mjs`
- Test: verified by running it + asserting the generated tree

**Interfaces:**
- Consumes all libs. Produces `src/content/projects/<slug>/index.md` + `hero.jpg` + `01.jpg…` for all 27, deleting any prior generated folder for that slug first.

- [ ] **Step 1: Implement the builder**

```js
// scripts/migrate/build-projects.mjs
import { writeFileSync, rmSync, mkdirSync } from "node:fs";
import { extractOne, ARCHIVE } from "./lib/wpress.mjs";
import { rowObjects } from "./lib/sql.mjs";
import { attachmentMap, thumbnailMap } from "./lib/attachments.mjs";
import { convert } from "./lib/content.mjs";
import { SECTOR_BY_SLUG } from "./lib/taxonomy.mjs";
import { extractRawImages, normalizeImages } from "./lib/images.mjs";

const sql = extractOne(ARCHIVE, "database.sql").toString("utf8");
const posts = rowObjects(sql, "SERVMASK_PREFIX_posts");
const metaDesc = new Map(rowObjects(sql, "SERVMASK_PREFIX_postmeta")
  .filter((m) => m.meta_key === "_yoast_wpseo_metadesc").map((m) => [m.post_id, m.meta_value]));
const attMap = attachmentMap(sql);
const thumbs = thumbnailMap(sql);

const projects = posts
  .filter((p) => p.post_type === "page" && p.post_parent === "3861" && p.post_status === "publish")
  .sort((a, b) => (a.post_date < b.post_date ? 1 : -1));

const yaml = (s) => '"' + String(s ?? "").replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
const firstPara = (md) => (md.split("\n\n").find((b) => b.trim().length > 40) || "").replace(/\s+/g, " ").slice(0, 200);

// First pass: parse content + plan each project's image ids; collect ALL ids for one extraction.
const items = projects.map((p) => {
  const { markdown, galleryIds } = convert(p.post_content);
  const heroId = thumbs.get(p.ID);
  const heroIds = heroId ? [heroId] : galleryIds.slice(0, 1);
  return { p, slug: p.post_name, markdown, galleryIds, heroIds };
});
const allIds = items.flatMap((it) => [...it.heroIds, ...it.galleryIds]);

// ONE archive pass for every project image (see Task 6 timing rationale).
const tmpDir = "scripts/migrate/.raw-projects";
const raw = extractRawImages(ARCHIVE, attMap, allIds, tmpDir);

for (const it of items) {
  const { p, slug, markdown, galleryIds, heroIds } = it;
  const dir = `src/content/projects/${slug}`;
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });

  const heroFiles = await normalizeImages(raw, heroIds, dir, "hero-");
  const heroName = heroFiles[0] ?? null;
  const galleryFiles = await normalizeImages(raw, galleryIds, dir, "g");
  if (!heroName && galleryFiles.length === 0) console.warn(`  ! ${slug}: no images resolved`);

  const title = (p.post_title || slug).replace(/&amp;/g, "&");
  const locationPart = title.includes(",") ? title.split(",").slice(1).join(",").trim() : "";
  const excerpt = (metaDesc.get(p.ID) || firstPara(markdown)).replace(/\s+/g, " ").trim();
  const year = Number((p.post_date || "").slice(0, 4)) || undefined;

  const fm = [
    "---",
    `title: ${yaml(title)}`,
    `sector: ${yaml(SECTOR_BY_SLUG[slug] || "Extensions")}`,
    `location: ${yaml(locationPart)}`,
    `status: "Completed"`,
    year ? `year: ${year}` : null,
    `features: []`,
    heroName ? `heroImage: ${yaml("./" + heroName)}` : `# heroImage: MISSING`,
    `gallery: [${galleryFiles.map((f) => yaml("./" + f)).join(", ")}]`,
    `excerpt: ${yaml(excerpt)}`,
    `featured: false`,
    `draft: false`,
    "---",
    "",
    markdown,
    "",
  ].filter((l) => l !== null).join("\n");
  writeFileSync(`${dir}/index.md`, fm);
  console.log(`✓ ${slug}  hero=${heroName ? "y" : "n"} gallery=${galleryFiles.length}`);
}
rmSync(tmpDir, { recursive: true, force: true });
console.log(`\nBuilt ${projects.length} projects.`);
```

- [ ] **Step 2: Remove the sample projects, then run**

```bash
rm -rf src/content/projects/_sample-passivhaus-office src/content/projects/_sample-listed-country-house
node scripts/migrate/build-projects.mjs
```

Expected: 27 `✓` lines, then `Built 27 projects.` Any `! … no images resolved` lines name projects to fix by hand later.

- [ ] **Step 3: Assert the generated tree**

```bash
test "$(ls -d src/content/projects/*/ | grep -vc _sample)" -eq 27 && echo "27 DIRS OK"
test -f "src/content/projects/near-passivhaus-office-extension/index.md" && echo "INDEX OK"
grep -L "heroImage:" src/content/projects/*/index.md || echo "ALL HAVE HERO"
```

Expected: `27 DIRS OK`, `INDEX OK`, and ideally `ALL HAVE HERO` (any files listed are missing a hero → note for manual fix).

- [ ] **Step 4: Set a sensible `featured: true` on 3–6 flagship projects**

Edit `featured: true` in: `near-passivhaus-office-extension`, `listed-country-house-chiddingfold-surrey`, `6th-form-centre-newbury-west-berkshire`, `restaurant-duke-of-york-square-london` (a spread across sectors). Verify exactly the chosen files changed.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(migrate): generate 27 project entries from backup"
```

---

### Task 8: Build the news collection

**Files:**
- Create: `scripts/migrate/build-news.mjs`

**Interfaces:**
- Produces `src/content/news/<slug>/index.md` + `hero.jpg` for all 112 published posts.

- [ ] **Step 1: Implement** (same shape as Task 7; news frontmatter = `title,date,category,heroImage,excerpt,draft`)

```js
// scripts/migrate/build-news.mjs
import { writeFileSync, rmSync, mkdirSync } from "node:fs";
import { extractOne, ARCHIVE } from "./lib/wpress.mjs";
import { rowObjects } from "./lib/sql.mjs";
import { attachmentMap, thumbnailMap } from "./lib/attachments.mjs";
import { convert } from "./lib/content.mjs";
import { newsCategory } from "./lib/taxonomy.mjs";
import { extractRawImages, normalizeImages } from "./lib/images.mjs";

const sql = extractOne(ARCHIVE, "database.sql").toString("utf8");
const posts = rowObjects(sql, "SERVMASK_PREFIX_posts");
const metaDesc = new Map(rowObjects(sql, "SERVMASK_PREFIX_postmeta")
  .filter((m) => m.meta_key === "_yoast_wpseo_metadesc").map((m) => [m.post_id, m.meta_value]));
const attMap = attachmentMap(sql), thumbs = thumbnailMap(sql);

const news = posts.filter((p) => p.post_type === "post" && p.post_status === "publish");
const yaml = (s) => '"' + String(s ?? "").replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
const firstPara = (md) => (md.split("\n\n").find((b) => b.trim().length > 40) || "").replace(/\s+/g, " ").slice(0, 200);

// First pass: parse + plan image ids; collect all ids. Hero is excluded from the inline body gallery.
const items = news.map((p) => {
  const { markdown, galleryIds } = convert(p.post_content);
  const heroId = thumbs.get(p.ID) || galleryIds[0];
  const bodyGalleryIds = galleryIds.filter((id) => id !== heroId);   // don't duplicate the hero in the body
  return { p, slug: p.post_name, markdown, heroId, bodyGalleryIds };
});
const allIds = items.flatMap((it) => [it.heroId, ...it.bodyGalleryIds].filter(Boolean));

// ONE archive pass for every news image (see Task 6 timing rationale).
const tmpDir = "scripts/migrate/.raw-news";
const raw = extractRawImages(ARCHIVE, attMap, allIds, tmpDir);

for (const it of items) {
  const { p, slug, markdown, heroId, bodyGalleryIds } = it;
  const dir = `src/content/news/${slug}`;
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const heroFiles = heroId ? await normalizeImages(raw, [heroId], dir, "hero-") : [];
  const galleryFiles = await normalizeImages(raw, bodyGalleryIds, dir, "g");
  const body = markdown + (galleryFiles.length ? "\n\n" + galleryFiles.map((f) => `![](./${f})`).join("\n\n") : "");
  const title = (p.post_title || slug).replace(/&amp;/g, "&");
  const date = (p.post_date || "1970-01-01").slice(0, 10);
  const excerpt = (metaDesc.get(p.ID) || firstPara(markdown)).replace(/\s+/g, " ").trim();
  const fm = ["---", `title: ${yaml(title)}`, `date: ${date}`, `category: ${yaml(newsCategory(sql, p.ID))}`,
    heroFiles[0] ? `heroImage: ${yaml("./" + heroFiles[0])}` : `# heroImage: MISSING`,
    `excerpt: ${yaml(excerpt)}`, `draft: false`, "---", "", body, ""]
    .filter((l) => l !== null).join("\n");
  writeFileSync(`${dir}/index.md`, fm);
  console.log(`✓ ${date} ${slug}`);
}
rmSync(tmpDir, { recursive: true, force: true });
console.log(`\nBuilt ${news.length} news posts.`);
```

> News posts with no featured image and no gallery will have a `# heroImage: MISSING` comment. The
> `news` schema requires `heroImage`, so Task 10 handles these: either pick a default house image or
> set the schema's `heroImage` optional + render a fallback. **Decision:** add an `heroImage:
> z.optional(image())` only if >5 posts lack one; otherwise hand-fix the few. Decide in Task 10 from the count.

- [ ] **Step 2: Remove samples, run**

```bash
rm -rf src/content/news/_sample-waverley-award src/content/news/_sample-passivhaus-approach
node scripts/migrate/build-news.mjs
```

Expected: 112 `✓` lines, `Built 112 news posts.`

- [ ] **Step 3: Assert + count missing heroes**

```bash
test "$(ls -d src/content/news/*/ | grep -vc _sample)" -eq 112 && echo "112 DIRS OK"
echo "missing hero: $(grep -l 'heroImage: MISSING' src/content/news/*/index.md | wc -l)"
```

Expected: `112 DIRS OK` and a count of hero-less posts (informs the Task 10 decision).

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(migrate): generate 112 news entries from backup"
```

---

### Task 9: Old-URL → new-URL redirects

**Files:**
- Create: `scripts/migrate/build-redirects.mjs`, `public/_redirects`

**Interfaces:**
- Produces `public/_redirects` (Cloudflare Pages format) mapping every old root slug to its new path, 301.

- [ ] **Step 1: Implement**

```js
// scripts/migrate/build-redirects.mjs
import { writeFileSync } from "node:fs";
import { extractOne, ARCHIVE } from "./lib/wpress.mjs";
import { rowObjects } from "./lib/sql.mjs";
const sql = extractOne(ARCHIVE, "database.sql").toString("utf8");
const posts = rowObjects(sql, "SERVMASK_PREFIX_posts");
const lines = ["# Generated by build-redirects.mjs — old WordPress URLs → new Astro routes"];
for (const p of posts.filter((x) => x.post_type === "page" && x.post_parent === "3861" && x.post_status === "publish"))
  lines.push(`/${p.post_name}  /projects/${p.post_name}  301`);
for (const p of posts.filter((x) => x.post_type === "post" && x.post_status === "publish"))
  lines.push(`/${p.post_name}  /news/${p.post_name}  301`);
// the old "Projects" listing page lived at /projects already → no-op; old /news page maps to /news
writeFileSync("public/_redirects", lines.join("\n") + "\n");
console.log(`Wrote ${lines.length - 1} redirects.`);
```

- [ ] **Step 2: Run + assert**

```bash
node scripts/migrate/build-redirects.mjs
test "$(grep -c ' 301' public/_redirects)" -ge 139 && echo "REDIRECTS OK"   # 27 + 112
grep -q "/near-passivhaus-office-extension  /projects/near-passivhaus-office-extension  301" public/_redirects && echo "SAMPLE REDIRECT OK"
```

Expected: `REDIRECTS OK` (≥139 rules) and `SAMPLE REDIRECT OK`.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat(migrate): generate _redirects from old URLs"
```

---

### Task 10: Integrate with the site + full build

**Files:**
- Modify (only if needed): `src/content.config.ts` (hero optionality — see Task 8 note), the home page's featured fallback
- Verify: `astro check` + `astro build`

- [ ] **Step 1: Resolve hero-less news (decision point)**

From Task 8 Step 3's count: if **>5** news posts lack a hero, make news hero optional —

```ts
// src/content.config.ts (news schema)
heroImage: z.union([image(), z.undefined()]).optional(),
```

— and in `NewsCard.astro` + the article page, render a branded fallback block when `heroImage` is undefined. If **≤5**, instead pick a suitable image by hand for each (copy a relevant gallery jpg into the folder and set `heroImage`). Apply whichever path the count dictates.

- [ ] **Step 2: Type-check the migrated content**

```bash
npm run check
```

Expected: passes. If zod reports an invalid `sector`/`category` enum or unresolved image, fix the offending generated file (or the lib that produced it) and re-run the relevant builder.

- [ ] **Step 3: Full build + assert real page counts**

```bash
npm run build
echo "project pages: $(find dist/projects -mindepth 1 -maxdepth 1 -type d | wc -l)"   # expect 27
echo "news pages: $(find dist/news -mindepth 2 -name index.html -path '*/news/*' | grep -v '/page/' | wc -l)"  # ~112
test -f dist/_redirects && echo "REDIRECTS DEPLOYED OK"
ls dist/_astro/*.webp >/dev/null 2>&1 && echo "OPTIMIZED IMAGES OK"
```

Expected: 27 project page dirs, ~112 news article pages, `_redirects` copied into `dist`, optimized images present.

- [ ] **Step 4: Spot-check three pages in the dev server**

```bash
npm run dev &   # then open the URLs, then stop the server
```

Open `/projects/near-passivhaus-office-extension`, `/news` (pagination shows multiple pages now), and one news article. Confirm images render and the gallery is populated.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(migrate): integrate migrated content, full build passes"
```

---

### Task 11: Sector/category review report + corrections

**Files:**
- Create: `scripts/migrate/report.mjs`

**Interfaces:**
- Produces a console table: for each project — slug, assigned sector, and its first sentence — so the owner can correct misclassifications; same for news categories (distribution + any post defaulted to `Insight`).

- [ ] **Step 1: Implement the report**

```js
// scripts/migrate/report.mjs
import { readFileSync, readdirSync } from "node:fs";
const read = (d, base) => readdirSync(base).filter((s) => !s.startsWith("_")).map((slug) => {
  const md = readFileSync(`${base}/${slug}/index.md`, "utf8");
  const f = (k) => (md.match(new RegExp(`^${k}: "?(.*?)"?$`, "m")) || [])[1] || "";
  const body = md.split("---\n").slice(2).join("---\n").replace(/\s+/g, " ").trim();
  return { slug, field: f, first: body.slice(0, 120) };
});
console.log("=== PROJECTS: sector · slug · opening ===");
for (const r of read("p", "src/content/projects"))
  console.log(`${(r.field("sector")).padEnd(11)} ${r.slug.padEnd(46)} ${r.first}`);
const cats = {};
for (const r of read("n", "src/content/news")) cats[r.field("category")] = (cats[r.field("category")] || 0) + 1;
console.log("\n=== NEWS category distribution ===", cats);
```

- [ ] **Step 2: Run and review with the owner**

```bash
node scripts/migrate/report.mjs
```

Present the project list to the owner. For any correction, edit `SECTOR_BY_SLUG` in `lib/taxonomy.mjs` and re-run `node scripts/migrate/build-projects.mjs` (idempotent), or edit the single `index.md`'s `sector:` line directly for one-offs. Re-run `npm run check`.

- [ ] **Step 3: Commit corrections**

```bash
git add -A && git commit -m "chore(migrate): sector/category review corrections"
```

---

## Definition of done (Plan 2)

- 27 project entries + 112 news entries exist under `src/content/`, each with valid frontmatter and resolved imagery (hero-less items consciously handled).
- `npm run check` and `npm run build` pass; `/projects/<slug>` and `/news/<slug>` build for every item; `/news` paginates across ~13 pages.
- `public/_redirects` maps every old URL (≥139 rules) and ships in `dist`.
- All `_sample-*` seed content is gone.
- Sectors/categories reviewed by the owner.

## Hand-off to Plan 3

Plan 3 puts the site on Cloudflare Pages + the real domain (the `_redirects` are ready), then runs
**Phase B**: match `Original_Images/03 Image Library/` originals to projects and re-run image
materialization from the high-res sources for crisp, correctly-compressed imagery.
