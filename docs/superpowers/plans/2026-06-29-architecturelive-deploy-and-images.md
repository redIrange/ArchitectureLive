# ArchitectureLIVE Deploy + Original-Image Upgrade — Implementation Plan (Plan 3 of 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put the finished site live on **Cloudflare Pages** at `architecturelive.co.uk` (git-push deploys, redirects active, verified before cutover); then run **Phase B** — replace the backup's ShortPixel-compressed images with the high-res files from `Original_Images/` and let `astro:assets` recompress them properly; and leave the owner a one-command workflow for adding future projects/news.

**Architecture:** Cloudflare Pages with Git integration (push to `main` → build `astro build` → deploy `dist/`). DNS managed in Cloudflare. Phase B reuses Plan 2's sharp normalize pipeline but sources from local originals chosen via a human-edited mapping file. A `new-post` scaffolder makes ongoing authoring a single command.

**Tech Stack:** Cloudflare Pages · GitHub + `gh` CLI · Wrangler (optional) · the Plan 1/2 Astro project · `sharp`.

## Global Constraints

- **The domain currently serves the live WordPress site.** Do not cut DNS over until the new site is verified on its `*.pages.dev` URL. Zero-downtime: deploy → verify → switch DNS.
- **Build settings:** build command `npm run build`, output dir `dist`, Node `20` (`.nvmrc`), framework preset “Astro”.
- **`Original_Images/` and `Old_Website/` stay git-ignored** — Phase B reads originals locally and commits only the optimized derivatives under `src/content/`.
- **Phase B is curation:** `Original_Images/03 Image Library/` is a general studio library keyed by project *codenames* (e.g. “Stonehurst”, “Tall Trees”, “St Barts”), not the site's public titles — matching requires the owner's knowledge. The tooling suggests; the owner confirms.
- **Reuse the Plan 2 normalize settings** (auto-rotate, strip metadata, cap 2400 px, JPEG q82) so Phase A and Phase B output is consistent.
- **Commit after every task.** Push only when a task says to.

---

### Task 1: GitHub repository

**Files:** none (remote setup)

- [ ] **Step 1: Confirm a clean tree and the ignores hold**

```bash
git status
git check-ignore Old_Website Original_Images node_modules dist && echo "IGNORES OK"
```

Expected: working tree clean (from Plans 1–2), `IGNORES OK` (the big folders are ignored).

- [ ] **Step 2: Create the GitHub repo and push**

```bash
gh repo create architecturelive --private --source=. --remote=origin --push
```

Expected: repo created; `main` pushed. Confirm: `gh repo view --json url -q .url`.

> If `gh` isn't authenticated, the owner runs `! gh auth login` in the session first.

- [ ] **Step 3: Verify the large sources did NOT upload**

```bash
gh api repos/:owner/architecturelive --jq '.size'   # KB; should be small (no 4GB/1.4GB blobs)
```

Expected: a small repo size (single-digit MB). If large, the ignores failed — fix `.gitignore`, `git rm -r --cached`, recommit.

- [ ] **Step 4: Commit (no-op if clean)** — nothing to commit; proceed.

---

### Task 2: Cloudflare Pages project (preview deploy)

**Files:** none (dashboard/CLI)

- [ ] **Step 1: Create the Pages project via Git integration**

In the Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git** → select the `architecturelive` repo. Set:
- Production branch: `main`
- Framework preset: **Astro**
- Build command: `npm run build`
- Build output directory: `dist`
- Environment variable: `NODE_VERSION = 20`

Save and deploy.

> CLI alternative (if the owner prefers): `npx wrangler pages project create architecturelive --production-branch main`, then connect Git in the dashboard, or use `npx wrangler pages deploy dist` for a direct upload after a local `npm run build`.

- [ ] **Step 2: Wait for the first build, capture the preview URL**

The build log should show `npm install` → `astro build` → “X page(s) built”. Note the `https://architecturelive.pages.dev` (or `https://<hash>.architecturelive.pages.dev`) URL.

- [ ] **Step 3: Verify the deployed site responds**

```bash
curl -sI https://architecturelive.pages.dev/ | head -1                       # 200
curl -s https://architecturelive.pages.dev/projects/ | grep -qi "projects" && echo "PROJECTS LIVE"
curl -sI https://architecturelive.pages.dev/some-old-slug 2>/dev/null | head  # see Task 4 for real redirect check
```

