# ArchitectureLIVE Site Foundation — Implementation Plan (Plan 1 of 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Astro static site with a faithful port of the Claude Design system and all seven page templates, wired to type-safe content collections seeded with a few sample entries — a styled, buildable, deployable site ready for real content (Plan 2) and deployment (Plan 3).

**Architecture:** Astro 5, fully static output, near-zero client JS. Design tokens + `styles.css` are ported verbatim as global CSS; each design component/screen becomes an `.astro` file reproducing the prototype's markup and inline styles. Content lives in Astro content collections (Markdown + co-located images) validated with zod + the `image()` helper, so `astro:assets` optimizes imagery at build.

**Tech Stack:** Astro 5 · TypeScript · `@astrojs/sitemap` · `@astrojs/rss` · `astro:assets` (sharp) · plain CSS (no Tailwind). Node 20+ (system has Node 26).

## Global Constraints

- **Design source of truth:** Claude Design project `048abcab-fb6a-4c25-9239-d218f19ce8c1`, read via the `DesignSync` MCP tool (`method: get_file`). Port files **exactly** — markup + inline styles. This is the canonical reference; do not invent styling.
- **Port conversion rules** (apply to every component/screen port): `style={{ camelCase: val }}` → `style="kebab-case: val"`; `className` → `class`; remove the `window.AppleDesignSystem_048abc`/`NS` runtime lookups and the `go()`/`onNav` SPA router — replace with real `<a href>`; replace the prototype placeholder data (`PROJECTS`, `NEWS`, `SECTOR_CARDS` in `Shell.jsx`) with content-collection queries or real props.
- **Palette is FIXED** — use only the CSS variables from `tokens/colors.css` (e.g. `--color-indigo-vivid #5952de` for CTAs). Never hard-code hexes in components.
- **Nav labels:** `Projects · Studio · Contact · News`; "Studio" routes to `/about`.
- **No client framework, no serverless, no contact form.** Interactivity budget: mobile-nav toggle and the projects sector-filter only, both as tiny vanilla `<script>`.
- **Real contact details** (never placeholders): ArchitectureLIVE, Tall Trees, The Cylinders, Fernhurst, Haslemere, Surrey GU27 3EL · +44 1428 652 018 · info@architecturelive.co.uk.
- **`site` URL:** `https://architecturelive.co.uk` (for canonical/sitemap/rss).
- **Commit after every task.** Conventional commit messages.

---

### Task 1: Scaffold the Astro project

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `.gitignore`, `.nvmrc`, `src/pages/index.astro` (temporary), `public/favicon.svg`
- Working dir: repo root `ArchitectureLive/`

**Interfaces:**
- Produces: a buildable Astro project; `npm run build` → `dist/`; `npm run check` → `astro check`.

- [ ] **Step 1: Initialise git and ignore the large local sources**

```bash
cd /Users/oscar/Documents/Old/01_Oscar/06_Home/04_Programming/Websites/ArchitectureLive
git init
```

Create `.gitignore`:

```gitignore
# dependencies
node_modules/
# build output
dist/
.astro/
# large local-only migration sources (NOT committed)
Old_Website/
Original_Images/
# os
.DS_Store
# secrets
.env
.dev.vars
```

- [ ] **Step 2: Create `package.json`**

```json
{
  "name": "architecturelive",
  "type": "module",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check"
  },
  "dependencies": {
    "astro": "^5.6.0",
    "@astrojs/sitemap": "^3.2.0",
    "@astrojs/rss": "^4.0.11",
    "sharp": "^0.33.5"
  },
  "devDependencies": {
    "@astrojs/check": "^0.9.4",
    "typescript": "^5.6.0"
  }
}
```

- [ ] **Step 3: Create `astro.config.mjs`**

```js
// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://architecturelive.co.uk",
  output: "static",
  integrations: [sitemap()],
  image: {
    // default sharp service; generate modern formats
    responsiveStyles: true,
  },
  build: { format: "directory" },
});
```

- [ ] **Step 4: Create `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist", "Old_Website", "Original_Images"]
}
```

Create `.nvmrc` with `20` and `public/favicon.svg` (a placeholder; the real `al-mark` logo is added in Task 3):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#5952de"/><path d="M8 24 16 8l8 16" fill="none" stroke="#fff" stroke-width="2"/></svg>
```

Create a temporary `src/pages/index.astro` so the build has a page:

```astro
---
---
<html lang="en"><head><meta charset="utf-8" /><title>ArchitectureLIVE</title></head>
<body><h1>ArchitectureLIVE — scaffold OK</h1></body></html>
```

- [ ] **Step 5: Install and build**

```bash
npm install
npm run build
```

> **Node/sharp note:** this machine reports Node 26. If `npm install` fails building `sharp` (no
> prebuilt binary for the local Node), use Node 20 LTS via nvm (`nvm install 20 && nvm use 20`,
> matching `.nvmrc`) and re-run — Cloudflare builds on Node 20 anyway. Astro 5 needs Node ≥18.20.8/20.3/22.

Expected: `npm run build` completes with `Building static entrypoints…` and writes `dist/index.html`. Confirm:

```bash
test -f dist/index.html && grep -q "scaffold OK" dist/index.html && echo "BUILD OK"
```

Expected: `BUILD OK`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Astro project with sitemap + sharp"
```

