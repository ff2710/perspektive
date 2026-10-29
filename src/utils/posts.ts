import { getCollection, type CollectionEntry } from 'astro:content';
import { slugify } from './slug';

export type Post = CollectionEntry<'posts'>;

const dateFormat = new Intl.DateTimeFormat('de-DE', { dateStyle: 'long', timeZone: 'UTC' });

export const formatDate = (date: Date) => dateFormat.format(date);

/** Alle veröffentlichten Beiträge, neueste zuerst. */
export async function getPosts(): Promise<Post[]> {
	const posts = await getCollection('posts', ({ data }) => !data.draft);
	return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf() || a.id.localeCompare(b.id));
}

/** Lesezeit in Minuten (ca. 200 Wörter pro Minute, mindestens 1). */
export function readingMinutes(post: Post): number {
	const words = (post.body ?? '').split(/\s+/).filter(Boolean).length;
	return Math.max(1, Math.ceil(words / 200));
}

export const tagSlug = slugify;

/** Alle Themen mit Anzahl der Beiträge, sortiert nach Anzahl und Name. */
export function collectTags(posts: Post[]): { name: string; slug: string; count: number }[] {
	const counts = new Map<string, number>();
	for (const post of posts) {
		for (const tag of post.data.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
	}
	return [...counts.entries()]
		.map(([name, count]) => ({ name, slug: tagSlug(name), count }))
		.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'de'));
}
