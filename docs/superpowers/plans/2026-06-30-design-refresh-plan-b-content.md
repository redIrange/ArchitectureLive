# Design Refresh — Plan B: Content Enrichment

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Populate the two new content dimensions the redesign surfaces — client **testimonials** on project pages and editorial **news categories** — by mining the WordPress backup, presenting suggestions for owner review, then applying the confirmed values into the content frontmatter (keeping `npm run check` green).

**Architecture:** Reuses the existing migration toolchain in `scripts/migrate/` (`lib/wpress.mjs`, `lib/sql.mjs`, `lib/content.mjs`). New scripts emit **`*.suggested.json`** files for the owner to review; **apply** scripts then rewrite frontmatter from the confirmed JSON. Deterministic + re-runnable, matching the established pattern. The `news` `category` enum change is made **atomically** with the category apply so validation never breaks.

**Tech Stack:** Node ESM scripts · `scripts/migrate/lib/*` · the `.wpress` backup (`Old_Website/…`, git-ignored).

## Global Constraints

- **Owner-review gate:** every auto-generated mapping is reviewed/edited by the owner (the controller surfaces the `*.suggested.json`) BEFORE any apply step writes to content. Apply scripts read the (possibly owner-edited) JSON; they never invent values.
- **Backup is read-only + local:** `Old_Website/*.wpress` stays git-ignored; commit only the small JSON mappings + the content frontmatter changes.
- **No content rewriting** beyond `testimonial` and `category`. Do not touch bodies, images, excerpts, or other fields.
- **Green builds:** after the category apply, `npm run check` = 0 errors (every post has a valid new-enum category).
- Table prefix in the DB is `SERVMASK_PREFIX_`; projects = `post_type='page'`, `post_parent='3861'`, `post_status='publish'`; news = `post_type='post'`, `post_status='publish'`.

---

### Task 1: Testimonial extractor → `testimonials.suggested.json`

**Files:**
- Create: `scripts/migrate/extract-testimonials.mjs`
- Output (committed): `scripts/migrate/testimonials.suggested.json`

**Interfaces:**
- Produces `testimonials.suggested.json`: `{ "<project-slug>": { "quote": string, "author": "", "candidates": string[] } }` — one entry per project that has at least one client-style quote. `author` is left blank for the owner to fill.

- [ ] **Step 1: Implement the extractor**

```js
// scripts/migrate/extract-testimonials.mjs
import { writeFileSync } from "node:fs";
import { extractOne, ARCHIVE } from "./lib/wpress.mjs";
import { rowObjects } from "./lib/sql.mjs";

const sql = extractOne(ARCHIVE, "database.sql").toString("utf8");
const projects = rowObjects(sql, "SERVMASK_PREFIX_posts").filter(
  (p) => p.post_type === "page" && p.post_parent === "3861" && p.post_status === "publish",
);

const stripHtml = (s) => String(s || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
// reject credits blocks, gallery-id lists, urls, shortcode attrs, and the practice's own philosophy voice
const isNoise = (q) =>
  /^[\d,\s]+$/.test(q) ||
  /https?:|et_pb_|gallery|\bid(s)?=|architect ArchitectureLIVE|\bengineer\b|\bcontractor\b|\bclient\b\s*$/i.test(q) ||
  /\bwe (love|find|take a holistic|believe that to be the best)\b/i.test(q); // practice philosophy, not a client
// client-voice cues raise confidence
const clientCue = /\b(we chose|we think|exceeded|delighted|recommend|highly|thrilled|couldn'?t|our (home|brief|expectations)|listens? well|every (challenge|part))\b/i;

const out = {};
for (const p of projects) {
  const body = stripHtml(p.post_content);
  const quotes = [...body.matchAll(/[“"]([^“”"]{30,400})[”"]/g)]
    .map((m) => m[1].replace(/\s+/g, " ").trim())
    .filter((q) => q.length >= 30 && !isNoise(q));
  if (!quotes.length) continue;
  // best candidate: prefer a client-cue quote, else the longest
  const ranked = quotes.sort((a, b) => (clientCue.test(b) - clientCue.test(a)) || (b.length - a.length));
  out[p.post_name] = { quote: ranked[0], author: "", candidates: ranked.slice(0, 4) };
}
writeFileSync("scripts/migrate/testimonials.suggested.json", JSON.stringify(out, null, 2) + "\n");
console.log(`${Object.keys(out).length} projects with a testimonial candidate.`);
```

- [ ] **Step 2: Run it**

Run: `node scripts/migrate/extract-testimonials.mjs`
Expected: prints a count (≈9–15) and writes `testimonials.suggested.json`.

- [ ] **Step 3: Commit the suggestions**

```bash
git add scripts/migrate/extract-testimonials.mjs scripts/migrate/testimonials.suggested.json
git commit -m "feat(migrate): extract project testimonial candidates from backup"
```

---