---

### Task 2: Design tokens, global CSS, fonts, and BaseLayout

**Files:**
- Create: `src/styles/tokens/colors.css`, `src/styles/tokens/fonts.css`, `src/styles/tokens/spacing.css`, `src/styles/tokens/typography.css`, `src/styles/global.css`, `src/layouts/BaseLayout.astro`, `src/components/BaseHead.astro`
- Modify: `src/pages/index.astro` (use BaseLayout)

**Interfaces:**
- Produces: `BaseLayout` (props: `title: string`, `description?: string`, `image?: string`) wrapping `<html>` head+body and importing global CSS; `BaseHead` rendering meta/OG/canonical.

- [ ] **Step 1: Pull the design's tokens + base stylesheet**

Use DesignSync `get_file` on project `048abcab-fb6a-4c25-9239-d218f19ce8c1` for each of:
`tokens/colors.css`, `tokens/fonts.css`, `tokens/spacing.css`, `tokens/typography.css`, `styles.css`.
Write the first four verbatim to `src/styles/tokens/<name>.css`. Write `styles.css` to `src/styles/global.css`.

> `colors.css` and `fonts.css` were already captured during planning — `colors.css` defines the indigo–purple variables + semantic aliases; `fonts.css` `@import`s Quicksand from Google Fonts and documents the body stack. Reproduce them exactly. Fetch `spacing.css`, `typography.css`, and `styles.css` fresh.

- [ ] **Step 2: Create `src/styles/global.css` header that pulls tokens + a reset**

Prepend these imports to the top of `global.css` (above the ported `styles.css` content):

```css
@import "./tokens/colors.css";
@import "./tokens/fonts.css";
@import "./tokens/spacing.css";
@import "./tokens/typography.css";

*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; font-family: var(--font-text); color: var(--text-default); background: var(--color-white); }
img, picture, video, canvas { display: block; max-width: 100%; }
a { color: inherit; }
h1, h2, h3, h4 { font-family: var(--font-display); }
:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
```

> If `styles.css` already defines `--font-text`/`--font-display`, keep its definitions; the reset only references them. If the token name differs (e.g. `--font-body`), align the reset to the actual token names found in the ported files.

- [ ] **Step 3: Create `src/components/BaseHead.astro`**

```astro
---
interface Props { title: string; description?: string; image?: string; }
const { title, description = "Contemporary, sustainable architecture in Haslemere, Surrey.", image = "/favicon.svg" } = Astro.props;
const canonical = new URL(Astro.url.pathname, Astro.site).href;
const ogImage = new URL(image, Astro.site).href;
---
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<title>{title}</title>
<meta name="description" content={description} />
<link rel="canonical" href={canonical} />
<meta property="og:type" content="website" />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:url" content={canonical} />
<meta property="og:image" content={ogImage} />
<meta name="twitter:card" content="summary_large_image" />
<link rel="sitemap" href="/sitemap-index.xml" />
```

- [ ] **Step 4: Create `src/layouts/BaseLayout.astro`**

```astro
---
import BaseHead from "../components/BaseHead.astro";
import "../styles/global.css";
interface Props { title: string; description?: string; image?: string; }
const { title, description, image } = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <BaseHead title={title} description={description} image={image} />
  </head>
  <body>
    <slot />
  </body>
</html>
```

- [ ] **Step 5: Use it from the temporary home page**

Replace `src/pages/index.astro`:

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
---
<BaseLayout title="ArchitectureLIVE">
  <main style="padding: var(--space-section) var(--space-xl);">
    <h1 style="font-family: var(--font-display); color: var(--color-indigo-deep);">ArchitectureLIVE</h1>
    <p>Tokens wired.</p>
  </main>
