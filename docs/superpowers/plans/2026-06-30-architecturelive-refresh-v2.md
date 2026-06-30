# ArchitectureLIVE refresh v2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring every page into full fidelity with the latest Claude Design and upscale all site images with a local AI upscaler.

**Architecture:** Static Astro 5 site. Workstream 1 makes surgical edits to existing `.astro` pages/components to close fidelity gaps against the design JSX (the previous port was 90% there). Workstream 2 adds a `scripts/upscale/` Node pipeline that runs Real-ESRGAN (ncnn-vulkan) on every source JPEG, downscales the 4× result to a sane cap, overwrites the source in place, and tracks progress in a hash manifest so it is idempotent.

**Tech Stack:** Astro 5, `astro:assets` (sharp), vanilla CSS with design tokens, Node built-in test runner (`node --test`), Real-ESRGAN `realesrgan-ncnn-vulkan` (Apple-Silicon GPU).

## Global Constraints

Copied verbatim from the spec — every task implicitly includes these:

- **Match the design exactly** in layout, type, spacing, component structure and interaction, except the explicit exceptions below.
- **Exceptions (do NOT "fix" toward the design):** home hero stays a **5-image rotating slideshow**; project captions on home + projects show **location only**; the **header** has **no CTA button and no contact strip**.
- **Real data beats placeholder data** — never overwrite real address/phone/email/images/testimonials/team/content with the design's placeholders.
- **Tokens only.** Spacing scale is `--space-xxs/xs/sm/md/lg/xl/xxl/3xl/section` — there is **no** `--space-2xl` or `--space-4xl`.
- **One `<h1>` per page.** Markdown `<Content/>` needs `:global()` for scoped styles to reach it.
- **No new client-JS frameworks**; keep the site near-zero-JS and static.
- **Buttons/Tags are plain swelling text — no fill, no border, no pill.** The only intentional pill is the Pagination current page.
- **Image pipeline values:** upscale **4×** with `realesrgan-x4plus`, downscale to **2560 px** longest edge, encode **JPEG quality 88 mozjpeg**, overwrite the source, record a SHA-256 in `scripts/upscale/done.json` (idempotent).

**Test command (unit):** `node --test src/lib/*.test.mjs` and `node --test scripts/upscale/*.test.mjs`
**Type/content check:** `npm run check` (expect `0 errors, 0 warnings`)
**Build:** `npm run build` (expect ~162 pages)

---

## Task 1: Home page fidelity (`src/pages/index.astro`)

**Files:**
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `Button` from `src/components/ui/Button.astro` — `Props { href: string; variant?: "primary"|"ghost"|"on-dark"|"subtle"; size?: "small"|"medium"|"large"; class?: string }`, renders plain swelling text.

Four edits: (a) intro → caption style, (b) drop the "Selected work" label row, (c) "View all projects" becomes a Button, (d) add a "Read our story" Button to the Approach section.

- [ ] **Step 1: Add the Button import, drop the TextLink import**

In the frontmatter imports of `src/pages/index.astro`, replace this line:

```astro
import TextLink from "../components/ui/TextLink.astro";
```

with:

```astro
import Button from "../components/ui/Button.astro";
```

(`TextLink` is only used for the View-all link, which is being replaced.)

- [ ] **Step 2: Replace the intro block markup**

Replace this block:

```astro
  {/* ── Intro block — the page's single <h1> ─────────────────── */}
  <Section surface="light" pad="var(--space-xxl)">
    <div class="intro">
      <p class="intro__eyebrow">ArchitectureLIVE — Haslemere, Surrey</p>
      <h1 class="intro__headline">Contemporary architecture for sustainable living</h1>
      <p class="intro__sub">A Surrey practice crafting low-energy homes, schools and spaces — from first sketch through planning to completion.</p>
    </div>
  </Section>
```

with the design's caption-style intro (kept as the page's single `<h1>`):

```astro
  {/* ── Intro block — caption style; the page's single <h1> ──── */}
  <Section surface="light" pad="var(--space-section)">
    <div class="intro">
      <h1 class="intro__title">A Surrey practice crafting low-energy homes, schools and spaces</h1>
      <p class="intro__meta">ArchitectureLIVE · Haslemere, Surrey</p>
    </div>
  </Section>
```

- [ ] **Step 3: Remove the "Selected work" label row**

Replace:

```astro
  <section class="selected-work">
    <div class="selected-work__label-row">
      <p class="selected-work__eyebrow">Selected work</p>
    </div>
```

with:

```astro
  <section class="selected-work">
```

- [ ] **Step 4: Swap the View-all TextLink for a Button**

Replace:

```astro
    <div class="selected-work__cta">
      <TextLink href="/projects" arrow>View all projects</TextLink>
    </div>
```

with:

```astro
    <div class="selected-work__cta">
      <Button href="/projects" variant="primary" size="large">View all projects</Button>
    </div>
```

- [ ] **Step 5: Add the "Read our story" Button to the Approach section**

Replace:

```astro
        <p class="approach__body">
          We design fabric-first, Passivhaus-influenced buildings that are warm, quiet and
          inexpensive to run — and that sit gently in the Surrey, Sussex and Hampshire landscape.
        </p>
      </div>
```

with:

```astro
        <p class="approach__body">
          We design fabric-first, Passivhaus-influenced buildings that are warm, quiet and
          inexpensive to run — and that sit gently in the Surrey, Sussex and Hampshire landscape.
        </p>
        <div class="approach__cta">
          <Button href="/about" variant="primary">Read our story</Button>
        </div>
      </div>
```

- [ ] **Step 6: Update the styles**

In the `<style>` block, replace the three intro rules:

```css
.intro {
  max-width: 34ch;
  margin: 0 auto;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}
.intro__eyebrow {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--type-eyebrow-size);
  font-weight: 600;
  letter-spacing: var(--type-eyebrow-tracking);
  text-transform: uppercase;
  color: var(--color-grey-light);
}
.intro__headline {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--type-display-sm-size);
  font-weight: 400;
  line-height: 1.3;
  letter-spacing: -0.2px;
  color: var(--color-charcoal);
}
.intro__sub {
  margin: 0;
  font-family: var(--font-text);
  font-size: var(--type-body-size);
  line-height: 1.55;
  color: var(--color-grey-mid);
}
```

with:

```css
.intro {
  max-width: 40ch;
  margin: 0 auto;
  text-align: center;
}
.intro__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--type-display-md-size);
  font-weight: 400;
  line-height: 1.1;
  letter-spacing: -0.2px;
  text-transform: uppercase;
  color: var(--color-charcoal);
}
.intro__meta {
  margin: var(--space-md) 0 0;
  font-family: var(--font-text);
  font-size: var(--type-caption-size);
  letter-spacing: 0.4px;
  color: var(--color-grey-light);
}
```

Then delete the now-unused label-row rules:

```css
.selected-work__label-row {
  text-align: center;
  padding: var(--space-xl) 0 var(--space-md);
}
.selected-work__eyebrow {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--type-eyebrow-size);
  font-weight: 600;
  letter-spacing: var(--type-eyebrow-tracking);
  text-transform: uppercase;
  color: var(--color-purple);
}
```

Then simplify `.selected-work__cta` (Button carries its own type styles) — replace:

```css
.selected-work__cta {
  text-align: center;
  padding: var(--space-md) 0 var(--space-section);
  font-family: var(--font-text);
  font-size: var(--type-body-size);
}
```

with:

```css
.selected-work__cta {
  text-align: center;
  padding: var(--space-md) 0 var(--space-section);
}
.approach__cta {
  margin-top: var(--space-xs);
}
```

- [ ] **Step 7: Verify**

Run: `npm run check`
Expected: `0 errors`, `0 warnings`.

Run: `grep -nE "intro__eyebrow|intro__headline|intro__sub|selected-work__label-row|selected-work__eyebrow|TextLink" src/pages/index.astro`
Expected: no matches (all removed).

Run: `npm run build`
Expected: build completes, ~162 pages.