Expected: `200`, `PROJECTS LIVE`.

---

### Task 3: Pre-cutover verification

**Files:** Create `scripts/check/links.mjs` (optional internal-link checker)

- [ ] **Step 1: Lighthouse on the preview URL**

```bash
npx -y lighthouse https://architecturelive.pages.dev/ --only-categories=performance,seo,accessibility --quiet --chrome-flags="--headless" --output=json --output-path=/tmp/lh-home.json
node -e "const r=require('/tmp/lh-home.json');console.log('perf',r.categories.performance.score,'seo',r.categories.seo.score,'a11y',r.categories.accessibility.score)"
```

Expected: performance ≈ 0.95–1.0, SEO ≈ 1.0, accessibility ≥ 0.95. Investigate any category < 0.9. Repeat for a project detail URL (image-heavy worst case).

- [ ] **Step 2: Verify redirects work on the live host** (Cloudflare applies `_redirects`)

```bash
curl -sI https://architecturelive.pages.dev/near-passivhaus-office-extension | grep -iE "^(HTTP|location)"
```

Expected: `301` with `location: /projects/near-passivhaus-office-extension`. Spot-check one old news slug too.

- [ ] **Step 3: Crawl internal links for 404s** (optional but recommended)

```js
// scripts/check/links.mjs — fetch sitemap, HEAD every URL, report non-200
const base = process.argv[2] || "https://architecturelive.pages.dev";
const sm = await (await fetch(`${base}/sitemap-0.xml`)).text();
const urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
let bad = 0;
for (const u of urls) { const r = await fetch(u, { method: "HEAD" }); if (!r.ok) { bad++; console.log(r.status, u); } }
console.log(`checked ${urls.length}, bad ${bad}`);
```

```bash
node scripts/check/links.mjs https://architecturelive.pages.dev
```

Expected: `bad 0` across all sitemap URLs.

- [ ] **Step 4: Commit the checker**

```bash
git add -A && git commit -m "chore(deploy): internal link checker" && git push
```

---

### Task 4: Domain cutover

**Files:** none (DNS)

- [ ] **Step 1: Ensure the domain is in Cloudflare**

If `architecturelive.co.uk` isn't already a Cloudflare zone, add it (Cloudflare dashboard → Add site) and update the registrar's nameservers to Cloudflare's. Wait for activation. (If it's already on Cloudflare for the WP site, skip.)

- [ ] **Step 2: Add the custom domain to the Pages project**

Pages project → **Custom domains → Set up a custom domain** → `architecturelive.co.uk` and `www.architecturelive.co.uk`. Cloudflare creates the CNAME records automatically. This is the cutover — the apex now serves the new site.

- [ ] **Step 3: Verify production**

```bash
curl -sI https://architecturelive.co.uk/ | head -1                            # 200
curl -sI https://architecturelive.co.uk/near-passivhaus-office-extension | grep -i location   # 301 → /projects/...
curl -s https://architecturelive.co.uk/rss.xml | grep -q "ArchitectureLIVE" && echo "RSS OK"
```

Expected: `200`, the 301 redirect, `RSS OK`, and a valid TLS cert (Cloudflare auto-provisions).

- [ ] **Step 4: Redirect `www` → apex (or vice-versa)** via a Cloudflare Redirect Rule, and confirm both resolve to one canonical host.

> **Milestone: the new site is live on the real domain.** Phase B (below) is an image-quality
> upgrade that can proceed at any pace without affecting availability — each rebuild just improves photos.

---

### Task 5 (Phase B): Map originals to projects

**Files:** Create `scripts/originals/suggest.mjs`, `scripts/originals/mapping.json`

**Interfaces:**
- `suggest.mjs` scans `Original_Images/03 Image Library/` and, for each project slug, prints candidate
  source folders ranked by keyword overlap with the title — a starting point for the owner to edit
  `mapping.json` (`{ "<slug>": { "dir": "<relative dir under the library>", "hero": "<filename>" } }`).

- [ ] **Step 1: Implement the suggester**