</BaseLayout>
```

- [ ] **Step 6: Build and assert tokens load**

```bash
npm run build
grep -q "color-indigo-deep" dist/index.html || grep -rq "color-indigo-deep" dist/_astro/*.css && echo "CSS OK"
test -f dist/index.html && echo "PAGE OK"
```

Expected: `CSS OK` and `PAGE OK` (the CSS variable appears either inlined or in the emitted stylesheet).

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: port design tokens + global CSS, add BaseLayout/BaseHead"
```

---

### Task 3: Port the shell — SiteHeader, Footer, CtaBand, Button, and PageShell layout

**Files:**
- Create: `src/components/ui/Button.astro`, `src/components/ui/SiteHeader.astro`, `src/components/ui/Footer.astro`, `src/components/ui/CtaBand.astro`, `src/layouts/PageShell.astro`, `src/assets/al-mark.webp`, `src/scripts/menu.ts`
- Reference (DesignSync `get_file`): `components/core/Button.jsx`, `components/navigation/SiteHeader.jsx`, `components/navigation/Footer.jsx`, `components/surfaces/CtaBand.jsx`, `ui_kits/website/Shell.jsx`, `assets/logos/al-mark.webp`

**Interfaces:**
- Produces:
  - `PageShell` (props: `title: string`, `description?: string`, `active?: "home"|"projects"|"news"|"about"|"contact"`, `cta?: boolean = true`) — wraps `BaseLayout` and renders `SiteHeader` + `<slot/>` + optional `CtaBand` + `Footer`.
  - `Button.astro` (props: `href: string`, `variant?: "primary"|"ghost"|"on-dark"`, `size?: "small"|"medium"|"large"`) — renders an `<a>` styled per the design.
- Consumes: `BaseLayout` (Task 2).

- [ ] **Step 1: Add the logo asset**

DesignSync `get_file` `assets/logos/al-mark.webp` is base64 — decode and save to `src/assets/al-mark.webp`. (If `get_file` returns it base64-encoded, `echo "<b64>" | base64 -d > src/assets/al-mark.webp`.)

- [ ] **Step 2: Port `Button.astro`**

Fetch `components/core/Button.jsx`. Reproduce its variant/size style maps as inline styles on an `<a>`. Structure:

```astro
---
interface Props { href: string; variant?: "primary" | "ghost" | "on-dark"; size?: "small" | "medium" | "large"; class?: string; }
const { href, variant = "primary", size = "medium", class: cls } = Astro.props;
// Reproduce the exact padding/font/color maps from Button.jsx:
const sizes = { small: "...", medium: "...", large: "..." };       // copy from source
const variants = { primary: "...", ghost: "...", "on-dark": "..." }; // copy from source
const style = `${sizes[size]} ${variants[variant]}`;
---
<a href={href} class={cls} style={style}><slot /></a>
```

Fill `sizes`/`variants` from the source file's style objects (primary = `background: var(--color-indigo-vivid)`, white text, hover → `--color-indigo-deep`). Hover states that were JS in the prototype become a `:hover` rule — add a small scoped `<style>` block keyed to a class.

- [ ] **Step 3: Port `SiteHeader.astro`**

Fetch `components/navigation/SiteHeader.jsx`. Render: logo (`import logo from "../../assets/al-mark.webp"` + `<Image>`), the desktop contact strip (phone · email — real values), the nav links `Projects → /projects`, `Studio → /about`, `News → /news`, a `Contact`/Enquire `Button`, and a mobile menu button. Mark the `active` link (passed from `PageShell`). Props: `active?: string`.

Add `src/scripts/menu.ts` for the mobile drawer toggle (open/close, ESC, body scroll lock) and include it via `<script>` in the header. Keep it tiny and dependency-free.

- [ ] **Step 4: Port `Footer.astro` and `CtaBand.astro`**

Fetch `components/navigation/Footer.jsx` and `components/surfaces/CtaBand.jsx`. Reproduce markup/styles. Footer uses the real address/phone/email and nav links. `CtaBand` takes a `sub` prop and a default slot (per `Shell.jsx`, the CTA button text is "Start your enquiry" → `/contact`).

- [ ] **Step 5: Assemble `PageShell.astro`** (port of `Shell.jsx`)

```astro
---
import BaseLayout from "./BaseLayout.astro";
import SiteHeader from "../components/ui/SiteHeader.astro";
import Footer from "../components/ui/Footer.astro";
import CtaBand from "../components/ui/CtaBand.astro";
import Button from "../components/ui/Button.astro";
interface Props { title: string; description?: string; active?: string; cta?: boolean; }
const { title, description, active = "home", cta = true } = Astro.props;
---
<BaseLayout title={title} description={description}>
  <div style="min-height:100%;display:flex;flex-direction:column;background:var(--color-white);">
    <SiteHeader active={active} />
    <main style="flex:1;"><slot /></main>
    {cta && (
      <CtaBand sub="A free, no-obligation conversation about your site, your ideas and what's possible.">
        <Button href="/contact" variant="on-dark" size="large">Start your enquiry</Button>
      </CtaBand>
    )}
    <Footer />
  </div>
</BaseLayout>
```

- [ ] **Step 6: Render the shell on the home page and build**

Update `src/pages/index.astro` to use `PageShell` (temporary body), then:

```bash
npm run build
grep -q "info@architecturelive.co.uk" dist/index.html && echo "HEADER OK"
grep -q "Start your enquiry" dist/index.html && echo "CTA OK"
```

Expected: `HEADER OK` and `CTA OK`.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: port site shell (header, footer, CTA band, button)"
```

---

### Task 4: Content collections — schema + sample entries

**Files:**
- Create: `src/content.config.ts`, `src/content/projects/_sample-passivhaus-office/index.md` (+ `hero.jpg`, `01.jpg`, `02.jpg`), `src/content/projects/_sample-listed-country-house/index.md` (+ images), `src/content/news/_sample-waverley-award/index.md` (+ `hero.jpg`), `src/content/news/_sample-passivhaus-approach/index.md` (+ `hero.jpg`), `scripts/make-sample-images.mjs`
- Verify with: a throwaway `src/pages/_collcheck.astro` (deleted at end of task)

**Interfaces:**
- Produces the collection schemas Plan 2 must satisfy:
  - `projects`: `{ title, sector: "Extensions"|"New Build"|"Education"|"Commercial", location, status, year, features: string[], heroImage: image(), gallery: image()[], excerpt, featured: boolean, draft: boolean }` + Markdown body.
  - `news`: `{ title, date, category: "Awards"|"Press"|"Insight"|"Studio"|"Projects", heroImage: image(), excerpt, draft: boolean }` + Markdown body.
  - Slug = directory name (entry `id`). Entries prefixed `_` are samples (Plan 2 deletes them).

- [ ] **Step 1: Write the collection config**

```ts
// src/content.config.ts
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const SECTORS = ["Extensions", "New Build", "Education", "Commercial"] as const;
const CATEGORIES = ["Awards", "Press", "Insight", "Studio", "Projects"] as const;

const projects = defineCollection({
  loader: glob({ pattern: "**/index.md", base: "./src/content/projects" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      sector: z.enum(SECTORS),
      location: z.string(),
      status: z.string().default("Completed"),
      year: z.number().int().optional(),
      features: z.array(z.string()).default([]),
      heroImage: image(),
      gallery: z.array(image()).default([]),
      excerpt: z.string().default(""),
      featured: z.boolean().default(false),
      draft: z.boolean().default(false),
    }),
});