- [ ] **Step 8: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat(home): caption-style intro, button CTAs, drop selected-work label"
```

---

## Task 2: Project detail fidelity (`src/pages/projects/[slug].astro`)

**Files:**
- Modify: `src/pages/projects/[slug].astro`

**Interfaces:**
- Consumes: `Button` from `src/components/ui/Button.astro` (signature as in Task 1).

Three edits: (a) remove the breadcrumb, (b) make the hero a full-bleed 94vh image that slides under the glass header (same treatment as Home/About), (c) replace the filled-pill `.detail-enquire` with a plain `<Button>`.

- [ ] **Step 1: Add the Button import**

In the frontmatter of `src/pages/projects/[slug].astro`, after the `Testimonial` import, add:

```astro
import Button from "../../components/ui/Button.astro";
```

- [ ] **Step 2: Remove the breadcrumb section**

Delete this entire block:

```astro
  {/* ── Breadcrumb ───────────────────────────────────────────── */}
  <Section surface="light" pad="var(--space-lg)">
    <Container>
      <nav class="detail-breadcrumb" aria-label="Breadcrumb">
        <a href="/projects">Projects</a>
        <span aria-hidden="true">/</span>
        <span>{project.data.title}</span>
      </nav>
    </Container>
  </Section>
```

- [ ] **Step 3: Replace the hero with a full-bleed 94vh image**

Replace:

```astro
  {/* ── Hero — full-bleed image ───────────────────────────────── */}
  <div class="detail-hero-wrap">
    <Image
      src={project.data.heroImage}
      alt={project.data.title}
      widths={[800, 1200, 1600, 2400]}
      sizes="100vw"
      class="detail-hero-img"
    />
  </div>
```

with:

```astro
  {/* ── Hero — full-bleed (94vh, slides under the glass header) ─ */}
  <section class="detail-hero" aria-label={project.data.title}>
    <Image
      src={project.data.heroImage}
      alt={project.data.title}
      widths={[800, 1200, 1920, 2560]}
      sizes="100vw"
      class="detail-hero__image"
      loading="eager"
      fetchpriority="high"
    />
  </section>
```

- [ ] **Step 4: Replace the enquire pill with a Button**

Replace:

```astro
        <a href="/contact" class="detail-enquire">Enquire about a project</a>
```

with:

```astro
        <Button href="/contact" variant="primary">Enquire about a project</Button>
```

- [ ] **Step 5: Update styles — hero + remove breadcrumb + remove pill**

In the `<style>` block, delete the breadcrumb rules:

```css
.detail-breadcrumb {
  display: flex;
  gap: 8px;
  align-items: center;
  font-family: var(--font-text);
  font-size: var(--type-caption-size);
  color: var(--color-grey-light);
  padding-top: var(--space-md);
}
.detail-breadcrumb a {
  color: var(--color-indigo-deep);
  text-decoration: none;
}
.detail-breadcrumb a:hover { text-decoration: underline; }
```

Replace the hero rules:

```css
.detail-hero-wrap {
  width: 100%;
  filter: drop-shadow(var(--shadow-image));
}
.detail-hero-img {
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  display: block;
}
```

with:

```css
.detail-hero {
  margin-top: calc(-1 * var(--header-height));
  height: 94vh;
  overflow: hidden;
  background: var(--color-charcoal);
}
.detail-hero__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
```

Delete the pill rules:

```css
.detail-enquire {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 14px 28px;
  border-radius: var(--radius-pill);
  background: var(--color-indigo-vivid);
  color: var(--color-on-primary);
  font-family: var(--font-display);
  font-size: var(--type-button-large-size);
  font-weight: 600;
  text-decoration: none;
  transition: background var(--duration-base) var(--ease-standard);
}
.detail-enquire:hover {
  background: var(--color-indigo-deep);
}
```

- [ ] **Step 6: Verify**

Run: `grep -nE "detail-enquire|detail-breadcrumb|detail-hero-wrap|detail-hero-img|radius-pill" src/pages/projects/[slug].astro`
Expected: no matches.

Run: `npm run check`
Expected: `0 errors`, `0 warnings`.

Run: `npm run build`
Expected: build completes, ~162 pages.

- [ ] **Step 7: Commit**

```bash
git add "src/pages/projects/[slug].astro"
git commit -m "feat(project): full-bleed hero, drop breadcrumb, plain enquire button"
```

---

## Task 3: Contact — de-pill the social links (`src/pages/contact.astro`)

**Files:**
- Modify: `src/pages/contact.astro`

The design's contact has no bordered pills. Convert the four `.c-social-pill` anchors to plain swelling text links (keep the real URLs). Real address/phone/email/map are untouched.

- [ ] **Step 1: Rename the markup class on the four social links**

Replace:

```astro
          <div class="c-social">
            <a href="https://www.houzz.co.uk" class="c-social-pill" rel="noopener noreferrer" target="_blank">Houzz</a>
            <a href="https://www.homify.co.uk" class="c-social-pill" rel="noopener noreferrer" target="_blank">Homify</a>
            <a href="https://www.linkedin.com" class="c-social-pill" rel="noopener noreferrer" target="_blank">LinkedIn</a>
            <a href="https://www.instagram.com" class="c-social-pill" rel="noopener noreferrer" target="_blank">Instagram</a>
          </div>
