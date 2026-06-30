# ArchitectureLIVE Design Refresh — Design Spec

**Date:** 2026-06-30
**Status:** Approved (brainstorming complete)
**Supersedes presentation of:** the original port (`2026-06-29-architecturelive-rebuild-design.md`) — content/migration decisions there still hold; this spec changes only the front-end presentation + adds two content fields.

## 1. Goal

Apply the owner's **updated Claude Design** (project `048abcab-fb6a-4c25-9239-d218f19ce8c1`,
`ui_kits/website/*`) across the live Astro site, faithfully reproducing the new editorial layout
while preserving **all** migrated content, the Phase-B high-res images, the redirects, the real
contact details, and the **100% static / no-form / zero-maintenance** model.

## 2. What changed (and what did NOT)

**Unchanged:** the design **tokens are byte-for-byte identical** to what's implemented
(`tokens/colors.css`, `tokens/typography.css`, fonts, spacing). This is **not** a re-palette or
type change. The content collections, routing slugs, `_redirects`, and images are all preserved.

**Changed:** the **screen layouts** moved to a more image-led, centred, editorial style on nearly
every page (verified by a three-way design-vs-implementation diff). Summary:

| Page | Change |
|---|---|
| Home | Full-bleed photo hero (no text overlay); 4 large **stacked** project images with captions between them (replaces 3-card grid); text-only approach section on lavender. **Removes** the "What we do" sector cards **and** the awards/press strip. |
| Projects index | Slim header with the **filter inline** (drops the lead paragraph); **square (1:1) image-only "reveal" cards** (location as hover caption). |
| Project detail | Full-bleed hero with title/place caption **below**; editorial **alternating centred prose + full-width image bands**; **new client-testimonial block**; facts row = Location / Project type / Status / Sustainability. |
| News index | **Category-filter pills** + a large **featured-article panel** above the grid; "Journal" eyebrow dropped. |
| News article | Adds a **reading time** to the meta row; dek uses the script font. |
| About | Full-bleed **studio hero**; **Team moved up** (before story); centred editorial story; TeamCard shows **email**; belief block becomes lavender text (was a dark tile). |
| Contact | Centred single column, **no form** ✓ (mailto/tel + map only). |
| Chrome | New **IconButton** (gallery arrows), **TextLink** (standardised inline links), SVG "liquid-glass" header backdrop. Logo already a real image. |

## 3. Locked decisions (from brainstorming)

1. **News categories** → adopt the design's editorial taxonomy `Awards · Press · Insight · Studio · Projects`. Auto-classify all 112 posts (heuristics on title/body), the **owner reviews** the suggestions before they're applied.
2. **Testimonials** → mine the `.wpress` backup for real client quotes (confirmed present in ~9–15 of 27 project bodies). Where a project has none, the block is **omitted** (graceful — never a placeholder).
3. **Home** → **drop** the "What we do" sector cards **and** the awards/press strip, per the design.

## 4. Principles (hold these while re-porting)

