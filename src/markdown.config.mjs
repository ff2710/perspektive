import { satteri } from '@astrojs/markdown-satteri';

/**
 * Markdown-Pipeline der Seite. Wird von astro.config.mjs und vom Editor (/write, Vorschau)
 * gemeinsam benutzt, damit die Vorschau exakt so rendert wie die echte Seite.
 */
export const markdownProcessor = satteri({
	features: {
		gfm: {
			footnotes: {
				label: 'Fußnoten',
				backLabel: 'Zurück zum Text ({reference})',
			},
		},
	},
});