```

with:

```astro
          <div class="c-social">
            <a href="https://www.houzz.co.uk" class="c-social-link" rel="noopener noreferrer" target="_blank">Houzz</a>
            <a href="https://www.homify.co.uk" class="c-social-link" rel="noopener noreferrer" target="_blank">Homify</a>
            <a href="https://www.linkedin.com" class="c-social-link" rel="noopener noreferrer" target="_blank">LinkedIn</a>
            <a href="https://www.instagram.com" class="c-social-link" rel="noopener noreferrer" target="_blank">Instagram</a>
          </div>
```

- [ ] **Step 2: Replace the pill CSS with plain-text-link CSS**

Replace:

```css
.c-social {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  justify-content: center;
}

.c-social-pill {
  font-family: var(--font-display);
  font-size: var(--type-caption-strong-size);
  font-weight: 600;
  color: var(--color-indigo-slate);
  text-decoration: none;
  border: 1px solid var(--color-lavender);
  border-radius: var(--radius-pill);
  padding: 6px var(--space-md);
  transition: background var(--duration-base) var(--ease-standard),
              color var(--duration-base) var(--ease-standard),
              border-color var(--duration-base) var(--ease-standard);
}

.c-social-pill:hover {
  background: var(--color-lavender);
  color: var(--color-indigo-deep);
  border-color: var(--color-lavender);
}
```

with:

```css
.c-social {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-lg);
  justify-content: center;
}

.c-social-link {
  font-family: var(--font-display);
  font-size: var(--type-caption-strong-size);
  font-weight: 600;
  color: var(--color-indigo-deep);
  text-decoration: none;
  transition: color var(--duration-base) var(--ease-standard);
}

.c-social-link:hover {
  color: var(--color-indigo-vivid);
}
```

- [ ] **Step 3: Verify**

Run: `grep -nE "c-social-pill|radius-pill" src/pages/contact.astro`
Expected: no matches.

Run: `npm run check && npm run build`
Expected: `0 errors`, build completes.

- [ ] **Step 4: Commit**

```bash
git add src/pages/contact.astro
git commit -m "feat(contact): plain-text social links (de-pill)"
```

---

## Task 4: Site-wide CSS fidelity polish + pill sweep

**Files:**
- Modify: `src/pages/projects/index.astro` (dense grid gap)
- Modify: `src/components/ui/Tag.astro` (filter swell)
- Modify: `src/components/ui/NewsHeader.astro` (listing headline size)
- Modify: `src/pages/about.astro` (place-eyebrow font)
- Modify: `src/components/ui/Testimonial.astro` (uppercase attribution)

Five small fidelity fixes that don't belong to one page, plus the final "no stray pill" sweep.

> Note: the design's testimonial blockquote calls for `--type-display-sm-size`, which is **not a defined token** in this project (the only display sizes are hero/lg/md). The current lead-size quote is the correct mapping — leave it. Only the attribution line is brought to the design's uppercase-eyebrow style below.

- [ ] **Step 1: Projects grid — dense gap to match the design**

In `src/pages/projects/index.astro`, in the `.al-grid-projects` base rule, change:

```css
.al-grid-projects {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-xl);
}
```

to:

```css
.al-grid-projects {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-sm);
}
```

- [ ] **Step 2: Tag filter — swell on hover (design interaction)**

In `src/components/ui/Tag.astro`, replace:

```css
/* filter variant: selectable text control that swells on hover/selection */
.tag--filter {
  cursor: pointer;
  color: var(--color-grey-mid);
  transition:
    color var(--duration-base) var(--ease-standard),
    font-weight var(--duration-base) var(--ease-standard);
}
.tag--filter:hover { color: var(--color-indigo-deep); }
```

with:

```css
/* filter variant: selectable text control that swells on hover/selection */
.tag--filter {
  cursor: pointer;
  color: var(--color-grey-mid);
  transform-origin: center;
  transition:
    color var(--duration-base) var(--ease-standard),
    transform var(--duration-base) var(--ease-out);
}
.tag--filter:hover {
  color: var(--color-indigo-deep);
  transform: scale(1.1);
}
```

- [ ] **Step 3: News listing headline — display-md to match Projects**

In `src/components/ui/NewsHeader.astro`, in `.news-headline`, change:

```css
  font-size: var(--type-hero-display-size);