const news = defineCollection({
  loader: glob({ pattern: "**/index.md", base: "./src/content/news" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      category: z.enum(CATEGORIES).default("Insight"),
      heroImage: image(),
      excerpt: z.string().default(""),
      draft: z.boolean().default(false),
    }),
});

export const collections = { projects, news };
```

- [ ] **Step 2: Generate placeholder sample images with sharp**

```js
// scripts/make-sample-images.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
const targets = [
  ["src/content/projects/_sample-passivhaus-office", ["hero", "01", "02"], "#5c618c"],
  ["src/content/projects/_sample-listed-country-house", ["hero", "01", "02"], "#4f5387"],
  ["src/content/news/_sample-waverley-award", ["hero"], "#7378d3"],
  ["src/content/news/_sample-passivhaus-approach", ["hero"], "#363636"],
];
for (const [dir, names, color] of targets) {
  await mkdir(dir, { recursive: true });
  for (const n of names) {
    await sharp({ create: { width: 1600, height: 1200, channels: 3, background: color } })
      .jpeg({ quality: 80 }).toFile(`${dir}/${n}.jpg`);
  }
}
console.log("sample images written");
```

Run: `node scripts/make-sample-images.mjs` → expect `sample images written`.

- [ ] **Step 3: Write the four sample markdown files**

`src/content/projects/_sample-passivhaus-office/index.md`:

```markdown
---
title: "Near Passivhaus Office Extension, Fernhurst"
sector: "Extensions"
location: "Fernhurst, West Sussex"
status: "Completed"
year: 2020
features: ["Fabric-first", "Near-Passivhaus", "Triple glazing"]
heroImage: "./hero.jpg"
gallery: ["./01.jpg", "./02.jpg"]
excerpt: "A near-Passivhaus single-storey office extension completing a contemporary family home."
featured: true
draft: false
---

This 1960s family home was remodelled by ArchitectureLIVE, transforming it into a contemporary
home with a double-height open-plan kitchen, gallery study and a near-Passivhaus office extension.
```

Create the other three analogously (sector `New Build` for the listed country house sample; news samples use `category: "Awards"` and `"Insight"`, `date` values, and a `heroImage: "./hero.jpg"`). Keep bodies short.

- [ ] **Step 4: Create a throwaway page to exercise the collections**

`getCollection` only runs inside Astro, so assert via a build. Create a scratch page `src/pages/_collcheck.astro`:

```astro
---
import { getCollection } from "astro:content";
const projects = await getCollection("projects");
const news = await getCollection("news");
---
<p data-projects={projects.length} data-news={news.length}>ok</p>
```

- [ ] **Step 5: Type-check and build, assert counts**

```bash
npm run check
npm run build
grep -q 'data-projects="2"' dist/_collcheck/index.html && echo "PROJECTS OK"
grep -q 'data-news="2"' dist/_collcheck/index.html && echo "NEWS OK"
```

Expected: `astro check` passes (schemas valid, images resolve); `PROJECTS OK`; `NEWS OK`. Then delete the scratch page: `rm src/pages/_collcheck.astro`.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: define projects/news content collections + sample entries"
```

---

### Task 5: Port the surface components

**Files:**
- Create: `src/components/ui/ProjectCard.astro`, `ProjectTile.astro`, `NewsCard.astro`, `TeamCard.astro`, `Tag.astro`, `Pagination.astro`
- Reference (DesignSync): `components/surfaces/{ProjectCard,ProjectTile,NewsCard,TeamCard,Tag}.jsx`, `components/navigation/Pagination.jsx`

**Interfaces:**
- Produces (props chosen to consume collection data + `astro:assets`):
  - `ProjectCard.astro`: `{ href: string, title: string, sector: string, meta: string, image: ImageMetadata, ratio?: string }` — image rendered with `<Image>`; hover-reveal per design.
  - `NewsCard.astro`: `{ href, title, date: Date, category: string, excerpt: string, image: ImageMetadata }`.
  - `TeamCard.astro`: `{ name, role, bio, image?: ImageMetadata }`.
  - `Tag.astro`: `{ label: string, active?: boolean }`.
  - `Pagination.astro`: `{ currentPage: number, lastPage: number, urlPrev?: string, urlNext?: string, base: string }`.
- Consumes: `astro:assets` `<Image>`, collection `ImageMetadata`.

- [ ] **Step 1: Port each component**

For each, DesignSync `get_file` the `.jsx`, then create the `.astro` applying the port conversion rules. Where the prototype used a coloured `<Placeholder>` box for imagery, replace with:

```astro
---
import { Image } from "astro:assets";
interface Props { href: string; title: string; sector: string; meta: string; image: ImageMetadata; ratio?: string; }
const { href, title, sector, meta, image, ratio = "4 / 3" } = Astro.props;
---
<a href={href} class="project-card" style="...">
  <div style={`aspect-ratio:${ratio};overflow:hidden;`}>
    <Image src={image} alt={title} widths={[400, 800, 1200]} sizes="(max-width: 700px) 100vw, 33vw" style="width:100%;height:100%;object-fit:cover;" />
  </div>
  <!-- title / sector tag / meta markup copied from ProjectCard.jsx -->
</a>
```

Keep all spacing, colour, typography inline styles identical to the source. Convert JS hover handlers to scoped `<style>` `:hover` rules.

- [ ] **Step 2: Visual smoke test via a scratch page**

Create `src/pages/_uicheck.astro` importing one sample project + one sample news entry and rendering `ProjectCard`, `NewsCard`, `TeamCard`, `Tag`, `Pagination` once each. Build and assert they render:

```bash
npm run build
grep -q "project-card" dist/_uicheck/index.html && echo "CARDS OK"
```

Expected: `CARDS OK`. Remove the scratch page afterwards: `rm src/pages/_uicheck.astro`.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: port surface components (cards, tag, pagination)"
```

---

### Task 6: Home page

**Files:**
- Create/Modify: `src/pages/index.astro`
- Reference (DesignSync): `ui_kits/website/Home.jsx`, `ui_kits/website/Shell.jsx` (for `Section`/`Container`/`SectionHead` helpers + `SECTOR_CARDS`)

**Interfaces:**
- Consumes: `PageShell`, `ProjectCard`, `NewsCard`, collections `projects`/`news`.

- [ ] **Step 1: Port the layout helpers**

`Shell.jsx` defines `Container`, `Section`, `SectionHead`. Create `src/components/ui/Section.astro`, `Container.astro`, `SectionHead.astro` reproducing them (they are small; copy markup/styles exactly).

- [ ] **Step 2: Build the home page from real collection data**

```astro
---
import PageShell from "../layouts/PageShell.astro";
import Section from "../components/ui/Section.astro";
import Container from "../components/ui/Container.astro";
import SectionHead from "../components/ui/SectionHead.astro";
import ProjectCard from "../components/ui/ProjectCard.astro";
import NewsCard from "../components/ui/NewsCard.astro";
import { getCollection } from "astro:content";

const projects = (await getCollection("projects", (p) => !p.data.draft));
const featured = projects.filter((p) => p.data.featured).slice(0, 6);
const featuredOrFallback = featured.length ? featured : projects.slice(0, 6);
const latestNews = (await getCollection("news", (n) => !n.data.draft))
  .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf()).slice(0, 3);
---
<PageShell title="ArchitectureLIVE — Contemporary architecture for sustainable living" active="home">
  <!-- Hero, Featured projects, What we do (SECTOR_CARDS), Approach, Latest news -->
  <!-- Port each <Section> from Home.jsx; replace placeholder PROJECTS/NEWS with the arrays above -->
</PageShell>
```

Reproduce each `Home.jsx` section. For featured projects map `featuredOrFallback` → `ProjectCard` (`href={`/projects/${p.id}`}`, `image={p.data.heroImage}`, `sector={p.data.sector}`, `meta={`${p.data.location} · ${p.data.status}`}`). For latest news map → `NewsCard`.

- [ ] **Step 3: Build and assert**

```bash
npm run build
grep -q "Near Passivhaus Office Extension, Fernhurst" dist/index.html && echo "HOME PROJECTS OK"
```

Expected: `HOME PROJECTS OK` (the featured sample appears).

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: home page wired to projects/news collections"
```

---

### Task 7: Projects index with sector filter

**Files:**
- Create: `src/pages/projects/index.astro`, `src/scripts/sector-filter.ts`
- Reference (DesignSync): `ui_kits/website/Projects.jsx`

**Interfaces:**
- Consumes: `PageShell`, `ProjectCard`, `Tag`, collection `projects`.

- [ ] **Step 1: Render all projects with sector tags as filter controls**

```astro
---
import PageShell from "../../layouts/PageShell.astro";
import ProjectCard from "../../components/ui/ProjectCard.astro";
import { getCollection } from "astro:content";
const projects = (await getCollection("projects", (p) => !p.data.draft))
  .sort((a, b) => (b.data.year ?? 0) - (a.data.year ?? 0));
const sectors = ["All", "Extensions", "New Build", "Education", "Commercial"];
---
<PageShell title="Projects — ArchitectureLIVE" active="projects">
  <!-- intro + segmented filter (buttons with data-sector) ported from Projects.jsx -->
  <div class="project-grid">
    {projects.map((p) => (
      <div data-sector={p.data.sector}>
        <ProjectCard href={`/projects/${p.id}`} title={p.data.title} sector={p.data.sector}
          meta={`${p.data.location} · ${p.data.status}`} image={p.data.heroImage} />
      </div>
    ))}
  </div>
</PageShell>
<script src="../../scripts/sector-filter.ts"></script>
```

