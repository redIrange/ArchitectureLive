# ArchitectureLIVE Six Tweaks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply six targeted tweaks to the ArchitectureLIVE Astro site covering header cleanup, map fix, location-only card labels, static images, and a hero cross-fade slideshow.

**Architecture:** All changes are contained to four source files — SiteHeader.astro, contact.astro, ProjectCard.astro, projects/index.astro, and index.astro. No new dependencies; slideshow uses a vanilla `<script>` block. Static build must produce exactly 162 pages with 0 astro-check errors.

**Tech Stack:** Astro 5, astro:assets Image, vanilla TypeScript scripts, CSS custom properties (design tokens only).

## Global Constraints

- Use existing design tokens only (`--space-*`, `--color-*`, `--font-*`, `--type-*`, etc.) — no raw hex/px values not already in the file.
- Site must remain 100% static — vanilla `<script>` only, no framework JS.
- `npm run check` must produce 0 errors; `npm run build` must produce exactly 162 pages.
- Each page must have exactly one `<h1>`.
- Working directory: `/Users/oscar/Documents/Old/01_Oscar/06_Home/04_Programming/Websites/ArchitectureLive`
- Branch: main

---

## File Map

| File | Change |
|------|--------|
| `src/components/ui/SiteHeader.astro` | Remove contact strip + CTA (CHANGE 1) |
| `src/pages/contact.astro` | Fix map coordinates (CHANGE 2) |
| `src/components/ui/ProjectCard.astro` | Add `label?` prop for visible caption (CHANGE 3) |
| `src/pages/projects/index.astro` | Pass `label={p.data.location}` (CHANGE 3) |
| `src/pages/index.astro` | Location captions (CHANGE 3) + static images (CHANGE 4) + slideshow (CHANGE 5) |

---

### Task 1: Remove header contact strip and "Start your project" CTA

**Files:**
- Modify: `src/components/ui/SiteHeader.astro`

**What to remove:**
1. The entire `al-topbar` div (lines 111–127) — the phone + email strip.
2. The `al-header-cta` link inside desktop nav (lines 83–91) — "Start your project".
3. The "Start your project" link inside the mobile drawer (line 149–151).
4. Update the drawer `top` offset: change `calc(var(--header-height) + 37px)` to `var(--header-height)` (since topbar is gone).
5. Remove the `.al-topbar { display: none; }` media query rule — the element no longer exists.

- [ ] **Step 1: Edit SiteHeader.astro — remove al-topbar block**

Remove this block (between the closing `</div>` of the main bar and the mobile drawer):
```html
  {/* ── Contact strip — phone · email ── */}
  <div class="al-topbar" style="border-top:var(--border-hairline);">
    <div style="width:100%;max-width:var(--content-max);margin:0 auto;padding:9px var(--space-xl);display:flex;align-items:center;justify-content:flex-end;gap:var(--space-md);">
      <a
        href="tel:+441428652018"
        style="font-family:var(--font-text);font-size:var(--type-caption-size);font-weight:500;color:var(--color-charcoal);text-decoration:none;letter-spacing:0.2px;"
      >
        +44 1428 652 018
      </a>
      <span style="color:var(--color-hairline);" aria-hidden="true">·</span>
      <a
        href="mailto:info@architecturelive.co.uk"
        style="font-family:var(--font-text);font-size:var(--type-caption-size);color:var(--color-grey-light);text-decoration:none;"
      >
        info@architecturelive.co.uk
      </a>
    </div>
  </div>
```

- [ ] **Step 2: Remove desktop CTA link**

Remove these lines from inside the `<nav class="al-nav-links">`:
```html
      {/* CTA — separate from nav links per original design */}
      <a
        href="/contact"
        class="al-header-cta al-nav-link"
        style="font-weight:600;--link-base:var(--color-indigo-deep);"
      >
        Start your project
      </a>
```