### Task 2: Owner review of testimonial suggestions → `testimonials.json`

**Files:**
- Create (owner-confirmed): `scripts/migrate/testimonials.json`

**This task is an owner-review gate — the controller surfaces the suggestions; the owner confirms.**

- [ ] **Step 1: Build the confirmed file** — copy `testimonials.suggested.json` to `scripts/migrate/testimonials.json`, then with the owner: for each slug pick the right quote from `candidates` (or paste a better one), fill `author` (e.g. `"The owners"`, or a name), and DELETE any slug whose candidate is not actually a client testimonial. Keep only `{ quote, author }` per slug (drop `candidates`).

Final shape:

```json
{
  "1960s-bungalow-haslemere-surrey": { "quote": "ArchitectureLIVE exceeded our expectations…", "author": "The owners" }
}
```

- [ ] **Step 2: Validate it parses**

Run: `node -e "JSON.parse(require('fs').readFileSync('scripts/migrate/testimonials.json','utf8')); console.log('ok')"`
Expected: `ok`.

- [ ] **Step 3: Commit**

```bash
git add scripts/migrate/testimonials.json
git commit -m "chore(content): confirmed project testimonials"
```

---

### Task 3: Apply testimonials to project frontmatter

**Files:**
- Create: `scripts/migrate/apply-testimonials.mjs`
- Modify: `src/content/projects/<slug>/index.md` (frontmatter only, for confirmed slugs)

**Interfaces:**
- Consumes: `testimonials.json` `{ slug: { quote, author? } }` + Plan A's `testimonial` schema field.

- [ ] **Step 1: Implement the apply script**

```js
// scripts/migrate/apply-testimonials.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const map = JSON.parse(readFileSync("scripts/migrate/testimonials.json", "utf8"));
const esc = (s) => String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
let n = 0;
for (const [slug, t] of Object.entries(map)) {
  const file = `src/content/projects/${slug}/index.md`;
  if (!existsSync(file)) { console.warn(`! no project ${slug}`); continue; }
  let md = readFileSync(file, "utf8");
  if (/^testimonial:/m.test(md)) { console.warn(`~ ${slug} already has a testimonial, skipping`); continue; }
  const block =
    `testimonial:\n  quote: "${esc(t.quote)}"` + (t.author ? `\n  author: "${esc(t.author)}"` : "");
  // insert before the closing front-matter fence (the 2nd '---')
  md = md.replace(/\n---\n/, `\n${block}\n---\n`);
  writeFileSync(file, md);
  n++;
  console.log(`✓ ${slug}`);
}
console.log(`\nApplied ${n} testimonials. Run: npm run check`);
```

- [ ] **Step 2: Run + validate**

Run: `node scripts/migrate/apply-testimonials.mjs && npm run check`
Expected: prints `✓` per slug; `npm run check` = `0 errors, 0 warnings`.

- [ ] **Step 3: Commit**

```bash
git add scripts/migrate/apply-testimonials.mjs src/content/projects
git commit -m "feat(content): add client testimonials to project frontmatter"
```

---

### Task 4: News classifier → `news-categories.suggested.json`

**Files:**
- Create: `scripts/migrate/classify-news.mjs`
- Output (committed): `scripts/migrate/news-categories.suggested.json`

**Interfaces:**
- Produces `{ "<news-slug>": { "category": "Awards|Press|Insight|Studio|Projects", "scores": {…} } }` for all 112 posts.

- [ ] **Step 1: Implement the classifier**

```js
// scripts/migrate/classify-news.mjs
import { writeFileSync } from "node:fs";
import { extractOne, ARCHIVE } from "./lib/wpress.mjs";
import { rowObjects } from "./lib/sql.mjs";

const sql = extractOne(ARCHIVE, "database.sql").toString("utf8");
const posts = rowObjects(sql, "SERVMASK_PREFIX_posts").filter(
  (p) => p.post_type === "post" && p.post_status === "publish",
);
const slugify = (s) => String(s || "").toLowerCase();

// keyword → category signals (checked against title + body)
const RULES = [
  ["Awards", /\baward|waverley|shortlist|winner|won\b|commended|finalist|riba\b/i],
  ["Press", /\bfeatured|magazine|press|grand designs|channel 4|houzz|25 beautiful homes|tv\b|published|interview/i],
  ["Studio", /\bwe('| a)re (hiring|recruiting)|welcome|joins|anniversary|our (team|studio|office)|new member|christmas|year in review/i],
  ["Insight", /\bwhy |how to|guide|explained|what is|passivhaus\?|tips|considering|thinking about|sustainab/i],
  ["Projects", /\bcompleted|completion|planning (granted|approved|permission)|on site|construction|underway|breaking ground|topping out|handover/i],
];

const out = {};
for (const p of posts) {
  const hay = `${p.post_title} ${p.post_content}`;
  const scores = {};
  let best = "Projects", bestScore = 0; // default Projects (most news is project-related)
  for (const [cat, re] of RULES) {
    const c = (hay.match(re) || []).length;
    scores[cat] = c;
    if (c > bestScore) { bestScore = c; best = cat; }
  }
  out[p.post_name] = { category: best, scores };
}
writeFileSync("scripts/migrate/news-categories.suggested.json", JSON.stringify(out, null, 2) + "\n");
const tally = Object.values(out).reduce((m, x) => ((m[x.category] = (m[x.category] || 0) + 1), m), {});
console.log(`classified ${Object.keys(out).length} posts:`, tally);
```

