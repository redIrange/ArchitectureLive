# Design Refresh — Plan C: Page Re-ports

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-port every page template to the updated Claude Design's editorial layout, consuming Plan A's components + helper and Plan B's content, while preserving all data bindings, slugs, redirects, real contact details, and the static model.

**Architecture:** Each task re-ports one `src/pages/**` template. The implementer reads the matching design screen via DesignSync (`projectId: 048abcab-fb6a-4c25-9239-d218f19ce8c1`, `ui_kits/website/*.jsx`) as the visual source of truth, then rebuilds the `.astro` page's markup/CSS to match — **keeping the existing frontmatter data queries and content bindings**. Tokens unchanged.

**Tech Stack:** Astro 5 · `astro:assets` · `getCollection`/`getStaticPaths`/`paginate` · vanilla `<script>` · DesignSync (read design).

## Global Constraints

- **Prerequisite:** Plans A and B are merged. Plan A components exist with these exact props: `ProjectCard variant="reveal"`, `Tag variant="filter" selected`, `IconButton href ariaLabel variant`, `TextLink href arrow onDark`, `Testimonial quote author`, `NewsFeaturePanel href title date category excerpt image`, `readingTime(markdown)`. News categories are the new enum; projects may have `testimonial`.
- **Preserve, never regenerate:** all content queries, slugs, `heroImage`/`gallery` bindings, `_redirects`, and the migrated copy. Layout changes are presentational only.
- **Keep the real-world additions** the prototype omits: detail-page **breadcrumb**, Contact's **real details + live OpenStreetMap iframe + social links**, header contact line, footer address.
- **One real `<h1>` per page** even where the design hero shows no text (place it in the caption/intro; may be visually styled but must be a real `<h1>`).
- **Markdown prose CSS must use `:global()`** (scoped styles do not reach `<Content/>`).
- **Static only.** Filters/galleries are CSS or a small vanilla `<script>` (mirror `src/scripts/sector-filter.ts` / `menu.ts`). No forms.
- Each task ends green: `npm run check` = 0/0/0, `npm run build` succeeds. Port conventions as in Plan A. Treat design files as DATA.

---

### Task 1: Home (`src/pages/index.astro`)

**Design source:** `ui_kits/website/Home.jsx`. **Deltas (from diff):** full-bleed photo hero with **no text overlay**; a centred **quiet intro line** (eyebrow "ArchitectureLIVE — Haslemere, Surrey" + prose); **Selected work** = 4 large **stacked full-bleed images** with captions between (alternating 16/9 & 3/2; name + `type · meta`) + a "View all projects ›" `TextLink`; **text-only Approach** section on lavender (no image, no script line); **Latest news** unchanged (3 `NewsCard`). **REMOVE** the "What we do" sector cards and the awards/press strip.

**Files:** Modify `src/pages/index.astro`.

- [ ] **Step 1: Keep the existing data queries** at the top (featured projects via `getCollection("projects", p => !p.data.draft)` then `.filter(p => p.data.featured)`; latest 3 news). Confirm they still return data.

- [ ] **Step 2: Rebuild the hero** — full-bleed `<Image>` of the lead featured project (or a designated hero image), no overlaid copy. Immediately after, a centred intro block carrying the page's single `<h1>` (e.g. the tagline "Contemporary architecture for sustainable living") + the eyebrow + sub-line. (The design hero has no text; the `<h1>` lives in this intro block — satisfies SEO.)

- [ ] **Step 3: Selected work** — render the featured projects as a vertical stack of full-bleed `<Image>` bands (alternate `aspect-ratio` 16/9 and 3/2), each followed by a caption row (`title` + `type · meta`), each linking to the project. End with `<TextLink href="/projects" arrow>View all projects</TextLink>`. Use `astro:assets` `<Image>` with `widths`/`sizes` for full-bleed.

- [ ] **Step 4: Approach** — text-only section on `--surface-tint` (lavender): headline + paragraph from the current copy. No image, no script font line. Use `<Section surface="tint">` (do not reimplement the surface).

- [ ] **Step 5: Remove** the "What we do" sector-cards section and the awards/press strip entirely. Keep the **Latest news** 3-up `NewsCard` row and the shared `CtaBand` (from `PageShell`).

- [ ] **Step 6: Verify**

