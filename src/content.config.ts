import { defineCollection } from "astro:content";
import { z } from 'astro/zod'
import { glob } from 'astro/loaders';

const blogSchema = z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.string().optional(),
    heroImage: z.string().optional(),
    badge: z.string().optional(),
    tags: z.array(z.string()).refine(items => new Set(items).size === items.length, {
        message: 'tags must be unique',
    }).optional(),
});

export type BlogSchema = z.infer<typeof blogSchema>;

const blogCollection = defineCollection({
    schema: blogSchema,
    loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: "./src/content/blog" }), 
});

export const collections = {
    'blog': blogCollection,
}