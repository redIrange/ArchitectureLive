# Final Review Log

## Fix: don't repeat hero image as the first project band

**Date:** 2026-06-30
**Branch:** design-refresh
**Prior commit:** 1f32766

### Change applied

`src/pages/index.astro`:
- `featured` slice extended from `.slice(0, 4)` → `.slice(0, 5)` so pool stays 5 items.
- `featuredOrFallback` fallback likewise `.slice(0, 4)` → `.slice(0, 5)`.
- Stacked bands map changed from `featuredOrFallback.map(...)` → `featuredOrFallback.slice(1).map(...)` — hero image (index 0) is now excluded from the bands.

### check + build

`npm run check`: 0 errors, 0 warnings (2 hints in migrate scripts — pre-existing).
`npm run build`: 162 pages built, 0 errors.

### Hero-vs-first-band image confirmation

| Slot | src attribute |
|------|--------------|
| Hero `<img>` | `/_astro/hero-01.g8qf-UKr_1L3KwN.webp` |
| First band `<img>` | `/_astro/hero-01.oAnSaGs4_1PkIIb.webp` |

Source-image hashes differ (`g8qf-UKr` vs `oAnSaGs4`) — confirmed different origin files.

### Counts in dist/index.html

- `<h1>` tags: **1** (pass)
- Stacked project bands: **3** (pass — at least 3 required; 4 featured projects → hero + 3 bands)

### Commit

`fix(home): don't repeat hero image as the first project band`
Hash: (see below — appended after commit)