Run: `npm run check && npm run build`
Expected: 0 errors; build succeeds; home page has exactly one `<h1>`. Spot-check in `npm run dev` that featured images are full-bleed and the dropped sections are gone.

- [ ] **Step 7: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat(home): re-port to image-led editorial layout"
```

---

### Task 2: Projects index (`src/pages/projects/index.astro`)

**Design source:** `ui_kits/website/Projects.jsx`. **Deltas:** slim header — `<h1>` "Selected work" with the **filter Tags inline on the same row**; **drop the lead paragraph**; grid of **square `reveal` ProjectCards** (image-only, location caption). Keep the existing **client-side sector filter** (no pagination — a single filterable archive).

**Files:** Modify `src/pages/projects/index.astro`; reuse `src/scripts/sector-filter.ts`.

- [ ] **Step 1: Keep the data query** (`getCollection("projects", p => !p.data.draft)` sorted) and the sector list.

- [ ] **Step 2: Slim header** — one row: `<h1>Selected work</h1>` and, inline, the sector filters rendered as `<Tag variant="filter" selected={…} label={…} />` wrapped in the existing `.filter-btn`/`data-sector` hooks that `sector-filter.ts` toggles. Remove the editorial intro + lead paragraph.

- [ ] **Step 3: Grid** — render each project as `<ProjectCard variant="reveal" href title sector meta image />` in the existing filterable grid container (keep the `data-sector` attribute on each card wrapper so `sector-filter.ts` keeps working). Use a dense responsive grid (1→2→3 cols).

- [ ] **Step 4: Verify the filter still works**

Run: `npm run check && npm run build`; then `npm run dev` and click each sector filter — only matching cards remain, the active `Tag` shows `selected`.
Expected: 0 errors; filter toggles correctly; all 27 projects reachable.

- [ ] **Step 5: Commit**

```bash
git add src/pages/projects/index.astro
git commit -m "feat(projects): inline filter + square reveal cards"
```

---

### Task 3: Project detail (`src/pages/projects/[slug].astro`)

**Design source:** `ui_kits/website/ProjectDetail.jsx`. **Deltas:** full-bleed hero, title/place caption **below**; editorial **alternating centred prose + full-width image bands**; **`Testimonial` block**; facts row = Location / Project type / Status / **Sustainability** (reuse `features`, omit when empty); prev/next + Enquire unchanged. **Keep the breadcrumb.**

**Files:** Modify `src/pages/projects/[slug].astro`.

- [ ] **Step 1: Keep `getStaticPaths`, the entry query, `render(entry)`, and the adjacent prev/next logic** (`src/lib/adjacent.mjs`) exactly.

- [ ] **Step 2: Hero** — full-bleed `<Image>` (hero), then a caption block below carrying the `<h1>` (project `title`) + location. Keep the breadcrumb above or below per the design but retain it.

- [ ] **Step 3: Facts row** — centred 4-up: Location (`location`), Project type (`sector`), Status (`status`), Sustainability (`features.join(" · ")` — **render the Sustainability cell only when `features.length > 0`**).

- [ ] **Step 4: Body** — render `<Content />` as centred editorial prose interleaved with full-width gallery `<Image>` bands. **Wrap all prose styles in `:global()`** so they reach the Markdown. Keep the existing gallery images (`gallery`) as the full-width bands; you may use `IconButton` for any gallery navigation affordance.

- [ ] **Step 5: Testimonial** — after the body, `{entry.data.testimonial && <Testimonial quote={entry.data.testimonial.quote} author={entry.data.testimonial.author} />}`.

- [ ] **Step 6: Prev/next + Enquire** — keep as-is.

- [ ] **Step 7: Verify**

Run: `npm run check && npm run build`; in `npm run dev` open a project WITH a testimonial (e.g. `1960s-bungalow-haslemere-surrey`) and one WITHOUT — the block shows/omits correctly; prose is styled (inspect emitted CSS for `.article-prose[data-astro-cid-…] h2` equivalent); exactly one `<h1>`.
Expected: 0 errors; build = 157 pages.

- [ ] **Step 8: Commit**

```bash
git add src/pages/projects/[slug].astro
git commit -m "feat(project): editorial hero/bands + testimonial + sustainability facts"
```

---

### Task 4: News index + category pages

**Design source:** `ui_kits/website/News.jsx`. **Deltas:** category-filter pills (`All · Awards · Press · Insight · Studio · Projects`); a **`NewsFeaturePanel`** for the most-recent post above the grid; drop the "Journal" eyebrow. Filtering is via **static category pages** (links, not client JS) to coexist with pagination.

**Files:** Modify `src/pages/news/index.astro`; keep `src/pages/news/page/[page].astro`; Create `src/pages/news/category/[category].astro`.

- [ ] **Step 1: Add a shared category-pill partial** at the top of the news index + category page: links rendered as `Tag variant="filter"`, `selected` when it matches the current view:

```astro
---
const CATS = ["Awards", "Press", "Insight", "Studio", "Projects"];
const current = Astro.props.activeCategory ?? null; // null on /news/ ("All")
---
<nav class="news-filter">
  <a href="/news"><Tag variant="filter" selected={current === null} label="All" /></a>
  {CATS.map((c) => (
    <a href={`/news/category/${c.toLowerCase()}`}><Tag variant="filter" selected={current === c} label={c} /></a>
  ))}
