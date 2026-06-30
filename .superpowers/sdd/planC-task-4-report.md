# Plan C – Task 4 Report: News index + category pages

## Design read

Read `ui_kits/website/News.jsx` from project `048abcab-fb6a-4c25-9239-d218f19ce8c1`.

Key signals extracted:
- h1 "News & insight" and filter pills share a flex row (`justifyContent: space-between`)
- Pills are `Tag variant="filter"` with `selected` state; "All" = null/unfiltered
- `FeaturePanel` (image-led, 55vw / 45vw split) sits above the card grid
- No "Journal" eyebrow in the design — it appears only in the old `NewsIntro` component

## Files changed / created

| Path | Action |
|---|---|
| `src/components/ui/NewsFilter.astro` | **Created** — shared category-pill nav; `activeCategory` prop; static `<a>` links |
| `src/pages/news/index.astro` | **Modified** — dropped `NewsIntro` import; new inline header section (h1 + NewsFilter); NewsFeaturePanel for `pageItems[0]`; grid for `pageItems.slice(1..8)`; pagination retained |
| `src/pages/news/category/[category].astro` | **Created** — `getStaticPaths` over 5 categories (CATS defined inside the function to satisfy Astro's module-scope restriction); NewsFilter with `activeCategory`; NewsCard grid; empty-state paragraph |
| `src/components/ui/NewsIntro.astro` | **Untouched** — still used by `news/page/[page].astro` (pages 2+) |

## Per-category post counts (from content)

| Category | Posts |
|---|---|
| Projects | 77 |
| Studio | 14 |
| Awards | 13 |
| Press | 6 |
| Insight | 2 |
| **Total** | **112** |

## Build results

- `npm run check`: 0 errors, 0 warnings (2 pre-existing hints in migrate scripts — unrelated)
- `npm run build`: **162 pages** built successfully (up from 157 — +5 category pages)
- All 5 category index.html files confirmed present: `/news/category/{awards,press,insight,studio,projects}/index.html`
- Feature panel present on `/news/index.html`
- Active pill (`tag--selected`) correctly set on each category page (verified on `/news/category/awards/`)
- One `<h1>` per page confirmed (grep count = 1 on `/news/`, `/news/category/awards/`, `/news/category/projects/`)

## Commit

Hash: `48273e1`
Branch: `design-refresh`
Message: `feat(news): feature panel + editorial category pages`

## Concerns / notes

- `NewsIntro` (with "Journal" eyebrow) remains in use on pages 2+ (`/news/page/[page].astro`). The brief says KEEP that file; the eyebrow inconsistency is intentional scope-limiting. It can be removed in a follow-up if desired.
- The `CATS` array must be defined **inside** `getStaticPaths` (not at module scope) — Astro executes it in a different context. This caused an initial build failure that was fixed before commit.
- Category pages are un-paginated by design (largest bucket = 77 Projects posts). If Projects grows significantly, consider adding pagination to that route.

---

## Review fixes report (commit after 48273e1)

### What changed

| Path | Action |
|---|---|
| `src/components/ui/NewsHeader.astro` | **Created** — shared header component; props: `title: string`, `activeCategory?: string \| null`; renders `<h1>` + `<NewsFilter>`; contains scoped `.news-header` / `.news-headline` styles |
| `src/components/ui/NewsFilter.astro` | **Modified** — `aria-current="page"` added to the active pill `<a>` (the "All" link when `activeCategory === null`; the matching category link otherwise); omitted (not rendered) when not active |
| `src/pages/news/index.astro` | **Modified** — swapped `NewsFilter` import for `NewsHeader`; replaced inline `<div class="news-header">` / `<h1>` / `<NewsFilter />` block with `<NewsHeader title="News & insight" />`; removed now-duplicate `.news-header` / `.news-headline` CSS |
| `src/pages/news/category/[category].astro` | **Modified** — same swap; now passes `title={activeCategory}` so the `<h1>` names the active category (e.g. "Awards"); removed duplicate CSS |

### h1 texts confirmed (built HTML)

| Route | h1 text |
|---|---|
| `/news/` | `News & insight` |
| `/news/category/awards/` | `Awards` |

### aria-current confirmed (built HTML)

- `/news/index.html`: `href="/news" aria-current="page"` on the "All" pill ✓
- `/news/category/awards/index.html`: `href="/news/category/awards" aria-current="page"` on the Awards pill ✓
- Inactive pills: no `aria-current` attribute rendered ✓

### check + build

- `npm run check`: 0 errors, 0 warnings (same 2 pre-existing hints in migrate scripts)
- `npm run build`: **162 pages** — unchanged from previous commit

### Commit

Branch: `design-refresh`
Message: `fix(news): shared NewsHeader (DRY) + aria-current + category h1 context`
