import { getCollection } from "astro:content";

export async function getAllArticles() {
  const articles = await getCollection("articles");

  return articles.sort((a, z) => z.data.date.valueOf() - a.data.date.valueOf());
}