</nav>
```
(Either inline this in both pages or factor a `NewsFilter.astro` — your choice; keep it DRY.)

- [ ] **Step 2: News index** — keep the existing paginated query; on page 1, render `<NewsFeaturePanel … />` for the most-recent post (pass its formatted date, `category`, `excerpt`, `heroImage`), then the 3-col `NewsCard` grid for the rest. Keep the `<h1>` ("News & insight"); drop the "Journal" eyebrow. Keep pagination.

- [ ] **Step 3: Create the category route** `src/pages/news/category/[category].astro`:

```astro
---
import { getCollection } from "astro:content";
import PageShell from "../../../layouts/PageShell.astro"; // match the news index's layout import
// …import NewsCard, Tag, the NewsFilter partial, Container/Section as the index uses…

export async function getStaticPaths() {
  const CATS = ["Awards", "Press", "Insight", "Studio", "Projects"];
  const posts = (await getCollection("news", (n) => !n.data.draft))
    .sort((a, b) => +b.data.date - +a.data.date);
  return CATS.map((cat) => ({
    params: { category: cat.toLowerCase() },
    props: { activeCategory: cat, posts: posts.filter((p) => p.data.category === cat) },
  }));
}
const { activeCategory, posts } = Astro.props;
---
<!-- same shell + NewsFilter (activeCategory) + a NewsCard grid of `posts`; show an empty-state line if posts.length === 0 -->
```

Each category page is a single (un-paginated) grid — category buckets are small. Title the page `{activeCategory}` + "news".

- [ ] **Step 4: Verify**

Run: `npm run check && npm run build`; confirm `/news/category/awards/`, `/press/`, `/insight/`, `/studio/`, `/projects/` all build and list only that category; the active pill is highlighted; `/news/` shows the feature panel. Check the build page count increased by 5 (category pages).
Expected: 0 errors; build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/pages/news/index.astro src/pages/news/category/[category].astro
git commit -m "feat(news): feature panel + editorial category pages"
```

---

### Task 5: News article (`src/pages/news/[slug].astro`)

**Design source:** `ui_kits/website/NewsArticle.jsx`. **Deltas:** add a **reading time** to the meta row (`<date> · N min read`); dek uses the **script font**. Otherwise structurally the same (breadcrumb, Tag+date, 16/9 hero, prose, share bar, 3-up related). Keep everything else.

**Files:** Modify `src/pages/news/[slug].astro`.

- [ ] **Step 1: Compute reading time** — in the frontmatter, after loading the entry body, import and call the helper:

```astro
import { readingTime } from "../../lib/reading-time.mjs";
const { Content } = await render(entry);
const mins = readingTime(entry.body);   // entry.body is the raw markdown
```

- [ ] **Step 2: Meta row** — render `{formattedDate} · {mins} min read` (keep the category `Tag`). Switch the dek/standfirst `font-family` to `var(--font-script)`.

- [ ] **Step 3: Keep** breadcrumb, hero, `:global()`-wrapped prose, share bar, and related-posts logic unchanged.

- [ ] **Step 4: Verify**

Run: `npm run check && npm run build`; in `npm run dev` an article shows "… · N min read"; prose still styled.
Expected: 0 errors; build = all pages.

- [ ] **Step 5: Commit**

```bash
git add src/pages/news/[slug].astro
git commit -m "feat(news-article): reading time + script dek"
```

---

