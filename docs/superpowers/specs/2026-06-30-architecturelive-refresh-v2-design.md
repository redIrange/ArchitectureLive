# ArchitectureLIVE refresh v2 — design fidelity + image upscaling

**Date:** 2026-06-30
**Status:** approved direction; spec under review
**Branch:** `refresh-v2` (one combined branch, subagent-driven, merged to `main` + pushed)

## Goal

Two things, in one branch:

1. **Thoroughly** apply the latest Claude Design (project `048abcab-fb6a-4c25-9239-d218f19ce8c1`,
   `ui_kits/website/*`) to the live site, so **every page matches the design** — not just the home
   page. The previous refresh left fidelity gaps (e.g. a filled-pill "Enquire" button on project
   detail pages that the design renders as plain text). This pass closes all of them.
2. **Upscale the site's images** with a local AI upscaler (Real-ESRGAN, the engine Upscayl wraps),
   because many source images are far below display size and look soft/compressed.

## Context

- Static Astro 5 site, no backend, deployed to Cloudflare Pages on push to `main`.
- The design is a React/JSX reference kit. We re-port it to Astro components/pages by hand. The
  **design tokens are unchanged** (same palette, fonts, spacing) — this is layout/treatment fidelity,
  not a re-theme.
- The design uses **placeholder content** (fake addresses, generic project titles, `Placeholder`
  image stand-ins). We keep the site's **real content** (address, phone, email, real photos, real
  testimonials, real projects/news) and apply the design's **structure, styling and components** to it.

## Governing principles (apply to every task)

1. **Match the design exactly** in layout, typography, spacing, component structure and interaction —
   for every page and component — with only the explicit exceptions below.