- [ ] **Step 3: Remove mobile drawer "Start your project" link**

Remove from inside `<nav id="al-nav-drawer">`:
```html
    <a href="/contact" class="al-drawer-link" style="font-weight:600;color:var(--color-indigo-deep);">
      Start your project
    </a>
```

- [ ] **Step 4: Fix mobile drawer top offset**

In `<style>`, in `.al-nav-drawer`, change:
```css
    top: calc(var(--header-height) + 37px); /* below header + topbar */
```
to:
```css
    top: var(--header-height);
```

- [ ] **Step 5: Remove now-unused .al-topbar media query rule**

In `<style>`, remove:
```css
    .al-topbar {
      display: none;
    }
```

- [ ] **Step 6: Run astro check**

```bash
cd /Users/oscar/Documents/Old/01_Oscar/06_Home/04_Programming/Websites/ArchitectureLive && npm run check
```
Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/SiteHeader.astro
git commit -m "fix(header): remove contact strip and Start-your-project CTA"
```

---

### Task 2: Fix contact page map coordinates

**Files:**
- Modify: `src/pages/contact.astro`

**What to change:** The OSM iframe src and the "View larger map" link href.

- [ ] **Step 1: Replace iframe src**

Change:
```
src="https://www.openstreetmap.org/export/embed.html?bbox=-0.7700%2C51.0300%2C-0.6600%2C51.0800&layer=mapnik&marker=51.0520%2C-0.7145"
```
to:
```
src="https://www.openstreetmap.org/export/embed.html?bbox=-0.7343%2C51.0420%2C-0.7143%2C51.0520&layer=mapnik&marker=51.04695%2C-0.72434"
```

- [ ] **Step 2: Replace "View larger map" link href**

Change:
```
href="https://www.openstreetmap.org/?mlat=51.0520&mlon=-0.7145#map=14/51.0520/-0.7145"
```
to:
```
href="https://www.openstreetmap.org/?mlat=51.04695&mlon=-0.72434#map=15/51.04695/-0.72434"
```

- [ ] **Step 3: Run check and commit**

```bash
cd /Users/oscar/Documents/Old/01_Oscar/06_Home/04_Programming/Websites/ArchitectureLive && npm run check
git add src/pages/contact.astro
git commit -m "fix(contact): correct map marker to GU27 3EL (lat 51.04695, lon -0.72434)"
```

---

### Task 3: Location-only card names (projects index + home stacked bands)

**Files:**
- Modify: `src/components/ui/ProjectCard.astro`
- Modify: `src/pages/projects/index.astro`
- Modify: `src/pages/index.astro`

**What to change:**
- ProjectCard: add `label?: string` prop; use `{label ?? title}` for the visible caption only.
- projects/index.astro: pass `label={p.data.location}` to each `<ProjectCard variant="reveal">`.
- index.astro: in the stacked bands, change `caption__name` from `{p.data.title}` to `{p.data.location}`, and remove the `caption__meta` paragraph.

- [ ] **Step 1: Edit ProjectCard.astro — add label prop**

In the Props interface, add `label?: string`:
```ts
interface Props {
  href: string;
  title: string;
  sector: string;
  meta: string;
  image: ImageMetadata;
  ratio?: string;
  variant?: "default" | "reveal";
  label?: string;
}
```

In the destructure line, add `label`:
```ts
const { href, title, sector, meta, image, ratio = "4 / 3", variant = "default", label } = Astro.props;
```

In the reveal variant JSX, change the caption div from `{title}` to `{label ?? title}`:
```html
      <div class="al-reveal-caption">{label ?? title}</div>
```
Keep `alt={title}` and `aria-label={title}` unchanged.

- [ ] **Step 2: Edit projects/index.astro — pass label**

In the `<ProjectCard>` call inside the project grid, add `label={p.data.location}`:
```html
            <ProjectCard
              variant="reveal"
              href={`/projects/${p.id}`}
              title={p.data.title}
              sector={p.data.sector}
              meta={`${p.data.location} · ${p.data.status}`}
              image={p.data.heroImage}
              label={p.data.location}
            />
