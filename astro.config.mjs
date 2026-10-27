// @ts-check

import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
  site: "https://itslewisndungu.com",
  integrations: [mdx(), sitemap()],

  markdown: {
    syntaxHighlight: "prism",
  },

  vite: {
    plugins: [tailwindcss()],
  },

  adapter: vercel(),
});