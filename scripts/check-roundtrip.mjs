/**
 * Rundreise-Test des Editors: jeder Beitrag in src/content/posts/ geht zweimal durch
 * Markdown -> Word-Ansicht (Milkdown) -> Markdown und muss danach Zeichen für Zeichen gleich sein.
 * Aufruf: npm run check:roundtrip
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
for (const key of ['window', 'document', 'navigator', 'Node', 'HTMLElement', 'Element', 'MutationObserver', 'DOMParser', 'getComputedStyle', 'requestAnimationFrame', 'Range', 'Text', 'Event', 'KeyboardEvent', 'DocumentFragment', 'XMLSerializer', 'CSS', 'CustomEvent']) {
	try {
		globalThis[key] = dom.window[key];
	} catch {}
}
globalThis.addEventListener = (...args) => dom.window.addEventListener(...args);
globalThis.removeEventListener = (...args) => dom.window.removeEventListener(...args);
globalThis.dispatchEvent = (...args) => dom.window.dispatchEvent(...args);

const { createEditor, readable } = await import('../src/dev/editor/config.ts');
const { getMarkdown } = await import('@milkdown/kit/utils');

async function pass(markdown) {
	const root = document.createElement('div');
	document.body.append(root);
	const editor = await createEditor(root, markdown);
	const result = readable(editor.action(getMarkdown())).trim();
	await editor.destroy();
	root.remove();
	return result;
}

const dir = path.resolve('src/content/posts');
let failed = 0;
for (const file of (await fs.readdir(dir)).filter((name) => name.endsWith('.md')).sort()) {
	const raw = await fs.readFile(path.join(dir, file), 'utf8');
	const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '').trim();
	const first = await pass(body);
	const second = await pass(first);
	const ok = first === body && second === body;
	if (!ok) {
		failed++;
		let i = 0;
		while (i < body.length && body[i] === first[i]) i++;
		console.log(`FEHLER  ${file}: Abweichung bei Zeichen ${i}\n  vorher:  ${JSON.stringify(body.slice(Math.max(0, i - 25), i + 40))}\n  nachher: ${JSON.stringify(first.slice(Math.max(0, i - 25), i + 40))}`);
	} else {
		console.log(`ok      ${file}`);
	}
}
console.log(failed ? `\n${failed} Beitrag/Beiträge ändern sich bei der Rundreise.` : '\nAlle Beiträge sind nach der Rundreise unverändert.');
process.exit(failed ? 1 : 0);
