import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
  const posts = (await getCollection("news", (n) => !n.data.draft))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  return rss({
    title: "ArchitectureLIVE — News",
    description: "Contemporary Design & Sustainable Living",
    site: context.site!,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.excerpt,
      pubDate: p.data.date,
      link: `/news/${p.id}/`,
    })),
  });
}