- [ ] **Step 2: Run it**

Run: `node scripts/migrate/classify-news.mjs`
Expected: prints a per-category tally and writes the suggested JSON.

- [ ] **Step 3: Commit**

```bash
git add scripts/migrate/classify-news.mjs scripts/migrate/news-categories.suggested.json
git commit -m "feat(migrate): classify news posts into editorial categories"
```

---

### Task 5: Owner review of news categories → `news-categories.json`

**Files:**
- Create (owner-confirmed): `scripts/migrate/news-categories.json`

**Owner-review gate.** The controller surfaces the suggestions (and the tally); the owner corrects misfires.

- [ ] **Step 1: Build the confirmed file** — copy `news-categories.suggested.json` to `news-categories.json`, reduce each entry to a bare string `{ "<slug>": "Press" }`, and with the owner fix any obviously-wrong category (spot-check the `Projects` default bucket especially). Every one of the 112 slugs must be present with one of `Awards|Press|Insight|Studio|Projects`.

- [ ] **Step 2: Validate completeness**

Run:
```bash
node -e "const m=require('./scripts/migrate/news-categories.json');const fs=require('fs');const n=fs.readdirSync('src/content/news').filter(s=>!s.startsWith('_'));const miss=n.filter(s=>!m[s]);console.log('missing',miss.length,miss.slice(0,5))"
```
Expected: `missing 0 []`.

- [ ] **Step 3: Commit**

```bash
git add scripts/migrate/news-categories.json
git commit -m "chore(content): confirmed news categories"
```

---

### Task 6: Change the `news` enum + apply categories (atomic)

**Files:**
- Modify: `src/content.config.ts` (news `category` enum)
- Create: `scripts/migrate/apply-news-categories.mjs`
- Modify: `src/content/news/<slug>/index.md` (frontmatter `category`, all 112)

**Interfaces:**
- Consumes: `news-categories.json`. Produces every post with a category in the new enum.

> **Do BOTH the enum change and the data apply before running `npm run check`** — they must land together or validation fails.

- [ ] **Step 1: Update the news enum** in `src/content.config.ts`:

```ts
const CATEGORIES = ["Awards", "Press", "Insight", "Studio", "Projects"] as const;
```
and set the news `category` default to `"Projects"`:
```ts
      category: z.enum(CATEGORIES).default("Projects"),
```

- [ ] **Step 2: Implement the apply script**

```js
// scripts/migrate/apply-news-categories.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";
const map = JSON.parse(readFileSync("scripts/migrate/news-categories.json", "utf8"));
let n = 0;
for (const [slug, cat] of Object.entries(map)) {
  const file = `src/content/news/${slug}/index.md`;
  if (!existsSync(file)) { console.warn(`! no news ${slug}`); continue; }
  let md = readFileSync(file, "utf8");
  if (/^category:/m.test(md)) md = md.replace(/^category:.*$/m, `category: "${cat}"`);
  else md = md.replace(/^(date:.*)$/m, `$1\ncategory: "${cat}"`);
  writeFileSync(file, md);
  n++;
}
console.log(`Set category on ${n} posts. Run: npm run check`);
```

- [ ] **Step 3: Run the apply, then validate together**

Run: `node scripts/migrate/apply-news-categories.mjs && npm run check && npm run build`
Expected: `Set category on 112 posts`; `npm run check` = 0 errors; build succeeds (157 pages).

- [ ] **Step 4: Commit**

```bash
git add src/content.config.ts scripts/migrate/apply-news-categories.mjs src/content/news
git commit -m "feat(content): editorial news categories (enum + 112 posts)"
```

---

## Definition of done (Plan B)

- `testimonials.json` confirmed; `apply-testimonials.mjs` has written `testimonial` into the relevant projects.
- `news-categories.json` confirmed for all 112 posts; news enum is now `Awards/Press/Insight/Studio/Projects`; every post carries a valid category.
- `npm run check` = 0/0/0; `npm run build` = 157 pages.
- All mapping JSON + scripts committed; the backup remains git-ignored.

## Self-review notes (carried to Plan C)

- Plan C's News index + category pages read `post.data.category` from the new enum; the project detail reads `project.data.testimonial`.
- Re-running any extractor/classifier is safe (deterministic); apply scripts are idempotent (skip already-set testimonials; overwrite category).
