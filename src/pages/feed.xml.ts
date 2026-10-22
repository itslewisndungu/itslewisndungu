import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { AUTHOR, SITE_DESCRIPTION, SITE_TITLE } from "../consts";
import { getAllArticles } from "../lib/articles";

export async function GET(context: APIContext) {
	const articles = await getAllArticles();

	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site ?? "",
		items: articles.map((article) => ({
			title: article.data.title,
			description: article.data.description,
			pubDate: article.data.date,
			author: `${AUTHOR.email} (${AUTHOR.name})`,
			link: `/articles/${article.id}/`,
		})),
	});
}