```

- [ ] **Step 3: Edit index.astro — location-only caption in stacked bands**

Change the caption block from:
```html
        <div class="caption">
          <h2 class="caption__name">{p.data.title}</h2>
          {(p.data.sector || p.data.location) && (
            <p class="caption__meta">{p.data.sector} · {p.data.location}</p>
          )}
        </div>
```
to:
```html
        <div class="caption">
          <h2 class="caption__name">{p.data.location}</h2>
        </div>
```

Also remove the `.caption__meta` CSS rule from `<style>` since it is no longer used.

- [ ] **Step 4: Run check**

```bash
cd /Users/oscar/Documents/Old/01_Oscar/06_Home/04_Programming/Websites/ArchitectureLive && npm run check
```
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/ProjectCard.astro src/pages/projects/index.astro src/pages/index.astro
git commit -m "feat(cards): show location-only names on project cards and home stacked bands"
```

---

### Task 4 + 5: Static images + rotating hero slideshow (index.astro)

These two changes are in index.astro and are tightly coupled (CHANGE 4 removes hover zoom; CHANGE 5 adds the slideshow, which also must not have hover zoom). Handle together.

**Files:**
- Modify: `src/pages/index.astro`

**CHANGE 4 — remove hover zoom on home page images:**
- Remove `.project-band:hover .project-band__image { transform: scale(1.03); }` CSS rule.
- Remove `transition: transform var(--duration-slow) var(--ease-out);` from `.project-band__image`.
- The hero image zoom was never CSS-hover-driven (no existing `:hover` rule on `.hero__image`), so no change needed there — but the new slideshow images also must not have any hover zoom.

**CHANGE 5 — rotating hero slideshow:**

Current frontmatter:
```ts
const projects = await getCollection("projects", (p) => !p.data.draft);
const featured = projects.filter((p) => p.data.featured).slice(0, 5);
const featuredOrFallback = featured.length ? featured : projects.slice(0, 5);
const latestNews = ...;
const heroProject = featuredOrFallback[0];
```

Replace with:
```ts
const projects = (await getCollection("projects", (p) => !p.data.draft))
  .sort((a, b) => (b.data.year ?? 0) - (a.data.year ?? 0));
const featured = projects.filter((p) => p.data.featured);
const featuredOrFallback = featured.length ? featured : projects.slice(0, 5);

// Build exactly 5 hero images: featured first, then fill from non-featured
const slideshowProjects: typeof projects = [...featured.slice(0, 5)];
if (slideshowProjects.length < 5) {
  const usedIds = new Set(slideshowProjects.map((p) => p.id));
  const fillers = projects.filter((p) => !usedIds.has(p.id));
  slideshowProjects.push(...fillers.slice(0, 5 - slideshowProjects.length));
}
const latestNews = ...;
```

Remove `const heroProject = featuredOrFallback[0];` (no longer needed).

**Hero section HTML** — replace the single `<Image>` with 5 stacked images:
```html
  <section class="hero">
    {slideshowProjects.map((p, i) => p.data.heroImage && (
      <Image
        src={p.data.heroImage}
        alt={p.data.location ?? p.data.title}
        widths={[800, 1200, 1920, 2560]}
        sizes="100vw"
        class={`hero__image${i === 0 ? " is-active" : ""}`}
        loading={i === 0 ? "eager" : "lazy"}
        fetchpriority={i === 0 ? "high" : undefined}
      />
    ))}
  </section>
```

**Hero CSS** — update `.hero` to `position: relative` and `.hero__image` to absolute stack with opacity cross-fade:
```css
.hero {
  margin-top: calc(-1 * var(--header-height));
  height: 94vh;
  overflow: hidden;
  position: relative;
}
.hero__image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  opacity: 0;
  transition: opacity 800ms ease;
}
.hero__image.is-active {
  opacity: 1;
}
```