- [ ] **Step 2: Write the filter script (progressive enhancement, no framework)**

```ts
// src/scripts/sector-filter.ts
const buttons = document.querySelectorAll<HTMLButtonElement>("[data-filter]");
const items = document.querySelectorAll<HTMLElement>("[data-sector]");
buttons.forEach((btn) =>
  btn.addEventListener("click", () => {
    const sel = btn.dataset.filter!;
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    items.forEach((it) => {
      it.style.display = sel === "All" || it.dataset.sector === sel ? "" : "none";
    });
  })
);
```

- [ ] **Step 3: Build and assert**

```bash
npm run build
grep -q 'data-sector="Extensions"' dist/projects/index.html && echo "FILTER MARKUP OK"
```

Expected: `FILTER MARKUP OK`.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: projects index with client-side sector filter"
```

---

### Task 8: Project detail page (hero, facts, gallery, prev/next)

**Files:**
- Create: `src/pages/projects/[slug].astro`, `src/lib/adjacent.mjs`
- Test: `src/lib/adjacent.test.mjs` (plain JS so `node --test` runs on any Node version)
- Reference (DesignSync): `ui_kits/website/ProjectDetail.jsx`

**Interfaces:**
- Produces: `getStaticPaths` over `projects`; `adjacent(list, id)` → `{ prev, next }` helper.
- Consumes: `PageShell`, `astro:assets` `<Image>`.

- [ ] **Step 1: Write the failing test for the prev/next helper**

```js
// src/lib/adjacent.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { adjacent } from "./adjacent.mjs";
test("adjacent returns wrapped neighbours", () => {
  const ids = ["a", "b", "c"];
  assert.deepEqual(adjacent(ids, "b"), { prev: "a", next: "c" });
  assert.deepEqual(adjacent(ids, "a"), { prev: "c", next: "b" });
  assert.deepEqual(adjacent(ids, "c"), { prev: "b", next: "a" });
});
```

- [ ] **Step 2: Run it, expect failure**

Run: `node --test src/lib/adjacent.test.mjs`
Expected: FAIL — `Cannot find module './adjacent.mjs'`.

- [ ] **Step 3: Implement `adjacent.ts`**

```js
// src/lib/adjacent.mjs
export function adjacent(items, current) {
  const i = items.indexOf(current);
  const n = items.length;
  return { prev: items[(i - 1 + n) % n], next: items[(i + 1) % n] };
}
```

- [ ] **Step 4: Run the test, expect pass**

Run: `node --test src/lib/adjacent.test.mjs`
Expected: PASS (1 test).

- [ ] **Step 5: Build the detail page**

```astro
---
import PageShell from "../../layouts/PageShell.astro";
import { Image } from "astro:assets";
import { getCollection, render } from "astro:content";
import { adjacent } from "../../lib/adjacent.mjs";

export async function getStaticPaths() {
  const projects = (await getCollection("projects", (p) => !p.data.draft))
    .sort((a, b) => (b.data.year ?? 0) - (a.data.year ?? 0));
  const ids = projects.map((p) => p.id);
  return projects.map((project) => {
    const { prev, next } = adjacent(ids, project.id);
    return { params: { slug: project.id }, props: { project, prev, next } };
  });
}
const { project, prev, next } = Astro.props;
const { Content } = await render(project);  // Astro 5 content-layer render API
---
<PageShell title={`${project.data.title} — ArchitectureLIVE`} description={project.data.excerpt} active="projects">
  <!-- full-bleed hero <Image src={project.data.heroImage}>; facts block (location/sector/status/year/features);
       narrative <Content/>; gallery grid of project.data.gallery via <Image>; prev/next links to /projects/{prev|next} -->
