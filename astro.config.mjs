// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { satteri } from '@astrojs/markdown-satteri';

// https://astro.build/config
export default defineConfig({
	site: 'https://ff2710.github.io',
	base: '/fidels-perspektive',
	integrations: [sitemap({ filter: (page) => !page.includes('/suche/') })],
	markdown: {
		processor: satteri({
			features: {
				gfm: {
					footnotes: {
						label: 'Fußnoten',
						backLabel: 'Zurück zum Text ({reference})',
					},
				},
			},
		}),
	},
});
