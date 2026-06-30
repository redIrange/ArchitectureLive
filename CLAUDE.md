# ArchitectureLIVE — site guide

Fast, static marketing site for **ArchitectureLIVE** (contemporary, sustainability-focused
architecture practice, Haslemere, Surrey). Built with **Astro 5** (fully static, near-zero
client JS) and deployed to **Cloudflare Pages**. There is **no backend and no contact form** —
contact is plain email/phone links.

## Deploy

Cloudflare Pages is connected to this GitHub repo via Git integration:

- **Push to `main` → Cloudflare builds (`npm run build`) and deploys `dist/`.** That's the whole
  release process. No manual upload.
- Build command `npm run build`, output dir `dist`, **`NODE_VERSION=20`** (see `.nvmrc`).
- Redirects live in `public/_redirects` (old dated WordPress news URLs `/YYYY/MM/slug` → `/news/slug`).
  Cloudflare applies them automatically.

## Add a project or news post

```bash
node scripts/new-post.mjs <project|news> "<Title>" <image-folder>
```

It slugifies the title, creates `src/content/<projects|news>/<slug>/`, optimizes every image in
`<image-folder>` (auto-rotate, cap 2400px, JPEG q82) into `hero-01.jpg` + `g01.jpg`, `g02.jpg`…,
and writes a **draft** `index.md` skeleton. Then:

1. Edit `src/content/<coll>/<slug>/index.md` — fill in the frontmatter and write the body (Markdown).
2. Set `draft: false`.
3. `git push` → live in ~a minute.

(Or just ask Claude Code to do all of this.) A hero image is **required** — drafts with a missing
`heroImage` file fail the build even though they're hidden from the site.

## Content schema

**Project** (`src/content/projects/<slug>/index.md`):

| field | notes |
|---|---|
| `title` | string |
| `sector` | `Extensions` \| `New Build` \| `Education` \| `Commercial` |
| `location` | string |
| `status` | default `Completed` |
| `year` | integer, optional |
| `features` | string array, default `[]` |
| `heroImage` | `"./hero-01.jpg"` (required) |
| `gallery` | `["./g01.jpg", …]` |
| `excerpt` | short summary |
| `featured` | `true` shows it on the home page |
| `draft` | `true` hides it everywhere |

**News** (`src/content/news/<slug>/index.md`):

| field | notes |
|---|---|
| `title` | string |
| `date` | `YYYY-MM-DD` (drives ordering + the `/news/slug` URL is the slug only) |
| `category` | `Extensions` \| `New Build` \| `Education` \| `Commercial` \| `General` (default) |
| `heroImage` | `"./hero-01.jpg"` (required) |
| `excerpt` | short summary |
| `draft` | `true` hides it |

Images are optimized at build by `astro:assets` — commit the **source** `hero-*.jpg`/`g*.jpg`
into the post folder; never hand-optimize. The schema is enforced in `src/content.config.ts`.

## Commands

```bash
npm install        # first time
npm run dev        # local preview at http://localhost:4321
npm run check      # type-check + content-schema validation (expect 0/0/0)
npm run build      # production build into dist/
```

Always run `npm run check` before pushing.

## Image-quality upgrade (Phase B, ongoing)

The migrated images came from a WordPress backup that over-compressed them. The high-res
originals live in **`Original_Images/`** (local-only, git-ignored), keyed by project *codenames*
(Stonehurst, Tall Trees, St Barts, White Lea South…), not public titles.

```bash
node scripts/originals/suggest.mjs          # ranks candidate source folders per project
# edit scripts/originals/mapping.json  →  { "<slug>": { "dir": "<dir under the library>", "hero": "<file>" } }
node scripts/originals/apply.mjs            # re-materializes hero/gallery from the originals
npm run check && npm run build              # verify, then git push to deploy
```

Re-run incrementally as more originals are sourced — each pass only improves photos.

## Image upscaling (Real-ESRGAN)

Source photos are upscaled locally with Real-ESRGAN, then capped and recompressed so
committed files stay lean while pixels are sharp.

```bash
# one-time: vendor the engine (git-ignored) — see docs plan Task 5
node scripts/upscale/run.mjs            # every project + news image (idempotent)
node scripts/upscale/run.mjs <slug>     # only the named folder(s)
npm run check && npm run build          # verify, then git push to deploy
```

`scripts/upscale/done.json` (committed) records a hash per processed file, so re-runs skip
already-upscaled images and never double-upscale. Pipeline: 4× upscale → downscale to 2560px
longest edge → JPEG q88 mozjpeg → overwrite source.

## Repo layout

- `src/content/{projects,news}/<slug>/` — content + source images (the site's data).
- `src/{pages,layouts,components,styles,lib}` — the Astro site; design ported from Claude Design.
- `public/_redirects` — old-URL → new-URL 301s.
- `scripts/new-post.mjs` — add content (above).
- `scripts/originals/` — Phase B image upgrade (above).
- `scripts/migrate/` — one-off WordPress `.wpress` → Markdown migration toolchain (provenance;
  not needed for normal operation).
- `scripts/check/links.mjs` — crawl the sitemap and report broken links (`node scripts/check/links.mjs <url>`).
- `docs/superpowers/` — the design spec + the three build plans.

**Local-only, never committed** (git-ignored): `Old_Website/` (the 4 GB `.wpress` backup),
`Original_Images/` (the studio image library), `node_modules/`, `dist/`.

## Contact details (real)

ArchitectureLIVE, Tall Trees, The Cylinders, Fernhurst, Haslemere, Surrey GU27 3EL ·
+44 1428 652 018 · info@architecturelive.co.uk
