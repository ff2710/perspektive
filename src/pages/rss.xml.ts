import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPosts } from '../utils/posts';
import { url } from '../utils/url';

export async function GET(context: APIContext) {
	const posts = await getPosts();
	return rss({
		title: 'Perspektive',
		description: 'Ich bin Fidel, Politikwissenschaftsstudent, und teile hier meine Perspektive zu aktuellen politischen Themen.',
		site: new URL(url('/'), context.site).href,
		items: posts.map((post) => ({
			title: post.data.title,
			description: post.data.description,
			pubDate: post.data.pubDate,
			link: url(`/beitraege/${post.id}/`),
			categories: post.data.tags,
		})),
		customData: '<language>de-de</language>',
	});
}
