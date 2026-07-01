// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { readdirSync, readFileSync } from "node:fs";

// Map each /news/<slug>/ URL to its post date so the sitemap can emit
// <lastmod> — a freshness signal crawlers use to schedule recrawls.
/** @type {Record<string, string>} */
const newsLastmod = {};
try {
  for (const slug of readdirSync("./src/content/news", { withFileTypes: true })) {
    if (!slug.isDirectory()) continue;
    try {
      const md = readFileSync(`./src/content/news/${slug.name}/index.md`, "utf8");
      const m = md.match(/^date:\s*['"]?(\d{4}-\d{2}-\d{2})/m);
      if (m) newsLastmod[`/news/${slug.name}/`] = new Date(m[1]).toISOString();
    } catch { /* skip unreadable post */ }
  }
} catch { /* content dir absent — sitemap simply omits lastmod */ }

export default defineConfig({
  site: "https://architecturelive.co.uk",
  output: "static",
  integrations: [
    sitemap({
      serialize(item) {
        const { pathname } = new URL(item.url);
        if (newsLastmod[pathname]) item.lastmod = newsLastmod[pathname];
        return item;
      },
    }),
  ],
  image: {
    // default sharp service; generate modern formats
    responsiveStyles: true,
  },
  build: { format: "directory" },
});
