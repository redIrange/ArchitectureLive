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
      testimonial: z
        .object({ quote: z.string(), author: z.string().optional() })
        .optional(),
      draft: z.boolean().default(false),
    }),
});

const news = defineCollection({
  loader: glob({ pattern: "**/index.md", base: "./src/content/news" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      category: z.enum(CATEGORIES).default("Projects"),
      heroImage: image(),
      excerpt: z.string().default(""),
      draft: z.boolean().default(false),
    }),
});

export const collections = { projects, news };