No `.hero__image:hover` rule (CHANGE 4).

**Slideshow script** — add a `<script>` after the closing `</PageShell>` tag:
```html
<script>
(function () {
  const imgs = /** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll('.hero__image'));
  if (imgs.length < 2) return;
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mq.matches) return;
  let current = 0;
  setInterval(function () {
    imgs[current].classList.remove('is-active');
    current = (current + 1) % imgs.length;
    imgs[current].classList.add('is-active');
  }, 5000);
})();
</script>
```

**Remove `.caption__meta` CSS** (already planned in Task 3, but confirm it is gone).

- [ ] **Step 1: Edit index.astro frontmatter — build slideshowProjects**

Replace the collection query block. Exact new frontmatter:
```ts
---
/**
 * Home page — ArchitectureLIVE
 * Re-port of Home.jsx (ui_kits/website/Home.jsx) — design-refresh branch.
 * Sections: Hero (rotating slideshow) · Intro h1 · Selected work (stacked) · Approach · Latest news.
 */
import { Image } from "astro:assets";
import { getCollection } from "astro:content";
import PageShell from "../layouts/PageShell.astro";
import Section from "../components/ui/Section.astro";
import Container from "../components/ui/Container.astro";
import SectionHead from "../components/ui/SectionHead.astro";
import NewsCard from "../components/ui/NewsCard.astro";
import TextLink from "../components/ui/TextLink.astro";

/* ── Collection queries ── */
const projects = (await getCollection("projects", (p) => !p.data.draft))
  .sort((a, b) => (b.data.year ?? 0) - (a.data.year ?? 0));
const featured = projects.filter((p) => p.data.featured);
const featuredOrFallback = featured.length ? featured : projects.slice(0, 5);
const latestNews = (await getCollection("news", (n) => !n.data.draft))
  .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
  .slice(0, 3);

/* ── Slideshow: exactly 5 hero images, featured first ── */
const slideshowProjects: typeof projects = [...featured.slice(0, 5)];
if (slideshowProjects.length < 5) {
  const usedIds = new Set(slideshowProjects.map((p) => p.id));
  const fillers = projects.filter((p) => !usedIds.has(p.id));
  slideshowProjects.push(...fillers.slice(0, 5 - slideshowProjects.length));
}
---
```

- [ ] **Step 2: Edit index.astro — replace hero section HTML**

Replace:
```html
  {/* ── Hero — full-bleed image, no overlay text ──────────────── */}
  <section class="hero">
    {heroProject?.data.heroImage && (
      <Image
        src={heroProject.data.heroImage}
        alt={`${heroProject.data.title} — ${heroProject.data.location}`}
        widths={[800, 1200, 1920, 2560]}
        sizes="100vw"
        class="hero__image"
        loading="eager"
        fetchpriority="high"
      />
    )}
  </section>
```
with:
```html
  {/* ── Hero — rotating cross-fade slideshow, 5 images ─────────── */}
  <section class="hero">
    {slideshowProjects.map((p, i) => p.data.heroImage && (
      <Image
        src={p.data.heroImage}
        alt={p.data.location ?? p.data.title}
        widths={[800, 1200, 1920, 2560]}
        sizes="100vw"
        class={`hero__image${i === 0 ? " is-active" : ""}`}
        loading={i === 0 ? "eager" : "lazy"}
        fetchpriority={i === 0 ? "high" : undefined}
      />
    ))}
  </section>
```

- [ ] **Step 3: Edit index.astro — update hero CSS**