```js
// scripts/originals/suggest.mjs
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { readFileSync } from "node:fs";

const LIB = "Original_Images/03 Image Library";
function walkDirs(base, depth = 2, prefix = "") {
  const out = [];
  for (const e of readdirSync(base)) {
    const p = join(base, e);
    if (e.startsWith(".") || e.startsWith("~$")) continue;
    try { if (statSync(p).isDirectory()) { out.push(prefix + e); if (depth > 1) out.push(...walkDirs(p, depth - 1, prefix + e + "/")); } } catch {}
  }
  return out;
}
const dirs = walkDirs(LIB);
const slugs = readdirSync("src/content/projects").filter((s) => !s.startsWith("_"));
const words = (s) => s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3);
for (const slug of slugs) {
  const title = (readFileSync(`src/content/projects/${slug}/index.md`, "utf8").match(/^title: "(.*)"/m) || [])[1] || slug;
  const tw = new Set(words(title));
  const ranked = dirs.map((d) => ({ d, score: words(d).filter((w) => tw.has(w)).length }))
    .filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);
  console.log(`${slug}\n   title: ${title}\n   candidates: ${ranked.map((r) => `${r.d}(${r.score})`).join("  ") || "— none, owner picks —"}`);
}
```

- [ ] **Step 2: Run and build the mapping with the owner**

```bash
node scripts/originals/suggest.mjs
```

The codenames (Stonehurst, Tall Trees, St Barts, …) rarely match the public titles, so go through the
list **with the owner** and write `scripts/originals/mapping.json`, e.g.:

```json
{
  "near-passivhaus-office-extension": { "dir": "13 AL projects/Tall Trees", "hero": "front.jpg" },
  "6th-form-centre-newbury-west-berkshire": { "dir": "01 RIBA Project Images/St Barts 6th Form" }
}
```

Only include projects whose originals exist in the library. Omitted projects keep their Phase-A images.

- [ ] **Step 3: Commit the mapping (small JSON, safe to track)**

```bash
git add scripts/originals && git commit -m "chore(images): originals→project mapping"
```

---

### Task 6 (Phase B): Re-materialize project images from originals

**Files:** Create `scripts/originals/apply.mjs`

**Interfaces:**
- Reads `mapping.json`; for each mapped project, normalizes the chosen originals with the Plan 2 settings
  into the project folder (replacing `hero-*.jpg`/`g*.jpg`), and rewrites the `heroImage`/`gallery`
  frontmatter to the new files. Idempotent per project.

- [ ] **Step 1: Implement**

```js
// scripts/originals/apply.mjs
import { readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const LIB = "Original_Images/03 Image Library";
const map = JSON.parse(readFileSync("scripts/originals/mapping.json", "utf8"));
const isImg = (f) => /\.(jpe?g|png|tiff?|webp)$/i.test(f);

for (const [slug, cfg] of Object.entries(map)) {
  const srcDir = join(LIB, cfg.dir);
  const files = readdirSync(srcDir).filter(isImg).sort();
  if (!files.length) { console.warn(`! ${slug}: no images in ${cfg.dir}`); continue; }
  const ordered = cfg.hero ? [cfg.hero, ...files.filter((f) => f !== cfg.hero)] : files;
  const dir = `src/content/projects/${slug}`;
  for (const f of readdirSync(dir)) if (/^(hero-|g)\d*.*\.jpg$/.test(f) || /^hero-/.test(f)) rmSync(join(dir, f));
  const names = [];
  let n = 0;
  for (const f of ordered) {
    const name = n === 0 ? "hero-01.jpg" : `g${String(n).padStart(2, "0")}.jpg`;
    await sharp(join(srcDir, f)).rotate().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true }).toFile(join(dir, name));
    names.push(name); n++;
  }
  let md = readFileSync(`${dir}/index.md`, "utf8");
  md = md.replace(/^heroImage:.*$/m, `heroImage: "./${names[0]}"`)
         .replace(/^gallery:.*$/m, `gallery: [${names.slice(1).map((x) => `"./${x}"`).join(", ")}]`);
  writeFileSync(`${dir}/index.md`, md);
  console.log(`✓ ${slug}: ${names.length} originals (${cfg.dir})`);
}
```

- [ ] **Step 2: Run, type-check, build**

```bash
node scripts/originals/apply.mjs
npm run check && npm run build
ls dist/_astro/*.avif >/dev/null 2>&1 || ls dist/_astro/*.webp >/dev/null 2>&1 && echo "RECOMPRESSED OK"
```

Expected: each mapped project reports its original count; build passes; modern-format derivatives present.

- [ ] **Step 3: Visual check + commit + deploy**

Open a couple of upgraded projects in `npm run dev`; confirm the imagery is visibly crisper. Then:

