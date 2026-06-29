# ArchitectureLIVE Website Rebuild — Design Spec

**Date:** 2026-06-29
**Owner:** Osky Gratton (non-technical; Claude Code executes changes)
**Status:** Approved (brainstorming complete)

---

## 1. Goal

Rebuild **architecturelive.co.uk** — the website of ArchitectureLIVE, a contemporary,
sustainability-focused architecture practice in Haslemere, Surrey — as a **fast, static,
near-zero-maintenance site**. It is a **portfolio + lead-generation** site: project
photography is the hero; the goal is to get prospective clients to enquire.

Migrate all existing content (projects + news posts, with images) from the old
WordPress/Divi site into the new design. New projects and news posts will be added a
couple of times a month, by the owner working through Claude Code.

## 2. Decisions (locked during brainstorming)

| Decision | Choice | Rationale |
|---|---|---|
| Framework | **Astro** (fully static output, near-zero client JS) | Fastest practical content site; ships no JS by default; markdown content; built-in image optimization |
| Content format | **Markdown files in Astro content collections** | Owner/Claude Code adds a `.md` file + images and pushes; no CMS/DB |
| Images | **Originals in repo, optimized at build via `astro:assets`** | "Swap originals + recompress properly" becomes the normal pipeline, not a chore |
| Hosting | **Cloudflare Pages** (git push → build → deploy) | Free, global CDN, custom domain, automatic HTTPS, no server |
| Contact | **Email + phone links only — no form** | 100% static, zero serverless, lowest maintenance & attack surface |
| Visual design | **Faithful port of the Claude Design project** `048abcab-fb6a-4c25-9239-d218f19ce8c1` | Already-authored design system + 8 screens |
| Old rebuild | **Ignored entirely** (`ArchitectureLiveOLD/` is not a source) | User chose "truly from scratch" |
| Source inputs | The `.wpress` backup (content+images) and the Claude Design (visual) | |

## 3. Real contact details (extracted from the backup — replace any placeholders)

- **Practice:** ArchitectureLIVE
- **Address:** Tall Trees, The Cylinders, Fernhurst, Haslemere, Surrey **GU27 3EL**, United Kingdom
- **Phone:** +44 1428 652 018 (`01428 652018`)
- **Email:** **info@architecturelive.co.uk** (team: jonathan@, irene@)
- **Tagline:** *Contemporary Design & Sustainable Living*
- **Service area:** Surrey, West Sussex, Hampshire, Berkshire (incl. South Downs National Park)
- **Team:** Jonathan Gratton, Irene Konschill

## 4. Content inventory (from `database.sql` in the backup)

The old site is **WordPress + Divi**, table prefix placeholder `SERVMASK_PREFIX_`.

| Content | Count | Where it lives in WP |
|---|---|---|
| **Projects** | **27** | `post_type='page'`, `post_parent=3861` (the "Projects" page), `post_status='publish'` |
| **News posts** | **112** | `post_type='post'`, `post_status='publish'` (a further 81 are `private` 2014-era — **excluded**, see §8) |
| Structural pages | 6 | Home, News, About, Contact, Projects, Privacy Policy |
| Team member pages | 2 | Irene Konschill, Jonathan Gratton (folded into About/Studio) |

**Content structure (both projects and news):** body is wrapped in **Divi shortcodes**
(`[et_pb_section]`/`[et_pb_row]`/`[et_pb_column]`/`[et_pb_text]`…). Readable text lives as
HTML (`<h1>/<h2>/<p>`) inside `[et_pb_text]` modules. **Images are not inline URLs** — they
are referenced by WordPress gallery shortcodes carrying attachment IDs, e.g.
`[gallery royalslider="1" ids="5728,8013,8686,6822,4522"]`. Featured image is in
`postmeta._thumbnail_id`. Image plugins present: **ShortPixel** (the cause of the existing
over-compression) and Yoast SEO (usable meta descriptions in `postmeta._yoast_wpseo_metadesc`).

**Image resolution:** attachment ID → `postmeta._wp_attached_file` → path under
`uploads/<yyyy>/<mm>/<file>` inside the `.wpress` archive.

## 5. Information architecture / routes

```
/                      Home
/projects              Projects index (filter: Extensions · New Build · Education · Commercial)
/projects/<slug>       Project detail (full-bleed hero, gallery, facts, narrative, prev/next)
/news                  News index (paginated; optional category filter)
/news/<slug>           News article
/about                 Studio (practice story, approach, team: Jonathan + Irene)
/contact               Contact (email/phone/address links + map, NO form)
/404, /sitemap.xml, /rss.xml, /robots.txt, /_redirects
```