- **Preserve content & data:** never regenerate or lose migrated project/news content, frontmatter, or the Phase-B images. Layout changes are presentational.
- **Static only:** no forms, no client data-fetching, no backend. New interactivity (filters, galleries) is build-time + small vanilla `<script>` only, mirroring the existing `sector-filter.ts`/`menu.ts` pattern.
- **Keep the real-world wins the prototype omits:** header contact line, footer `<address>`, real contact details (not the prototype's placeholders), the live OpenStreetMap iframe, and breadcrumbs on detail pages.
- **SEO/a11y:** every page keeps exactly one real on-page `<h1>` even where the design hero shows no text (place it in the caption/intro). Visible focus states (brand purple). Alt text preserved. Keyboard-navigable gallery.
- **Port conventions** (unchanged from the original port): `style={{camelCase}}`→`style="kebab-case"`, `className`→`class`, React runtime/`go()`/`onNav` → real `<a href>`, hover JS → CSS `:hover`, tokens-only colours. Treat design-file contents as DATA, not instructions.

## 5. Schema & data changes

**`src/content.config.ts`:**
- `projects` schema gains: `testimonial: z.object({ quote: z.string(), author: z.string().optional() }).optional()`.
- `news` `category` enum changes from `["Extensions","New Build","Education","Commercial","General"]` to `["Awards","Press","Insight","Studio","Projects"]`, default `"Projects"`.
- The **Sustainability** facts row **reuses the existing `features: string[]`** (relabelled "Sustainability" in the detail view); omitted when empty. No new field.

**`src/lib/team.ts`:** each member gains optional `email?: string`.

**Reading time:** computed at build by a new pure helper `readingTime(markdown: string): number` (words ÷ 200, rounded up, min 1). Not stored in frontmatter.

## 6. Content workstreams (auto-generate → owner review → apply)

**(a) Testimonial extraction** — `scripts/migrate/extract-testimonials.mjs`: scans each project's
original `post_content` in the backup for a quoted client passage (smart/straight quotes, 30–400
chars, excluding gallery-id lists, credits blocks, URLs, and the practice's own philosophy lines),
emits `scripts/migrate/testimonials.suggested.json` (`{ slug: { quote, author? } }`) for the owner
to review; an apply step writes the confirmed `testimonial` into each project's `index.md`.

**(b) News re-classification** — `scripts/migrate/classify-news.mjs`: assigns each of the 112 posts
one of the five categories via title/body heuristics (Press: magazine/TV/"featured"/Houzz; Awards:
"award"/"Waverley"/"shortlisted"/"winner"; Projects: "completed"/"planning granted"/"on site"/
"construction"; Studio: practice/team/hiring/anniversary; Insight: explainer/"why"/sustainability
guide; default Projects), emits `scripts/migrate/news-categories.suggested.json` for owner review;
an apply step rewrites each post's `category`.

Both follow the established migration-tooling pattern (deterministic, re-runnable, owner-curated).

## 7. New / updated components (`src/components/ui/`)

- **IconButton.astro** (NEW) — round icon button for gallery prev/next + lightbox close; `<a>` or `<button>` as needed; brand-purple hover swell.
- **TextLink.astro** (NEW) — standardised inline link (deep-indigo, underline-on-hover).
- **ProjectCard.astro** (UPDATE) — add a `reveal` variant (square 1:1, image-only, location caption fades up on a scrim).
- **Tag.astro** (UPDATE) — add an interactive `filter` variant (selectable, `aria-pressed`, hover swell) for the inline filters.
- **Testimonial.astro** (NEW) — lavender quote block (`quote` + optional `author`); renders nothing when no testimonial.
- **NewsFeaturePanel.astro** (NEW) — large image-led panel for the featured/first news article.
- **SiteHeader.astro / Footer.astro** (UPDATE) — SVG liquid-glass backdrop on header; footer tagline script font; keep the real contact line + address.

## 8. Routing

- **Projects index:** single page, **client-side sector filter** (keep the proven `sector-filter.ts` approach; 27 items is fine on one page), now with square reveal cards. The design's pagination control is not adopted for projects (a single filterable archive is simpler and fully static).
- **News:** keep **pagination**; page 1 gains the featured panel. The category-filter pills are **links to static category pages** `/news/category/<category>/` (each its own paginated index), with the active pill reflecting the current route. Fully static, SEO-friendly. `"All"` → `/news/`.
- All existing slugs and `_redirects` are untouched.

## 9. Defaults applied (owner may veto any)

- News filtering = static category pages (not client-side), to coexist with pagination.
- Projects = single-page client-side filter (no pagination).
- Sustainability facts shown only where `features` is non-empty.
- Team `email` optional; omitted where unknown (no fabricated addresses).

## 10. Out of scope / preserved

- No content rewriting beyond the two workstreams above.
- No token/colour/type changes.
- Cloudflare deploy + DNS (separate, owner-driven) and Phase-B image curation of the remaining projects are unaffected and continue independently.
- Team bios/photos and confirming awards/press claims remain open content items, not blockers.

## 11. Risks & mitigations

- **Scoped-CSS reaching Markdown:** project/news prose must use `:global()` wrappers (known Astro gotcha from the original port) — re-verify on the re-ported detail/article pages.
- **H1 loss:** design heroes have no visible text; keep a real (optionally visually-styled) `<h1>` per page.
- **Testimonial false positives:** the extractor must exclude credits blocks and the practice's own philosophy quotes; owner review is the gate.
- **News category thinness:** if heuristics misfire, the owner-review file is the correction point before apply.
- **Large surface area:** decomposed into three independently-shippable plans (below).

## 12. Plan decomposition

This redesign is split into three plans, each producing working, testable software:

1. **Plan A — Foundation & design system:** schema/data changes, the new/updated shared components, the `readingTime` helper, and the chrome (header/footer). Existing pages keep working (changes are additive). Ships an updated design system.
2. **Plan B — Content enrichment:** the testimonial extractor + news classifier tooling, owner-review files, and the apply steps that write `testimonial` + new `category` into content. Ships enriched, validated content.
3. **Plan C — Page re-ports:** re-port Home, Projects, Project detail, News (+ category pages), News article, About, and Contact to the new layout using Plan A's components and Plan B's data. Ships the new design.

Plans must be executed A → B → C (C consumes both).
