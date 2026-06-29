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