```

to:

```css
  font-size: var(--type-display-md-size);
```

- [ ] **Step 4: About place-eyebrow — font-text to match the design's place captions**

In `src/pages/about.astro`, in `.title-eyebrow`, change:

```css
  font-family: var(--font-display);
```

to:

```css
  font-family: var(--font-text);
```

- [ ] **Step 5: Testimonial attribution — uppercase eyebrow (design figcaption)**

In `src/components/ui/Testimonial.astro`, change the attribution markup from:

```astro
    {author && <figcaption class="testimonial__author">— {author}</figcaption>}
```

to (drop the em-dash; the design's figcaption is a plain uppercase label):

```astro
    {author && <figcaption class="testimonial__author">{author}</figcaption>}
```

and replace the `.testimonial__author` rule:

```css
.testimonial__author {
  margin-top: var(--space-md);
  font-family: var(--font-text); font-size: var(--type-caption-size);
  color: var(--color-indigo-slate);
}
```

with:

```css
.testimonial__author {
  margin-top: var(--space-md);
  font-family: var(--font-text);
  font-size: var(--type-eyebrow-size);
  font-weight: 600;
  letter-spacing: var(--type-eyebrow-tracking);
  text-transform: uppercase;
  color: var(--color-indigo-slate);
}
```

- [ ] **Step 6: Verify the pill sweep — only Pagination keeps a pill**

Run: `grep -rn "radius-pill" src/`
Expected: matches **only** in `src/components/ui/Pagination.astro` and the token definition in `src/styles/tokens/spacing.css`. No matches in any page or other component.

Run: `npm run check && npm run build`
Expected: `0 errors`, build completes, ~162 pages.

- [ ] **Step 7: Commit**

```bash
git add src/pages/projects/index.astro src/components/ui/Tag.astro src/components/ui/NewsHeader.astro src/pages/about.astro src/components/ui/Testimonial.astro
git commit -m "fix(design): dense projects grid, filter swell, news headline size, about eyebrow font, uppercase testimonial attribution"
```

---

## Task 5: Upscaler acquisition + smoke test

**Files:**
- Modify: `.gitignore` (ignore the vendored binary)
- Create: `scripts/upscale/vendor/` (downloaded; git-ignored)
- Create: `scripts/upscale/.gitkeep` is not needed — the script dir gets `run.mjs` in Task 6.

Acquire `realesrgan-ncnn-vulkan` (Apple-Silicon) and prove it runs on one real image. This is environment setup; its deliverable is a working binary + a sample 4× output.

- [ ] **Step 1: Ignore the vendored binary**

Append to `.gitignore`:

```
scripts/upscale/vendor/
scripts/upscale/.tmp/
```

- [ ] **Step 2: Download + unpack the Real-ESRGAN ncnn binary**

```bash
mkdir -p scripts/upscale/vendor
curl -L -o scripts/upscale/vendor/realesrgan.zip \
  https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesrgan-ncnn-vulkan-20220424-macos.zip
unzip -o scripts/upscale/vendor/realesrgan.zip -d scripts/upscale/vendor
xattr -dr com.apple.quarantine scripts/upscale/vendor
chmod +x scripts/upscale/vendor/realesrgan-ncnn-vulkan
ls scripts/upscale/vendor && ls scripts/upscale/vendor/models | head
```

Expected: a `realesrgan-ncnn-vulkan` binary and a `models/` folder containing `realesrgan-x4plus.param` / `realesrgan-x4plus.bin`.

**If the binary or model dir lands one level deeper** (some zips unpack into a subfolder), move them up so the binary is at `scripts/upscale/vendor/realesrgan-ncnn-vulkan` and models at `scripts/upscale/vendor/models`.

**If this URL 404s or the binary refuses to run** (Gatekeeper/Vulkan), fall back to Upscayl's bundled engine:

```bash
brew install --cask upscayl
```

Then use `UPSCALE_BIN=/Applications/Upscayl.app/Contents/Resources/bin/upscayl-bin` and `UPSCALE_MODELS=/Applications/Upscayl.app/Contents/Resources/models` (model name `upscayl-standard-4x` instead of `realesrgan-x4plus`) in Task 6's run. Record which engine was used in the commit message.

- [ ] **Step 3: Smoke-test on one real image**

```bash
mkdir -p scripts/upscale/.tmp
echo "input:"; sips -g pixelWidth -g pixelHeight src/content/projects/listed-country-house-chiddingfold-surrey/hero-01.jpg | grep pixel
scripts/upscale/vendor/realesrgan-ncnn-vulkan \
  -i src/content/projects/listed-country-house-chiddingfold-surrey/hero-01.jpg \
  -o scripts/upscale/.tmp/smoke.png \
  -n realesrgan-x4plus -s 4 -m scripts/upscale/vendor/models
