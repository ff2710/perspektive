/**
 * Milkdown-Einstellungen des Editors. Auch der Rundreise-Test (scripts/check-roundtrip.mjs)
 * nutzt genau diese Datei, damit Editor und Test dasselbe prüfen.
 */
import { Editor, defaultValueCtx, remarkStringifyOptionsCtx, rootCtx } from '@milkdown/kit/core';
import { history } from '@milkdown/kit/plugin/history';
import { listener, listenerCtx } from '@milkdown/kit/plugin/listener';
import { commonmark } from '@milkdown/kit/preset/commonmark';
import { gfm } from '@milkdown/kit/preset/gfm';

/** Der Editor macht aus &nbsp; das unsichtbare Zeichen U+00A0; im Markdown bleibt es als &nbsp; lesbar. */
export const readable = (markdown: string) => markdown.replace(/\u00a0/g, '&nbsp;');

export function createEditor(root: HTMLElement, markdown: string, onChange?: (markdown: string) => void) {
	return Editor.make()
		.config((ctx) => {
			ctx.set(rootCtx, root);
			ctx.set(defaultValueCtx, markdown);
			// Schreibweise wie in den Beiträgen: "- " für Listen, "---" für Trenner, *kursiv*, **fett**.
			ctx.update(remarkStringifyOptionsCtx, (options) => ({
				...options,
				bullet: '-',
				rule: '-',
				emphasis: '*',
				strong: '*',
				fences: true,
				listItemIndent: 'one',
			}));
			if (onChange) ctx.get(listenerCtx).markdownUpdated((_ctx, value) => onChange(readable(value)));
		})
		.use(commonmark)
		.use(gfm)
		.use(history)
		.use(listener)
		.create();
}