</PageShell>
```

Port the visual structure from `ProjectDetail.jsx`. Render gallery images with `<Image src={img} widths={[600,1200,2000]} sizes="(max-width:800px) 100vw, 50vw" />`.

- [ ] **Step 6: Build and assert images optimized**

```bash
npm run build
test -d dist/_astro && ls dist/_astro/*.webp >/dev/null 2>&1 && echo "OPTIMIZED IMAGES OK"
test -f dist/projects/_sample-passivhaus-office/index.html && echo "DETAIL PAGE OK"
```

Expected: `OPTIMIZED IMAGES OK` and `DETAIL PAGE OK`.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: project detail page with gallery + prev/next"
```

---

### Task 9: News index with pagination

**Files:**
- Create: `src/pages/news/index.astro` (page 1), `src/pages/news/page/[page].astro` (pages 2+)
- Reference (DesignSync): `ui_kits/website/News.jsx`

**Interfaces:**
- Consumes: `PageShell`, `NewsCard`, `Pagination`, collection `news`, Astro `paginate()`.

> **Routing rationale:** articles live at `/news/<slug>` (Task 10). Pagination is nested under
> `/news/page/N` so a numbered page can never collide with an article slug. Page 1 is a dedicated
> `news/index.astro`; pages 2+ come from `news/page/[page].astro`. A shared `pageSize = 9`.

- [ ] **Step 1: Page 1 at `src/pages/news/index.astro`**

```astro
---
import PageShell from "../../layouts/PageShell.astro";
import NewsCard from "../../components/ui/NewsCard.astro";
import Pagination from "../../components/ui/Pagination.astro";
import { getCollection } from "astro:content";

const PAGE_SIZE = 9;
const posts = (await getCollection("news", (n) => !n.data.draft))
  .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
const pageItems = posts.slice(0, PAGE_SIZE);
const lastPage = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
---
<PageShell title="News — ArchitectureLIVE" active="news">
  <!-- intro ported from News.jsx -->
  <div class="news-grid">
    {pageItems.map((post) => (
      <NewsCard href={`/news/${post.id}`} title={post.data.title} date={post.data.date}
        category={post.data.category} excerpt={post.data.excerpt} image={post.data.heroImage} />
    ))}
  </div>
  <Pagination currentPage={1} lastPage={lastPage}
    urlPrev={undefined} urlNext={lastPage > 1 ? "/news/page/2" : undefined} base="/news" />
</PageShell>
```

- [ ] **Step 2: Pages 2+ at `src/pages/news/page/[page].astro`**

```astro
---
import PageShell from "../../../layouts/PageShell.astro";
import NewsCard from "../../../components/ui/NewsCard.astro";
import Pagination from "../../../components/ui/Pagination.astro";
import { getCollection } from "astro:content";

export async function getStaticPaths({ paginate }) {
  const posts = (await getCollection("news", (n) => !n.data.draft))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  // paginate() yields pages 1..N; emit only 2..N here (page 1 is news/index.astro).
  return paginate(posts, { pageSize: 9 }).filter((p) => p.params.page !== "1" && p.params.page !== undefined);
}
const { page } = Astro.props;
// page-1 link should point to /news, not /news/page/1
const prevUrl = page.currentPage === 2 ? "/news" : page.url.prev;
---
<PageShell title={`News — ArchitectureLIVE (page ${page.currentPage})`} active="news">
  <div class="news-grid">
    {page.data.map((post) => (
      <NewsCard href={`/news/${post.id}`} title={post.data.title} date={post.data.date}
        category={post.data.category} excerpt={post.data.excerpt} image={post.data.heroImage} />
    ))}
  </div>
  <Pagination currentPage={page.currentPage} lastPage={page.lastPage}
    urlPrev={prevUrl} urlNext={page.url.next} base="/news/page" />
</PageShell>
```

> With Astro's `paginate`, `/news/page/[page]` produces `params.page` `"1".."N"`; the `.filter` drops
> page 1 (and any `undefined` first-page param) so it's served only by `news/index.astro`.

- [ ] **Step 3: Build and assert**

```bash
npm run build
test -f dist/news/index.html && grep -q "news-grid" dist/news/index.html && echo "NEWS INDEX OK"
```

Expected: `NEWS INDEX OK`. (With only 2 sample posts there is a single page, so `/news/page/2`
is not emitted yet — Plan 2's 112 posts will populate pages 2+.)

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: news index (page 1 + /news/page/N pagination)"
```

---

### Task 10: News article page

**Files:**
- Create: `src/pages/news/[slug].astro`
- Reference (DesignSync): `ui_kits/website/NewsArticle.jsx`

**Interfaces:**
- Consumes: `PageShell`, `astro:assets`, collection `news`.

> Routing is already collision-free from Task 9: articles are single-segment `/news/<slug>`,
> pagination is two-segment `/news/page/N`. No reconciliation needed.

- [ ] **Step 1: Article page with rendered Markdown body**

```astro
---
import PageShell from "../../layouts/PageShell.astro";
import { Image } from "astro:assets";
import { getCollection, render } from "astro:content";
export async function getStaticPaths() {
  const posts = await getCollection("news", (n) => !n.data.draft);
  return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
}
const { post } = Astro.props;
const { Content } = await render(post);  // Astro 5 content-layer render API
const dateStr = post.data.date.toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });
---
<PageShell title={`${post.data.title} — ArchitectureLIVE`} description={post.data.excerpt} active="news">
  <!-- title, category, dateStr, hero <Image>, then <article><Content/></article> styled per NewsArticle.jsx -->
</PageShell>
```

- [ ] **Step 2: Build and assert**

```bash
npm run build
test -f dist/news/_sample-waverley-award/index.html && echo "ARTICLE OK"
```

Expected: `ARTICLE OK`.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: news article page"
```

---

### Task 11: About / Studio page with team

**Files:**
- Create: `src/pages/about.astro`, `src/content/team/` data (inline or a small `team.ts`), `src/assets/team/` (placeholder portraits via the sample-image script)
- Reference (DesignSync): `ui_kits/website/About.jsx`, `components/surfaces/TeamCard.jsx`

**Interfaces:**
- Consumes: `PageShell`, `TeamCard`.

- [ ] **Step 1: Define team data**

```ts
// src/lib/team.ts
import jonathan from "../assets/team/jonathan.jpg";
import irene from "../assets/team/irene.jpg";
export const team = [
  { name: "Jonathan Gratton", role: "Principal Architect", bio: "Founder of ArchitectureLIVE…", image: jonathan },
  { name: "Irene Konschill", role: "Architect", bio: "Strengthening the residential team…", image: irene },
];
```

Generate placeholder portraits by extending `scripts/make-sample-images.mjs` (or a one-off) to write `src/assets/team/jonathan.jpg` and `irene.jpg` (e.g. 800×1000). Real bios/photos are added later.

- [ ] **Step 2: Build the page**

Port `About.jsx`: practice story, approach-to-sustainability section (leaf-texture backdrop motif), process (concept → planning → completion), then team grid mapping `team` → `TeamCard`.

- [ ] **Step 3: Build and assert**

```bash
npm run build
grep -q "Jonathan Gratton" dist/about/index.html && grep -q "Irene Konschill" dist/about/index.html && echo "TEAM OK"
```

Expected: `TEAM OK`.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: about/studio page with team profiles"
```

---

### Task 12: Contact page (no form)

**Files:**
- Create: `src/pages/contact.astro`
- Reference (DesignSync): `ui_kits/website/Contact.jsx`

**Interfaces:**
- Consumes: `PageShell`.

- [ ] **Step 1: Build the contact page with real details and links**

Port `Contact.jsx` **but remove the enquiry form entirely** (per the locked decision). Replace the form column with prominent contact actions:

```astro
<a href="tel:+441428652018" style="...">+44 1428 652 018</a>
<a href="mailto:info@architecturelive.co.uk" style="...">info@architecturelive.co.uk</a>
<address style="font-style:normal;">
  ArchitectureLIVE<br />Tall Trees, The Cylinders<br />Fernhurst, Haslemere<br />Surrey GU27 3EL
</address>
```

Include a static map: an OpenStreetMap `<iframe>` (no API key, GU27 3EL) or a linked static image — keep it lightweight and lazy-loaded (`loading="lazy"`). Keep the social links from the design.

- [ ] **Step 2: Build and assert no form, real links present**

```bash
npm run build
grep -q "tel:+441428652018" dist/contact/index.html && echo "PHONE OK"
grep -q "mailto:info@architecturelive.co.uk" dist/contact/index.html && echo "EMAIL OK"
! grep -qi "<form" dist/contact/index.html && echo "NO FORM OK"
```

Expected: `PHONE OK`, `EMAIL OK`, `NO FORM OK`.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: contact page with email/phone/address links (no form)"
```

---

### Task 13: SEO essentials — RSS, robots, 404

**Files:**
- Create: `src/pages/rss.xml.ts`, `public/robots.txt`, `src/pages/404.astro`
- Modify: `src/components/BaseHead.astro` (RSS `<link>`)
- (`@astrojs/sitemap` from Task 1 already emits `/sitemap-index.xml`.)

**Interfaces:**
- Consumes: collection `news`, `@astrojs/rss`.

- [ ] **Step 1: News RSS feed**

```ts
// src/pages/rss.xml.ts
import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
export async function GET(context) {
  const posts = (await getCollection("news", (n) => !n.data.draft))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  return rss({
    title: "ArchitectureLIVE — News",
    description: "Contemporary Design & Sustainable Living",
    site: context.site,
    items: posts.map((p) => ({
      title: p.data.title, description: p.data.excerpt,
      pubDate: p.data.date, link: `/news/${p.id}/`,
    })),
  });
}
```

- [ ] **Step 2: robots.txt**

```text
User-agent: *
Allow: /
Sitemap: https://architecturelive.co.uk/sitemap-index.xml
```

- [ ] **Step 3: 404 page**

Create `src/pages/404.astro` using `PageShell` (`cta={false}`) with a short "page not found" message and links to Home/Projects.

- [ ] **Step 4: Add RSS discovery link to `BaseHead.astro`**

Add inside the head meta:
```astro
<link rel="alternate" type="application/rss+xml" title="ArchitectureLIVE — News" href="/rss.xml" />
```

- [ ] **Step 5: Build and assert**

```bash
npm run build
test -f dist/rss.xml && grep -q "ArchitectureLIVE — News" dist/rss.xml && echo "RSS OK"
test -f dist/sitemap-index.xml && echo "SITEMAP OK"
test -f dist/404.html && echo "404 OK"
test -f dist/robots.txt && echo "ROBOTS OK"
```

Expected: `RSS OK`, `SITEMAP OK`, `404 OK`, `ROBOTS OK`.

- [ ] **Step 6: Final type-check, build, commit**

```bash
npm run check && npm run build
git add -A && git commit -m "feat: SEO essentials (rss, sitemap link, robots, 404)"
```

---

## Definition of done (Plan 1)

- `npm run check` and `npm run build` both pass.
- Home, `/projects` (with working filter), `/projects/<slug>` (gallery + prev/next), `/news` (paginated), `/news/<slug>`, `/about` (team), `/contact` (links, no form) all render from collections.
- Imagery is optimized by `astro:assets` (WebP/AVIF derivatives in `dist/_astro`).
- `sitemap-index.xml`, `rss.xml`, `robots.txt`, `404.html` emitted.
- Two sample projects + two sample news entries drive the site; **all `_sample-*` content is deleted and replaced by Plan 2.**

## Hand-off to Plan 2

Plan 2 (content migration) writes real entries into `src/content/projects/<slug>/` and
`src/content/news/<slug>/` **matching the schema in `src/content.config.ts`**, generates the
Cloudflare `_redirects` file, and removes the `_sample-*` seed entries. No schema changes should
be needed; if Plan 2 finds a required field the schema lacks, update `content.config.ts` and this plan's Task 4 together.
