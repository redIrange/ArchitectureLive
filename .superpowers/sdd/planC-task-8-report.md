# Plan C — Task 8: Integration sweep & verification report

**Date:** 2026-06-30

---

## Fix A — Unify news pagination header

**File:** `src/pages/news/page/[page].astro`

**Problem:** Pages 2+ used `NewsIntro` (which rendered its own `Section`/`Container` wrapping and included a "Journal" eyebrow), making the header inconsistent with page 1's `NewsHeader` (which shows only the h1 + category filter pills, no eyebrow).

**Change:**
- Replaced `import NewsIntro from "../../../components/ui/NewsIntro.astro";` with `import NewsHeader from "../../../components/ui/NewsHeader.astro";`
- Replaced `<NewsIntro />` with:
  ```astro
  <Section surface="light" pad="var(--space-xl)">
    <Container>
      <NewsHeader title="News & insight" activeCategory={null} />
    </Container>
  </Section>
  ```
  Matching the wrapping structure in `news/index.astro` exactly.
- The card grid, pagination, and `getStaticPaths` remain unchanged.
- No feature panel added (page 1 only).

---

## Fix B — About hero default image

**File:** `src/pages/about.astro`

**Problem:** The hero section was a charcoal-coloured empty `<section>` with a TODO comment; looked broken with no image.

**Change:**
- Added `import { Image } from "astro:assets";`
- Added `import studioHero from "../content/projects/near-passivhaus-office-extension/hero-01.jpg";`
- Replaced the empty `<section>` with:
  ```astro
  {/* Default: AL office. Swap for a dedicated studio/team photo when available. */}
  <section class="hero" aria-label="The studio, Haslemere">
    <Image
      src={studioHero}
      alt="ArchitectureLIVE studio, Fernhurst office extension"
      widths={[800, 1200, 1920, 2560]}
      sizes="100vw"
      class="hero__image"
      loading="eager"
      fetchpriority="high"
    />
  </section>
  ```
- Activated the `.hero__image` CSS rule (was commented out): `width: 100%; height: 100%; object-fit: cover; display: block;`
- Removed the old TODO comment block.
- The single `<h1>` in the title block is unchanged.

---

## Verification results

### 1. `npm run check`
```
Result (71 files):
- 0 errors
- 0 warnings
- 2 hints
```
Hints are in migration scripts (`scripts/migrate/classify-news.mjs`, `scripts/migrate/report.mjs`) — not in page files. Pass.

### 2. `npm run build`
```
[build] 162 page(s) built in 1.80s
[build] Complete!
```
162 pages. Pass.

### 3. One `<h1>` per page
```
all pages exactly one h1
```
Pass — every built HTML page has exactly one `<h1>`.

### 4. No prototype placeholders / old domain
```
clean
```
Pass — no matches for `studio@`, `01428 000000`, `High St GU27`, `lorem ipsum`, or `TODO`.
(The HTML comment `<!-- Default: AL office. Swap for ... -->` does not contain the word `TODO`.)

### 5. Unit tests
```
✔ adjacent returns wrapped neighbours
✔ pageHref — news scheme: page 1 → firstPageUrl
✔ pageHref — news scheme: page 2 → pageBase/2
✔ pageHref — news scheme: page 3 → pageBase/3
✔ 200 words is 1 minute
✔ rounds up partial minutes
✔ empty string is at least 1 minute
✔ strips markdown syntax and counts words
ℹ tests 8
ℹ pass 8
ℹ fail 0
```
All 8 unit tests pass.

---

## Issues fixed

None beyond the two planned fixes — the sweep was clean.

---

## Commit hash

`[see git log after commit]`
