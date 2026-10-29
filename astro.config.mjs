// @ts-check
import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';

// https://astro.build/config
export default defineConfig({
	site: 'https://ff2710.github.io',
	base: '/fidels-perspektive',
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