echo "output:"; sips -g pixelWidth -g pixelHeight scripts/upscale/.tmp/smoke.png | grep pixel
```

Expected: the output PNG is ~4× the input's dimensions (e.g. input 1421×800 → output ~5684×3200). This proves the GPU upscaler runs on this machine.

- [ ] **Step 4: Commit the gitignore change**

```bash
git add .gitignore
git commit -m "chore(upscale): vendor Real-ESRGAN binary (git-ignored) + smoke test"
```

(The binary itself is not committed; only `.gitignore` changes.)

---

## Task 6: Upscale pipeline script + manifest (TDD)

**Files:**
- Create: `scripts/upscale/run.mjs`
- Create: `scripts/upscale/run.test.mjs`
- Modify: `CLAUDE.md` (document the workflow)

**Interfaces:**
- Produces: `downscaleEncode(inputBuffer, opts?) => Promise<Buffer>` (sharp: resize to `cap` longest edge inside, no enlargement, JPEG `quality` mozjpeg). `shouldSkip(manifest, file, hash) => boolean` (`manifest[file] === hash`). `processImage(file, opts?) => Promise<string>` (runs the binary 4×, downscales, overwrites `file`, returns new SHA-256). `collectImages() => string[]`. A `main()` guarded so importing the module does not execute it.

- [ ] **Step 1: Write the failing tests**

Create `scripts/upscale/run.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { downscaleEncode, shouldSkip } from "./run.mjs";

test("downscaleEncode caps the long edge at 2560 and outputs mozjpeg", async () => {
  const big = await sharp({ create: { width: 4000, height: 3000, channels: 3, background: { r: 100, g: 120, b: 140 } } }).png().toBuffer();
  const out = await downscaleEncode(big, { cap: 2560, quality: 88 });
  const meta = await sharp(out).metadata();
  assert.equal(meta.format, "jpeg");
  assert.equal(meta.width, 2560);
  assert.ok(meta.height <= 2560);
});

test("downscaleEncode never enlarges a small source", async () => {
  const small = await sharp({ create: { width: 800, height: 600, channels: 3, background: { r: 10, g: 20, b: 30 } } }).png().toBuffer();
  const out = await downscaleEncode(small, { cap: 2560 });
  const meta = await sharp(out).metadata();
  assert.equal(meta.width, 800);
});

