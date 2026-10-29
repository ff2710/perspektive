// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { write } from './src/integrations/write.ts';
import { markdownProcessor } from './src/markdown.config.mjs';

// https://astro.build/config
export default defineConfig({
	// Die Entwicklerleiste prüft die Seite im Hintergrund und kann das Scrollen im Dev-Server ruckeln lassen.
	devToolbar: { enabled: false },
	site: 'https://ff2710.github.io',
	base: '/perspektive',
	integrations: [sitemap({ filter: (page) => !page.includes('/suche/') }), write()],
	markdown: {
		processor: markdownProcessor,
	},
});
