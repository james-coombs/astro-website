import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getCollection } from "astro:content";
import { SITE_TITLE, SITE_DESCRIPTION } from "../config";
import formatBlogLink from "../lib/formatBlogLink";

export async function GET(context: APIContext) {
  const posts = await getCollection("blog");

  // Sort posts by date descending
  posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site ?? import.meta.env.SITE,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: formatBlogLink(post.data.slug, post.id),
    })),
  });
}