test("shouldSkip is true only when the manifest hash matches", () => {
  assert.equal(shouldSkip({ "a.jpg": "h1" }, "a.jpg", "h1"), true);
  assert.equal(shouldSkip({ "a.jpg": "h1" }, "a.jpg", "h2"), false);
  assert.equal(shouldSkip({}, "a.jpg", "h1"), false);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test scripts/upscale/run.test.mjs`
Expected: FAIL — `Cannot find module './run.mjs'` / exports undefined.

- [ ] **Step 3: Write `scripts/upscale/run.mjs`**

```js
// scripts/upscale/run.mjs — upscale every source JPEG with Real-ESRGAN, then
// downscale the 4x result to a sane cap and overwrite the source in place.
// Idempotent: a SHA-256 manifest records processed files so re-runs skip them.
//
// Usage:
//   node scripts/upscale/run.mjs                 # every project + news image
//   node scripts/upscale/run.mjs <slug> [slug…]  # only the named folders
//
// Env overrides (for the Upscayl fallback engine):
//   UPSCALE_BIN, UPSCALE_MODELS, UPSCALE_MODEL
import { readdirSync, existsSync, readFileSync, writeFileSync, statSync, rmSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import sharp from "sharp";

const BIN = process.env.UPSCALE_BIN || "scripts/upscale/vendor/realesrgan-ncnn-vulkan";
const MODELS = process.env.UPSCALE_MODELS || "scripts/upscale/vendor/models";
const MODEL = process.env.UPSCALE_MODEL || "realesrgan-x4plus";
const MANIFEST = "scripts/upscale/done.json";
const CAP = 2560;
const QUALITY = 88;
const SOURCE_DIRS = ["src/content/projects", "src/content/news"];
const IMG_RE = /^(hero-\d+|g\d+)\.jpg$/i;

export const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

export function shouldSkip(manifest, file, hash) {
  return manifest[file] === hash;
}

export async function downscaleEncode(inputBuffer, { cap = CAP, quality = QUALITY } = {}) {
  return sharp(inputBuffer)
    .resize({ width: cap, height: cap, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();
}

export async function processImage(file, { bin = BIN, models = MODELS, model = MODEL, cap = CAP, quality = QUALITY } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "upscale-"));
  const out = join(dir, "out.png");
  try {
    execFileSync(bin, ["-i", file, "-o", out, "-n", model, "-s", "4", "-m", models], { stdio: "pipe" });
    const buf = await downscaleEncode(readFileSync(out), { cap, quality });
    writeFileSync(file, buf);
    return sha256(buf);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export function collectImages(dirs = SOURCE_DIRS) {
  const files = [];
  for (const base of dirs) {
    if (!existsSync(base)) continue;
    for (const slug of readdirSync(base)) {
      const d = join(base, slug);
      if (!statSync(d).isDirectory()) continue;
      for (const f of readdirSync(d)) if (IMG_RE.test(f)) files.push(join(d, f));
    }
  }
  return files.sort();
}

async function main() {
  const only = process.argv.slice(2);
  const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")) : {};
  let files = collectImages();
  if (only.length) files = files.filter((f) => only.some((s) => f.includes(`/${s}/`)));
  let done = 0, skipped = 0;
  const failed = [];
  for (const file of files) {
    const cur = sha256(readFileSync(file));
    if (shouldSkip(manifest, file, cur)) { skipped++; continue; }
    process.stdout.write(`upscaling ${file} … `);
    try {
      manifest[file] = await processImage(file);
      writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
      done++;
      console.log("ok");
    } catch (e) {
      failed.push(file);
      console.log("FAILED");
      console.error(`  ${e.message}`);
    }
  }
  console.log(`\n${done} upscaled · ${skipped} already done · ${failed.length} failed · ${files.length} total`);
  if (failed.length) { console.error("failed:\n" + failed.map((f) => "  " + f).join("\n")); process.exitCode = 1; }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test scripts/upscale/run.test.mjs`
Expected: `pass 3`, `fail 0`.

- [ ] **Step 5: Document the workflow in CLAUDE.md**

In `CLAUDE.md`, after the "Image-quality upgrade (Phase B, ongoing)" section, add:

```markdown
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
```

- [ ] **Step 6: Commit**

```bash
git add scripts/upscale/run.mjs scripts/upscale/run.test.mjs CLAUDE.md
git commit -m "feat(upscale): idempotent Real-ESRGAN pipeline + tests + docs"
```

---

## Task 7: Top-6 sample run + owner checkpoint

**Files:**
- Modify: image files under the sample projects + `scripts/upscale/done.json`

Process the most prominent projects first so the owner can eyeball quality before the full batch.

- [ ] **Step 1: Determine the sample set (4 featured + 2 most-recent fill = 6)**

```bash
grep -rl "featured: true" src/content/projects | sed 's#src/content/projects/##; s#/index.md##'
```

The featured projects are the sample core. To reach six, add the two most-recent non-featured projects by `year`:

```bash
grep -rL "featured: true" src/content/projects/*/index.md \
  | xargs grep -H "^year:" \
  | sort -t: -k3 -rn | head -2 | sed 's#src/content/projects/##; s#/index.md.*##'
```

- [ ] **Step 2: Upscale the six sample folders**

Run the pipeline against just those six slugs (substitute the slugs printed above):

```bash
node scripts/upscale/run.mjs \
  listed-country-house-chiddingfold-surrey \
  6th-form-centre-newbury-west-berkshire \
  near-passivhaus-office-extension \
  restaurant-duke-of-york-square-london \
  <recent-slug-1> <recent-slug-2>
```

Expected: each `hero-*/g*` in those folders prints `upscaling … ok`; re-running the same command prints `already done` for all (idempotency check).

- [ ] **Step 3: Report a before/after sample for the owner**

```bash
for s in listed-country-house-chiddingfold-surrey 6th-form-centre-newbury-west-berkshire; do
  f="src/content/projects/$s/hero-01.jpg"
  printf "%s  " "$s"; sips -g pixelWidth -g pixelHeight "$f" 2>/dev/null | awk '/pixelWidth/{w=$2}/pixelHeight/{h=$2}END{printf "%sx%s  ",w,h}'; ls -la "$f" | awk '{print $5" bytes"}'
done
```

Build and let the owner view the sample pages locally:

```bash
npm run build
```

**CHECKPOINT:** surface the dimensions/sizes and (if the owner wants) `npm run dev` so they can eyeball the upscaled heroes before the full batch. Wait for the owner's go-ahead. If quality is off (over-smoothing/artifacts), revisit the model choice (`realesr-general-x4v3`) before continuing.

- [ ] **Step 4: Commit the sample**

```bash
git add "src/content/projects" scripts/upscale/done.json
git commit -m "feat(upscale): apply Real-ESRGAN to the 6 priority projects"
```

---

## Task 8: Full batch + verify + build + finish

**Files:**
- Modify: remaining image files under `src/content/**` + `scripts/upscale/done.json`

- [ ] **Step 1: Run the full batch (background; the manifest makes it resumable)**

```bash
node scripts/upscale/run.mjs
```

Expected (may take ~20–60 min): every remaining `hero-*/g*` across projects + news prints `upscaling … ok`; the six sample folders print `already done`. Final line reports the totals and **`0 failed`**. If any files failed, inspect the printed errors and re-run (the manifest skips the successes); only proceed once `0 failed`.

- [ ] **Step 2: Confirm idempotency + full coverage**

Run: `node scripts/upscale/run.mjs`
Expected: `0 upscaled · <N> already done · 0 failed · <N> total` (everything skipped on a second pass).

- [ ] **Step 3: Run the unit tests, type check, and build**

Run: `node --test src/lib/*.test.mjs scripts/upscale/run.test.mjs`
Expected: all pass (8 + 3).

Run: `npm run check`
Expected: `0 errors`, `0 warnings`.

Run: `npm run build`
Expected: build completes, ~162 pages, no `astro:assets` errors (all sources still valid JPEGs).

- [ ] **Step 4: Spot-check sizes and a couple of outputs**

```bash
find src/content -name 'hero-01.jpg' | head -3 | while read f; do
  printf "%s  " "$f"; sips -g pixelWidth -g pixelHeight "$f" 2>/dev/null | awk '/pixelWidth/{w=$2}/pixelHeight/{h=$2}END{printf "%sx%s  ",w,h}'; ls -la "$f" | awk '{print $5" bytes"}'
done
du -sh src/content
```

Expected: heroes now near the 2560 cap where the upscale allowed; `src/content` total grown but within ~150–200 MB.

- [ ] **Step 5: Commit the full batch**

```bash
git add "src/content" scripts/upscale/done.json
git commit -m "feat(upscale): apply Real-ESRGAN to all remaining project + news images"
```

- [ ] **Step 6: Finish the branch**

Use **superpowers:finishing-a-development-branch**: verify tests pass, then merge `refresh-v2` → `main` and push (Cloudflare auto-deploys). Confirm `git log --oneline` shows the fidelity + upscale commits on `main`.

---

## Notes for the executor

- **Order:** Tasks 1–4 (design) are independent of 5–8 (images) and can be reviewed/merged in either order; keep them in one branch per the owner's choice.
- **The pill sweep (Task 4 Step 5) is the fidelity backstop** — if it finds `--radius-pill` anywhere outside Pagination, that's an unconverted button; fix it before completing the task.
- **Exceptions are load-bearing:** do not re-add the header CTA/contact strip, do not turn captions into titles, and keep the slideshow hero. A reviewer flagging any of these as "design divergence" is wrong — they are owner-confirmed.
- **Don't sweep in `docs/superpowers/plans/2026-06-30-al-six-tweaks.md`** (an unrelated untracked file) when staging.
