import createSlug from "./createSlug";

export default function (slug: string, id: string) {
  return `/blog/${createSlug(slug, id)}/`;
}