```bash
git add src/content/projects && git commit -m "feat(images): swap in high-res originals (phase B)"
git push   # Cloudflare auto-builds & deploys
```

> Re-run Tasks 5–6 incrementally as the owner sources more originals — each pass only improves photos.

---

### Task 7: Owner workflow — one-command new post + CLAUDE.md

**Files:** Create `scripts/new-post.mjs`, `CLAUDE.md`

**Interfaces:**
- `node scripts/new-post.mjs <project|news> "<Title>" <image-folder>` → slugifies the title, creates the
  content folder, normalizes the images (same sharp settings) as `hero-01.jpg` + `gNN.jpg`, and writes a
  frontmatter skeleton ready to edit. This is how the owner adds content a couple of times a month.

- [ ] **Step 1: Implement the scaffolder**

```js
// scripts/new-post.mjs
import { readdirSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const [type, title, imgDir] = process.argv.slice(2);
if (!["project", "news"].includes(type) || !title) {
  console.error('usage: node scripts/new-post.mjs <project|news> "<Title>" [image-folder]'); process.exit(1);
}
const slug = title.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const dir = `src/content/${type === "project" ? "projects" : "news"}/${slug}`;
mkdirSync(dir, { recursive: true });
const names = [];
if (imgDir) {
  const files = readdirSync(imgDir).filter((f) => /\.(jpe?g|png|tiff?|webp)$/i.test(f)).sort();
  let n = 0;
  for (const f of files) {
    const name = n === 0 ? "hero-01.jpg" : `g${String(n).padStart(2, "0")}.jpg`;
    await sharp(join(imgDir, f)).rotate().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true }).toFile(join(dir, name));
    names.push(name); n++;
  }
}
const today = new Date().toISOString().slice(0, 10);     // run-time only; fine for a CLI scaffolder
const fm = type === "project"
  ? `---\ntitle: "${title}"\nsector: "Extensions"\nlocation: ""\nstatus: "Completed"\nyear: ${today.slice(0,4)}\nfeatures: []\nheroImage: "./${names[0] || "hero-01.jpg"}"\ngallery: [${names.slice(1).map((x)=>`"./${x}"`).join(", ")}]\nexcerpt: ""\nfeatured: false\ndraft: true\n---\n\nWrite the project narrative here.\n`
  : `---\ntitle: "${title}"\ndate: ${today}\ncategory: "Insight"\nheroImage: "./${names[0] || "hero-01.jpg"}"\nexcerpt: ""\ndraft: true\n---\n\nWrite the article here.\n`;
writeFileSync(`${dir}/index.md`, fm);
console.log(`Created ${dir}/index.md (draft) with ${names.length} image(s). Edit it, set draft:false, then push.`);
```

- [ ] **Step 2: Smoke-test it**

```bash
node scripts/new-post.mjs news "Test Post Please Ignore"
test -f "src/content/news/test-post-please-ignore/index.md" && echo "SCAFFOLD OK"
rm -rf src/content/news/test-post-please-ignore
```

Expected: `SCAFFOLD OK` (then removed).

- [ ] **Step 3: Write `CLAUDE.md`** (repo guide — the source of truth for future sessions)

Document, concisely: the stack (Astro + Cloudflare Pages, static, no form); how to add a project/news
(`node scripts/new-post.mjs …`, or ask Claude Code to do it, then `git push` to deploy); the content
schema; where the migration tooling lives and that `Old_Website/`+`Original_Images/` are local-only; the
Phase-B originals workflow; and the real contact details. Keep it short and operational.

- [ ] **Step 4: Commit + push**

```bash
git add -A && git commit -m "feat: new-post scaffolder + CLAUDE.md authoring guide" && git push
```

---

## Definition of done (Plan 3)

- Site live at `https://architecturelive.co.uk` via Cloudflare Pages; `git push` to `main` auto-deploys.
- Old URLs 301-redirect; Lighthouse performance ≈ 100; sitemap/RSS reachable; TLS valid; `www`/apex canonicalised.
- Phase B applied to every project with available originals; imagery visibly crisp; `mapping.json` records what was sourced.
- The owner can add a project/news with one command (or via Claude Code) and deploy by pushing.
- `CLAUDE.md` documents the whole operation.

## Project complete

With Plans 1–3 done, ArchitectureLIVE is a fast, static, near-zero-maintenance site: design ported
faithfully from Claude Design, all real content migrated, originals upgrading image quality over time,
and a trivial push-to-deploy authoring loop.
