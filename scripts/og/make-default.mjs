/**
 * Generate the default social-share (Open Graph) card → public/og-default.jpg.
 *
 * Used as the og:image / twitter:image fallback for pages without their own
 * hero (home, studio, contact, listings). Project and news pages use their own
 * hero photo as the OG image instead (see BaseHead.astro).
 *
 * 1200x630 is the canonical OG size. Source is a strong hero photo, cover-
 * cropped, with a bottom gradient + wordmark baked in. Re-run after swapping
 * the source image:  node scripts/og/make-default.mjs
 */
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..", "..");

const SRC = resolve(root, "src/assets/slider/slide-01.jpg");
const OUT = resolve(root, "public/og-default.jpg");

const W = 1200;
const H = 630;

// Bottom gradient + wordmark overlay. Body font stack matches the site
// (Helvetica/Arial); the display wordmark is approximated here since Quicksand
// is not guaranteed on the render host.
const overlay = Buffer.from(`
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="#1f1f2d" stop-opacity="0"/>
      <stop offset="55%" stop-color="#1f1f2d" stop-opacity="0"/>
      <stop offset="100%" stop-color="#1f1f2d" stop-opacity="0.86"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${W}" height="${H}" fill="url(#fade)"/>
  <text x="72" y="545" font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
        font-size="58" font-weight="700" letter-spacing="-1" fill="#ffffff">Architecture<tspan fill="#b9b6e6">LIVE</tspan></text>
  <text x="74" y="588" font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
        font-size="27" font-weight="400" letter-spacing="0.2" fill="#e7e6f4">Contemporary design &amp; sustainable living</text>
</svg>`);

await sharp(SRC)
  .resize(W, H, { fit: "cover", position: "centre" })
  .composite([{ input: overlay, top: 0, left: 0 }])
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile(OUT);

const meta = await sharp(OUT).metadata();
console.log(`Wrote ${OUT} (${meta.width}x${meta.height}, ${(meta.size / 1024).toFixed(0)} KB)`);