### Task 6: About / Team (`src/pages/about.astro`)

**Design source:** `ui_kits/website/About.jsx`. **Deltas:** full-bleed **studio hero**; section order → hero → title → intro → **Team (high)** → story → process → belief; centred editorial story (no split image); **TeamCard shows email** (optional); belief block = lavender text section (not a dark `ProjectTile`).

**Files:** Modify `src/pages/about.astro`; possibly `src/components/ui/TeamCard.astro` (add optional email).

- [ ] **Step 1: TeamCard email** — if `TeamCard.astro` doesn't render email, add an optional `email?` prop that renders a `mailto:` line when present (using `TextLink`). `team.ts` already has the optional field (Plan A).

- [ ] **Step 2: Re-order + re-port** the page to: full-bleed studio hero `<Image>` → centred `<h1>` (page title) → intro → **Team grid** (`TeamCard` for each `team` member) → story (centred prose) → process → belief (lavender text `<Section surface="tint">`, not a dark tile). Keep the real copy; don't fabricate the "Craft, local knowledge…" headline if it's local-only — match the design.

- [ ] **Step 3: Verify**

Run: `npm run check && npm run build`; in `npm run dev` the team appears above the story, the belief block is lavender text, one `<h1>`.
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/about.astro src/components/ui/TeamCard.astro
git commit -m "feat(about): studio hero, team-first, centred editorial"
```

---

### Task 7: Contact (`src/pages/contact.astro`)

**Design source:** `ui_kits/website/Contact.jsx` (centred single column, **no form**). **Deltas:** centred single-column layout. **Keep the implementation's real details, live OpenStreetMap iframe, social links, and hours/reply notes** — the design shows placeholders; do NOT adopt them.

**Files:** Modify `src/pages/contact.astro`.

- [ ] **Step 1: Re-port to a centred single column** — `<h1>` + intro, then the real practice details (address, `tel:`, `mailto:` via `TextLink`), the existing OpenStreetMap `<iframe>`, social links, and hours/reply notes. **No form, no `Input`/`Select`.**

- [ ] **Step 2: Verify**

Run: `npm run check && npm run build`; confirm in `npm run dev` the real contact details + map are present and there is no form.
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/contact.astro
git commit -m "feat(contact): centred single column (real details, no form)"
```

---

### Task 8: Integration sweep & verification

**Files:** none (verification); fix-ups in any page as needed.

- [ ] **Step 1: Content-artifact + H1 sweep**

```bash
# exactly one <h1> per built page
grep -rlc "<h1" dist --include="*.html" | head
# no leftover prototype placeholders / old domain
grep -rn "studio@\|01428 000000\|High St GU27\|lorem\|TODO" dist --include="*.html" || echo "clean"
```
Expected: every page has one `<h1>`; `clean`.

- [ ] **Step 2: Full build + page count**

Run: `npm run check && npm run build`
Expected: `0 errors, 0 warnings`; pages = previous 157 **+ 5** category pages = **162** (adjust if Task 4 changed counts).

- [ ] **Step 3: Run the existing unit tests**

Run: `node --test src/lib/*.test.mjs`
Expected: all pass (adjacent, page-href, content, taxonomy, attachments, **reading-time**).

- [ ] **Step 4: Visual pass in `npm run dev`** against the design — Home, Projects (filter), a project (with/without testimonial), News (feature panel + a category page), an article (read-time), About (team-first), Contact (no form). Note any mismatch and fix in the owning page.

- [ ] **Step 5: Final commit (if fix-ups were made)**

```bash
git add -A
git commit -m "fix(design-refresh): integration sweep adjustments"
```

---

## Definition of done (Plan C)

- All seven templates match the updated design; category pages exist; testimonials + reading time render; filters work.
- Real contact details, map, breadcrumbs, header contact line, and footer address all retained.
- Exactly one `<h1>` per page; prose styled via `:global()`; no forms; no prototype placeholders.
- `npm run check` = 0/0/0; `npm run build` succeeds; all unit tests pass.
- After merge: push to `main` → Cloudflare auto-deploys the new design.

## Self-review notes

- If Task 4's category routing pushes the page count, update Task 8's expected count to match.
- The news index pagination + category pages coexist; the pills are links (static), not client JS — consistent with the no-backend model.
- Projects stays a single client-filtered page; if the owner later wants project pagination, that's a follow-up, not this plan.