Replace:
```css
/* ── Hero ─────────────────────────────────────────────────── */
.hero {
  margin-top: calc(-1 * var(--header-height));
  height: 94vh;
  overflow: hidden;
}
.hero__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
```
with:
```css
/* ── Hero ─────────────────────────────────────────────────── */
.hero {
  margin-top: calc(-1 * var(--header-height));
  height: 94vh;
  overflow: hidden;
  position: relative;
}
.hero__image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  opacity: 0;
  transition: opacity 800ms ease;
}
.hero__image.is-active {
  opacity: 1;
}
```

- [ ] **Step 4: Edit index.astro — remove hover zoom on stacked band images (CHANGE 4)**

Remove this CSS rule entirely:
```css
.project-band:hover .project-band__image {
  transform: scale(1.03);
}
```

Also remove `transition: transform var(--duration-slow) var(--ease-out);` from `.project-band__image`:
```css
.project-band__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
```

- [ ] **Step 5: Add slideshow script after closing PageShell tag**

After `</PageShell>`, add:
```html
<script>
(function () {
  const imgs = /** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll('.hero__image'));
  if (imgs.length < 2) return;
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mq.matches) return;
  let current = 0;
  setInterval(function () {
    imgs[current].classList.remove('is-active');
    current = (current + 1) % imgs.length;
    imgs[current].classList.add('is-active');
  }, 5000);
})();
</script>
```

- [ ] **Step 6: Run check**

```bash
cd /Users/oscar/Documents/Old/01_Oscar/06_Home/04_Programming/Websites/ArchitectureLive && npm run check
```
Expected: 0 errors.

- [ ] **Step 7: Build**

```bash
cd /Users/oscar/Documents/Old/01_Oscar/06_Home/04_Programming/Websites/ArchitectureLive && npm run build
```
Expected: 162 pages, 0 errors.

- [ ] **Step 8: Verify built output**

```bash
# 1. No phone/email strip
grep -c "1428 652 018" /Users/oscar/Documents/Old/01_Oscar/06_Home/04_Programming/Websites/ArchitectureLive/dist/index.html && echo "FAIL: phone found" || echo "PASS: no phone"
grep -c "Start your project" /Users/oscar/Documents/Old/01_Oscar/06_Home/04_Programming/Websites/ArchitectureLive/dist/index.html && echo "FAIL: CTA found" || echo "PASS: no CTA"
# 2. 5 hero images
grep -o 'hero__image' /Users/oscar/Documents/Old/01_Oscar/06_Home/04_Programming/Websites/ArchitectureLive/dist/index.html | wc -l
# 3. No hover scale in inline CSS
grep "scale" /Users/oscar/Documents/Old/01_Oscar/06_Home/04_Programming/Websites/ArchitectureLive/dist/index.html
# 4. Map marker
grep "marker=51.04695" /Users/oscar/Documents/Old/01_Oscar/06_Home/04_Programming/Websites/ArchitectureLive/dist/contact/index.html
# 5. Location in projects index
grep -o "Chiddingfold, Surrey" /Users/oscar/Documents/Old/01_Oscar/06_Home/04_Programming/Websites/ArchitectureLive/dist/projects/index.html | head -1
# 6. Single h1 on key pages
grep -c "<h1" /Users/oscar/Documents/Old/01_Oscar/06_Home/04_Programming/Websites/ArchitectureLive/dist/index.html
grep -c "<h1" /Users/oscar/Documents/Old/01_Oscar/06_Home/04_Programming/Websites/ArchitectureLive/dist/projects/index.html
grep -c "<h1" /Users/oscar/Documents/Old/01_Oscar/06_Home/04_Programming/Websites/ArchitectureLive/dist/contact/index.html
```

- [ ] **Step 9: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat(home): rotating hero slideshow + static images + location-only band captions"
```

---

### Task 6: Write tweaks report

**Files:**
- Create: `.superpowers/sdd/tweaks-report.md`

- [ ] **Step 1: Write report with all verify results and commit hashes**

The report must contain: status, commit hashes for all 3 commits, verify results (one line each), and any concerns. Under 170 words.
