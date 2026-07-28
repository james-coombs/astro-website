import { defineCollection, type InferEntrySchema } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const blogCollection = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/blog" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      heroImage: image().optional(),
      badge: z.string().optional(),
      tags: z
        .array(z.string())
        .refine((items) => new Set(items).size === items.length, {
          message: "tags must be unique",
        })
        .default([]),
      slug: z.string(),
    }),
});

export const collections = {
  blog: blogCollection,
};

export type BlogSchema = InferEntrySchema<"blog">;
