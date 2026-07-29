import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  site: "https://james-coombs.com/",
  build: {
    inlineStylesheets: "always",
  },
  integrations: [
    mdx(),
    sitemap(),
    tailwind({
      configFile: "./tailwind.config.mjs", // Forces Astro to load this exact config
    }),
  ],
});