2. **Deliberate exceptions** (confirmed with the owner; do NOT "fix" these toward the design):
   - **Home hero** stays a **5-image rotating cross-fade slideshow** (not the design's single image).
   - **Project captions** on the home + projects pages show **location only** (e.g. "Haslemere,
     Surrey"), never a descriptive title or a type/status meta line.
   - **Header** stays **without** the CTA button and contact strip (owner removed them last round;
     the design's rendered header also omits them — these agree).
3. **Real data beats placeholder data.** Never overwrite real contact details, image files,
   testimonials, team emails, or project/news content with the design's placeholders.
4. **Tokens only** — no hard-coded hex/px where a `var(--…)` token exists. Use the existing spacing
   scale (`--space-xxs/xs/sm/md/lg/xl/xxl/3xl/section`; there is no `--space-2xl`/`--space-4xl`).
5. **One `<h1>` per page**; Markdown body content rendered via `<Content/>` needs `:global()` for
   scoped styles to reach it.
6. **No new client JS frameworks.** Keep the site near-zero-JS and fully static.

## Design source of truth (what each page/component must match)

Pulled from the design kit and treated as data:

- **Button** (`components/core/Button.jsx`): plain text label, **no fill, no border, no pill**;
  swells (`scale ~1.09`) and shifts colour on hover. Variants = colour only
  (primary/ghost/on-dark/subtle); sizes = label font-size (small/medium=default/large=display-md).
- **TextLink**: indigo, underline-on-hover, optional chevron.
- **Tag** (`components/surfaces/Tag.jsx`): **plain text, no pill/fill** in BOTH variants — `tag`
  (static uppercase eyebrow label) and `filter` (selectable text that swells on hover/selection).
- **Pagination**: the **current page IS a filled indigo pill** — intentional, keep it.
- **CtaBand**: dark band, headline + optional sub + Button slot.
- **SiteHeader**: brand mark + wordmark, plain-text swelling nav, mobile menu button. **No CTA,
  no contact strip rendered.**
- **Footer**: deep-indigo surface, brand block + 3 link columns + social/policy as **plain text links**.
- **NewsCard**: image-led, `radius-md`, "category · date" eyebrow, title that swells on hover,
  optional excerpt, card lift + image zoom on hover.
- **ProjectCard**: `default` (photo + corner Tag + title/meta below, hover lift + zoom) and
  `reveal` (image-only tile; type + title fade up over a scrim on hover). Projects grid uses `reveal`.
- **TeamCard**: 3/4 portrait, name (display-md), role (purple eyebrow), bio, email link.
- **ProjectTile**: full-bleed section building block (used where the design composes hero/section tiles).

## Workstream 1 — Design fidelity, page by page

Each page below is re-ported to match its design counterpart. The implementation plan will diff the
current Astro file against the JSX and enumerate exact edits; this section fixes the intended result.

### Home (`src/pages/index.astro` ↔ `Home.jsx`)
- **Hero:** keep the 5-image slideshow (exception). No overlay text; full-bleed 94vh.
- **Intro block:** replace eyebrow + headline + sub with the design's **caption style** — a large
  uppercase display-md title "A Surrey practice crafting low-energy homes, schools and spaces" and a
  small grey meta line "ArchitectureLIVE · Haslemere, Surrey". Keep it as the page's single `<h1>`.
- **Selected work:** stacked full-bleed image bands with captions **between** images (never over).
  Captions = **location only** (exception). Remove the "Selected work" eyebrow label row (the design
  has none). Keep the hero/band de-duplication so the slideshow images don't repeat as the first band.
- **View all projects:** replace the TextLink with the design's plain swelling **Button**
  (`variant="primary" size="large"`, no arrow).
- **Approach:** text-only on lavender; **add** the design's "Read our story" **Button**
  (`variant="primary"` → `/about`), currently missing.
- **Latest news:** image-led NewsCard grid of 3 (matches).
- **CtaBand** ("Start your enquiry") provided by the shell — keep.

### Projects index (`src/pages/projects/index.astro` ↔ `Projects.jsx`)
- Slim header: `<h1>` "Selected work" (display-md, uppercase) on the left, inline **Tag filters**
  (All/Extensions/New Build/Education/Commercial) on the right — **plain swelling text, no pills.**
- Dense 3-column `al-grid-projects` of **ProjectCard `variant="reveal"`**, square (`1 / 1`), with the
  **location** as the revealed title. Client-side sector filter preserved.
- Pagination at the foot if the project count needs it (current page = pill, per design).

### Project detail (`src/pages/projects/[slug].astro` ↔ `ProjectDetail.jsx`)
- Full-bleed 94vh hero; title + place caption beneath (place = grey uppercase eyebrow; title = h1
  hero-display, uppercase).
- Centred narrow **Prose** blocks alternating with full-width **image bands** (no text over images).
- **Testimonial** section on lavender (blockquote display-sm + uppercase figcaption), rendered only
  when the project has a real testimonial.
- **Project facts** as a centred `al-grid-4` (Location / Project type / Status / Sustainability).
- **Prev/next** row with a centre **plain swelling `<Button>` "Enquire about a project"** →
  **this replaces the current `.detail-enquire` filled indigo pill** (the headline fidelity bug).
- `cta={false}` (no CtaBand on detail pages).

### News index (`src/pages/news/index.astro` + `category/[category].astro` ↔ `News.jsx`)
- Slim header: `<h1>` "News & insight" + **Tag filters** (All/Awards/Press/Insight/Studio/Projects),
  plain text.
- **Feature panel** for the first/most-recent item (image-led, copy beside, "Read article →"),
  then an `al-grid-3` of NewsCards, then Pagination. Category routes reuse the same layout.

### News article (`src/pages/news/[slug].astro` ↔ `NewsArticle.jsx`)
- Breadcrumb "News / {category}"; Tag + "{date} · {N} min read"; `<h1>` hero-display; optional
  script dek; hero image with image drop-shadow.
- Body prose: lead-airy paragraphs, `h3` subheads, a left-border **pull quote**, inline images.
- **Share** row as **plain text links** (LinkedIn, Houzz, Copy link).
- **Related reading** `al-grid-3` of NewsCards.

### About / Studio (`src/pages/about.astro` ↔ `About.jsx`)
- Full-bleed 94vh studio hero; title + place caption (h1 hero-display, uppercase, "A studio for
  contemporary, sustainable design").
- Intro Prose; **Team section placed high** (`al-team`, two **TeamCards** with real bios + emails
  when available); story Prose (Waverley / Channel 4 lines retained as in the design); **"How we
  work"** 01/02/03 process row (`al-grid-3`); **Belief** text-only lavender section.
- CtaBand retained (shell default).
- Studio hero image stays the current default until a real studio photo is supplied (open item).

### Contact (`src/pages/contact.astro` ↔ `Contact.jsx`)
- Title + caption (place eyebrow + `<h1>` "Let's talk" + lead), centred studio details (no form),
  "Working across" line, and the map.
- Keep the **real** address / phone / email / map marker (GU27 3EL, 51.04695,−0.72434) — do NOT
  adopt the design's placeholder details.
- **De-pill the social links:** convert `.c-social-pill` (bordered pills) to plain text links,
  consistent with the footer and the design's no-pill language. Keep the real social URLs.

### Site-wide component checks
- **Button / Tag** render as plain swelling text everywhere (no stray pills/fills).
- **Header**: brand + plain swelling nav + mobile menu only (no CTA/contact strip).
- **Footer**: brand + 3 columns + plain-text social/policy links; matches design.
- **Pagination** keeps its intentional current-page pill.
- Grep the whole `src/` tree for `--radius-pill` and reconcile each use against the design
  (pagination = keep; everything that's an action button or chip = plain text).

## Workstream 2 — Image upscaling

### Problem
Many committed source images are well below display size (project heroes at 600×446, 800×600 shown
full-bleed at 94vh; the worst news images are ~14 KB at 1200×800). Even the "original" swaps are
small. Result: visible softness/compression. ~632 source JPEGs, ~78 MB total today.

### Tool
- **Real-ESRGAN `realesrgan-ncnn-vulkan`** (`realesrgan-x4plus` model) — runs on the machine's
  Apple M1 Max GPU via Metal/Vulkan. Vendored into `scripts/upscale/vendor/` (git-ignored;
  binary + models, de-quarantined). Smoke-tested on one image before any batch.
- **Fallback** if the standalone binary misbehaves on this macOS: `brew install --cask upscayl`
  and call its bundled engine. (Python/torch is NOT used — system Python is 3.9.)

### Pipeline — `scripts/upscale/run.mjs`
For each source image (`hero-*.jpg`, `g*.jpg`) under `src/content/{projects,news}/**`:
1. Skip if the committed file's hash already appears in the manifest (idempotent — never
   double-upscale, which would soften an already-processed file).
2. Upscale **4×** → temporary PNG.
3. `sharp`: downscale to a **2560 px longest-edge cap** (`fit:"inside"`, no enlargement beyond
   source×4), re-encode **JPEG quality 88, mozjpeg**, and **overwrite the source file in place**.
4. Record the new file's SHA-256 in a committed manifest **`scripts/upscale/done.json`**.
5. Remove the temp file.

Rationale: 4× gives Real-ESRGAN room to remove JPEG artifacts and synthesize edge detail; the
2560/q88 downscale keeps committed files a sane size (~150–500 KB) while `astro:assets` still
generates the responsive widths the layout requests (heroes go up to 2560). The manifest makes the
batch resumable and safe to re-run.

### Scope & order
- **Scope:** every committed source image that renders anywhere on the site (all projects + all news).
- **Order:** process the **top-6 featured projects' images first**; the owner eyeballs a sample before
  the full batch runs (≈20–60 min on the M1; run in the background and monitor).

### Repo impact & caveats
- Source grows from ~78 MB to roughly ~150–200 MB. Affects only the git repo, not what Cloudflare
  serves; 794 GB free locally. Acceptable.
- AI upscaling removes artifacts and sharpens but **cannot invent true detail** — the very worst
  inputs will look cleaner but still soft. Architecture photography upscales well; the sample check
  catches any over-smoothing/hallucination so the model/denoise can be tuned.

## Non-goals

- No Cloudflare/DNS work (separate, owner-driven).
- No contact form (site stays form-free).
- No token/palette changes.
- No content rewrites beyond adopting the design's home intro copy; real data is preserved.
- No re-sourcing from `Original_Images/` (the originals are also low-res; upscaling the committed
  files is uniform and sufficient).

## Verification & rollout

1. `npm run check` → expect 0 errors / 0 warnings.
2. `npm run build` → expect the current page count (~162) with no broken `astro:assets` references.
3. Unit tests pass (reading-time etc.).
4. One `<h1>` per page; no contact form; no stray pill on any action button (grep `--radius-pill`).
5. Spot-check upscaled outputs (dimensions/size sane) and the home + project-detail + news pages.
6. Commit, merge `refresh-v2` → `main`, push. Cloudflare auto-deploys.

## Risks

- **Upscaler won't run on this macOS** (Vulkan/Gatekeeper). Mitigation: smoke-test first; Upscayl
  cask fallback; both are local.
- **Batch is slow / interrupted.** Mitigation: manifest-based resume; background run + monitor.
- **A faithful re-port regresses a real-data nicety** (e.g. real testimonials, real map). Mitigation:
  the "real data beats placeholder" principle is restated in every page task; review gates per task.
- **Over-zealous fidelity re-adds removed header CTA/contact strip.** Mitigation: exception called
  out explicitly in the header task.