Nav labels (from the design's `Shell.jsx`): **Projects · Studio · Contact · News** (Studio → `/about`).

## 6. Design system (source: Claude Design `048abcab-…`)

- **Tokens** (`tokens/colors.css`, `fonts.css`, `spacing.css`, `typography.css`) + `styles.css` —
  ported verbatim as global CSS. Palette is the fixed indigo–purple family
  (`--color-purple #7378d3`, `--color-indigo-vivid #5952de` CTAs, `--color-indigo-deep #4f5387`,
  `--color-lavender #c3c6ec`) over neutrals (white / `#f5f5f5` / charcoal `#363636`).
- **Type:** Quicksand (display, Google Fonts, weights 400–700) + platform neutral sans (body).
- **Components** (`components/core`, `components/navigation`, `components/surfaces`): `SiteHeader`,
  `Footer`, `Pagination`, `CtaBand`, `Button`, `IconButton`, `Input`, `Select`, `TextLink`,
  `ProjectCard`, `ProjectTile`, `NewsCard`, `TeamCard`, `Tag`, `Placeholder`.
- **Screens** (`ui_kits/website/`): `Shell`, `Home`, `Projects`, `ProjectDetail`, `News`,
  `NewsArticle`, `About`, `Contact`.

**Port convention:** the design is a React click-through prototype (inline-style objects, a
runtime component namespace `window.AppleDesignSystem_048abc`, and a `go()` SPA router).
Porting to Astro means: tokens/`styles.css` → global CSS; each component/screen → an `.astro`
file reproducing the **markup and inline styles exactly**, converting `style={{…}}` →
`style="…"`, `className` → `class`, dropping the `NS`/`go()` runtime wiring, and replacing the
prototype's placeholder data arrays (`PROJECTS`, `NEWS` in `Shell.jsx`) with real content
collection queries. The DesignSync file is the source of truth for each component's exact styles.

## 7. Content model (the schema Plans 1 & 2 must agree on)

**`projects` collection** — `src/content/projects/<slug>/index.md` (+ co-located images):
```yaml
title: "Near Passivhaus Office Extension, Fernhurst"   # location-style title
slug: near-passivhaus-office-extension                 # preserved from old URL
sector: "Extensions"        # one of: Extensions | New Build | Education | Commercial
location: "Fernhurst, West Sussex"
status: "Completed"         # Completed | In planning | In progress
year: 2020                  # from post_date (review/adjust)
features: ["Fabric-first", "Near-Passivhaus"]   # sustainability facts (optional, curated)
heroImage: "./hero.jpg"     # co-located; optimized by astro:assets
gallery: ["./01.jpg", "./02.jpg", ...]          # co-located gallery
excerpt: "..."              # short summary (Yoast metadesc or first paragraph)
featured: false             # show on Home
draft: false
# body (Markdown) below the frontmatter
```

**`news` collection** — `src/content/news/<slug>/index.md` (+ co-located images):
```yaml
title: "The UK's first Kollegger Descender Fronts are complete"
slug: ...                   # preserved from old URL
date: 2024-05-10            # from post_date
category: "Insight"         # Awards | Press | Insight | Studio | Projects (mapped from WP category)
heroImage: "./hero.jpg"
excerpt: "..."
draft: false
# body (Markdown) below the frontmatter
```

Both schemas are enforced with Astro `defineCollection` + zod, using the `image()` helper for
`heroImage`/`gallery` so co-located originals are validated and optimized at build.

## 8. Migration rules

- Migrate **published** content only (27 projects, 112 news). Exclude `private`/`draft`/`auto-draft`.
- **Sector** is not in the old data (projects were untyped pages) → assign each of the 27 a sector
  (starting table in Plan 2, refined by reading each project's body).
- **News category** comes from the WP `category` taxonomy (`term_taxonomy` + `term_relationships`),
  mapped onto the design's set.
- **Divi → Markdown:** keep the text inside `[et_pb_text]` (convert its HTML to Markdown); pull image
  galleries from `[gallery ids=…]`; resolve `_thumbnail_id` as hero; discard layout shortcodes.
- **URLs / SEO:** old project & news pages lived at the site root (e.g. `/period-house-haslemere-surrey`).
  Generate a Cloudflare `_redirects` file mapping every old root slug → its new `/projects/…` or
  `/news/…` URL (301), so inbound links and search rankings are preserved.
- **Images (two-phase):** Phase A migrates the backup's (compressed) images so the site is complete.
  Phase B swaps in the high-res files from `Original_Images/03 Image Library/` (a general library —
  matching to projects is a curation step, not an automatic filename map) and lets `astro:assets`
  recompress properly. Same pipeline both times — only the source file changes.

## 9. Repository / hosting shape

- Working directory `ArchitectureLive/` becomes the **Astro repo root** (git initialised in Plan 1).
- `Old_Website/` (4 GB `.wpress`) and `Original_Images/` (1.4 GB) are **git-ignored** local sources only.
- `scripts/` holds the migration tooling (Node/TypeScript). `src/content/` holds the generated collections.
- Cloudflare Pages: build `astro build`, output `dist/`, custom domain `architecturelive.co.uk`.

## 10. Non-goals (YAGNI)

No CMS/admin, no comments, no search, no e-commerce, no serverless functions, no client-side
framework runtime. No migration of the 81 private 2014 posts, plugin data, or WP theme code.

## 11. Acceptance criteria

- `npm run build` produces a static site; Lighthouse performance ≈ 100 on Home and a project page.
- All 27 projects and 112 news posts render with correct images, on `/projects/<slug>` and `/news/<slug>`.
- Projects index filters by sector; news index paginates.
- Contact page shows working `tel:`/`mailto:` links and the real address; no form.
- Old URLs 301-redirect to new ones; `sitemap.xml` and `rss.xml` are present and valid.
- Adding a new project/news post = add one markdown folder + push; no other steps.

## 12. Decomposition (one plan per subsystem)

1. **Plan 1 — Astro foundation + design-system port** *(this batch)*: scaffold, tokens/global CSS,
   shell (header/footer/CTA), content collections (schema + a few hand-made sample entries), all
   surface/nav components, and all 7 page templates wired to collections. Deliverable: a styled,
   deployable site with sample content.
2. **Plan 2 — Content migration pipeline**: crack the `.wpress`, parse the DB, build the attachment
   map, convert Divi→Markdown, extract & co-locate images, classify sectors/categories, generate all
   27 projects + 112 news + `_redirects`. Deliverable: real content replacing the samples.
3. **Plan 3 — Deploy + original-image upgrade**: git repo + Cloudflare Pages + domain + redirects live;
   then Phase-B swap of `Original_Images` originals and proper recompression. Deliverable: site live on
   the real domain with crisp imagery.
```
