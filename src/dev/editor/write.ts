/** Oberfläche des lokalen Editors: Markdown- und Word-Ansicht, Vorschau, Speichern. */
import { editorViewCtx } from '@milkdown/kit/core';
import { TextSelection } from '@milkdown/kit/prose/state';
import {
	insertHrCommand,
	toggleEmphasisCommand,
	toggleLinkCommand,
	toggleStrongCommand,
	turnIntoTextCommand,
	wrapInBlockquoteCommand,
	wrapInBulletListCommand,
	wrapInHeadingCommand,
	wrapInOrderedListCommand,
} from '@milkdown/kit/preset/commonmark';
import { callCommand, getMarkdown } from '@milkdown/kit/utils';
import { slugify } from '../../utils/slug';
import { createEditor, readable } from './config';
import './write.css';

type MilkdownEditor = Awaited<ReturnType<typeof createEditor>>;

const root = document.querySelector<HTMLElement>('[data-write]')!;
const api = root.dataset.api!;
const $ = <T extends HTMLElement>(selector: string) => root.querySelector<T>(selector)!;

const postsSelect = $<HTMLSelectElement>('[data-posts]');
const status = $<HTMLElement>('[data-status]');
const markdownArea = $<HTMLTextAreaElement>('[data-markdown]');
const wordRoot = $<HTMLElement>('[data-word]');
const toolbar = $<HTMLElement>('[data-toolbar]');
const preview = $<HTMLElement>('[data-preview]');
const previewTitle = $<HTMLElement>('[data-preview-title]');
const previewDek = $<HTMLElement>('[data-preview-dek]');
const field = (name: string) => $<HTMLInputElement & HTMLTextAreaElement>(`[data-field="${name}"]`);

const state = {
	isNew: true,
	mode: 'markdown' as 'markdown' | 'word',
	markdown: '',
	dirty: false,
	slugEdited: false,
};

let editor: MilkdownEditor | null = null;
let building = false;
let previewTimer = 0;
let previewRun = 0;
let openRun = 0;

/** Entfernt führende Leerzeilen und Leerraum am Ende (die Einrückung der ersten Zeile bleibt). */
const tidy = (text: string) => text.replace(/^(?:[ \t]*\r?\n)+/, '').trimEnd();

function say(message: string, isError = false) {
	status.textContent = message;
	status.classList.toggle('is-error', isError);
}

async function request(path: string, init: { method?: string; body?: unknown } = {}) {
	const response = await fetch(`${api}/${path}`, {
		method: init.method ?? 'GET',
		headers: { 'X-Write': '1', ...(init.body ? { 'Content-Type': 'application/json' } : {}) },
		body: init.body ? JSON.stringify(init.body) : undefined,
	});
	const data = await response.json().catch(() => ({}));
	if (!response.ok) throw new Error(data.error ?? `Fehler ${response.status}`);
	return data;
}

function markDirty() {
	state.dirty = true;
}

// --- Vorschau (serverseitig, gleiche Pipeline wie die Seite) --------------------------------

function schedulePreview() {
	clearTimeout(previewTimer);
	previewTimer = window.setTimeout(renderPreview, 250);
}

async function renderPreview() {
	previewTitle.textContent = field('title').value;
	previewDek.textContent = field('description').value;
	const run = ++previewRun;
	try {
		const { html } = await request('preview', { method: 'POST', body: { markdown: state.markdown } });
		// Eigenes Markdown, serverseitig wie auf der echten Seite gerendert; rohes HTML wird bewusst nicht gefiltert.
		// Fremden Text deshalb nicht ungeprüft in die Markdown-Ansicht einfügen.
		if (run === previewRun) preview.innerHTML = html;
	} catch (error) {
		if (run === previewRun) say(`Vorschau nicht möglich: ${(error as Error).message}`, true);
	}
}

// --- Dokument ---------------------------------------------------------------------------------

async function setMarkdown(value: string) {
	state.markdown = markdownArea.value = value;
	if (state.mode === 'word') await buildWord();
	schedulePreview();
}

function fields() {
	return {
		title: field('title').value.trim(),
		description: field('description').value.trim(),
		pubDate: field('pubDate').value,
		updatedDate: field('updatedDate').value || undefined,
		tags: field('tags')
			.value.split(',')
			.map((tag) => tag.trim())
			.filter(Boolean),
		draft: field('draft').checked,
	};
}

function fillFields(data: { title: string; description: string; pubDate: string; updatedDate?: string; tags: string[]; draft: boolean }, slug: string) {
	field('title').value = data.title;
	field('description').value = data.description;
	field('pubDate').value = data.pubDate;
	field('updatedDate').value = data.updatedDate ?? '';
	field('tags').value = data.tags.join(', ');
	field('draft').checked = data.draft;
	field('slug').value = slug;
	field('slug').disabled = !state.isNew; // der Dateiname eines vorhandenen Beitrags bleibt fest
}

function newPost() {
	state.isNew = true;
	state.slugEdited = false;
	fillFields({ title: '', description: '', pubDate: new Date().toLocaleDateString('sv'), tags: [], draft: true }, ''); // sv = JJJJ-MM-TT, lokale Zeit
	postsSelect.value = '';
	void setMarkdown('').then(() => {
		state.dirty = false;
		say('Neuer Beitrag. Er startet als Entwurf.');
	});
}

async function openPost(slug: string) {
	const run = ++openRun;
	try {
		const data = await request(`post?slug=${encodeURIComponent(slug)}`);
		if (run !== openRun) return; // inzwischen wurde ein anderer Beitrag gewählt
		state.isNew = false;
		fillFields(data.frontmatter, slug);
		await setMarkdown(tidy(data.body));
		state.dirty = false;
		say(`„${data.frontmatter.title}“ geöffnet.`);
	} catch (error) {
		say((error as Error).message, true);
	}
}

async function loadPosts(select?: string) {
	const { posts } = await request('posts');
	postsSelect.replaceChildren(
		new Option('— Neuer Beitrag —', ''),
		...posts.map((post: { slug: string; title: string; draft: boolean }) => new Option(`${post.title}${post.draft ? ' (Entwurf)' : ''}`, post.slug)),
	);
	postsSelect.value = select ?? '';
}

async function save() {
	const data = fields();
	const slug = field('slug').value.trim();
	syncFromWord();
	const message = `Gespeichert: src/content/posts/${slug}.md. Als Nächstes: committen und pushen.`;
	// Der Dev-Server lädt die Seite nach dem Schreiben neu: Stand schon vorher merken, danach wird der Beitrag wieder geöffnet.
	const wasDirty = state.dirty;
	state.dirty = false; // sonst warnt der Browser beim automatischen Neuladen
	try {
		sessionStorage.setItem('write:after-save', JSON.stringify({ slug, mode: state.mode, message }));
	} catch {}
	try {
		await request('save', { method: 'POST', body: { slug, isNew: state.isNew, frontmatter: data, body: state.markdown } });
		state.isNew = false;
		field('slug').disabled = true;
		await loadPosts(slug);
		say(message);
	} catch (error) {
		state.dirty = wasDirty;
		try {
			sessionStorage.removeItem('write:after-save');
		} catch {}
		say((error as Error).message, true);
	}
}

// --- Word-Ansicht -----------------------------------------------------------------------------

/** Baut die Word-Ansicht frisch aus state.markdown auf (so startet auch die Rückgängig-Liste leer). */
async function buildWord() {
	await destroyWord();
	building = true;
	try {
		editor = await createEditor(wordRoot, state.markdown, (value) => {
			if (building) return;
			const next = readable(value).trim();
			if (next === state.markdown) return; // nur eine andere Schreibweise desselben Textes
			state.markdown = next;
			markDirty();
			schedulePreview();
		});
		// Der Editor schreibt den Text leicht vereinheitlicht; das ist der neue Ausgangsstand, keine Änderung des Nutzers.
		state.markdown = markdownArea.value = readable(editor.action(getMarkdown())).trim();
	} finally {
		building = false;
	}
}

async function destroyWord() {
	const old = editor;
	editor = null;
	if (old) await old.destroy();
	wordRoot.replaceChildren();
}

/** Holt das Markdown direkt aus der Word-Ansicht (der Listener meldet Änderungen nur verzögert). */
function syncFromWord() {
	if (state.mode !== 'word' || !editor) return;
	state.markdown = markdownArea.value = readable(editor.action(getMarkdown())).trim();
}

async function setMode(mode: 'markdown' | 'word') {
	if (mode === state.mode) return;
	if (mode === 'word') {
		state.markdown = tidy(markdownArea.value);
		await buildWord();
		schedulePreview();
	} else {
		syncFromWord();
		await destroyWord();
	}
	state.mode = mode;
	markdownArea.hidden = mode === 'word';
	wordRoot.hidden = mode === 'markdown';
	toolbar.hidden = mode === 'markdown';
	root.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
	if (mode === 'word') wordRoot.querySelector<HTMLElement>('.ProseMirror')?.focus();
	else markdownArea.focus();
}

function insertFootnote(milkdown: MilkdownEditor) {
	milkdown.action((ctx) => {
		const view = ctx.get(editorViewCtx);
		const { schema } = view.state;
		const reference = schema.nodes.footnote_reference;
		const definition = schema.nodes.footnote_definition;
		let highest = 0;
		view.state.doc.descendants((node) => {
			if (node.type === reference || node.type === definition) highest = Math.max(highest, parseInt(node.attrs.label, 10) || 0);
		});
		const label = String(highest + 1);
		const { $to } = view.state.selection;
		if (!$to.parent.inlineContent || $to.parent.type.spec.code) return; // nur in normalem Text, nicht in Codeblöcken
		// Nach dem markierten Text einfügen, damit die Auswahl nicht überschrieben wird.
		const tr = view.state.tr.insert($to.pos, reference.create({ label }));
		const end = tr.doc.content.size;
		tr.insert(end, definition.create({ label }, schema.nodes.paragraph.create()));
		tr.setSelection(TextSelection.create(tr.doc, end + 2)); // Cursor in den neuen Fußnotentext
		view.dispatch(tr.scrollIntoView());
		view.focus();
	});
}

async function runCommand(name: string) {
	const milkdown = editor;
	if (!milkdown) return;
	switch (name) {
		case 'paragraph':
			return milkdown.action(callCommand(turnIntoTextCommand.key));
		case 'h2':
			return milkdown.action(callCommand(wrapInHeadingCommand.key, 2));
		case 'h3':
			return milkdown.action(callCommand(wrapInHeadingCommand.key, 3));
		case 'bold':
			return milkdown.action(callCommand(toggleStrongCommand.key));
		case 'italic':
			return milkdown.action(callCommand(toggleEmphasisCommand.key));
		case 'link': {
			const href = window.prompt('Adresse des Links (https://… oder /perspektive/…):');
			return href ? milkdown.action(callCommand(toggleLinkCommand.key, { href })) : undefined;
		}
		case 'quote':
			return milkdown.action(callCommand(wrapInBlockquoteCommand.key));
		case 'bullets':
			return milkdown.action(callCommand(wrapInBulletListCommand.key));
		case 'numbers':
			return milkdown.action(callCommand(wrapInOrderedListCommand.key));
		case 'rule':
			return milkdown.action(callCommand(insertHrCommand.key));
		case 'footnote':
			return insertFootnote(milkdown);
	}
}

// --- Verdrahtung ------------------------------------------------------------------------------

markdownArea.addEventListener('input', () => {
	state.markdown = markdownArea.value;
	markDirty();
	schedulePreview();
});

root.querySelectorAll<HTMLElement>('[data-field]').forEach((input) =>
	input.addEventListener('input', () => {
		markDirty();
		if (input.dataset.field === 'slug') state.slugEdited = true;
		if (input.dataset.field === 'title' && state.isNew && !state.slugEdited) field('slug').value = slugify(field('title').value).slice(0, 80).replace(/-$/, '');
		schedulePreview();
	}),
);

root.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode as 'markdown' | 'word')));
toolbar.addEventListener('click', (event) => {
	const button = (event.target as Element).closest<HTMLButtonElement>('[data-cmd]');
	if (button) runCommand(button.dataset.cmd!);
});
toolbar.addEventListener('mousedown', (event) => event.preventDefault()); // Auswahl im Text nicht verlieren

$<HTMLButtonElement>('[data-save]').addEventListener('click', save);
$<HTMLButtonElement>('[data-new]').addEventListener('click', () => {
	if (!state.dirty || confirm('Es gibt ungespeicherte Änderungen. Trotzdem neu beginnen?')) newPost();
});
postsSelect.addEventListener('change', () => {
	const slug = postsSelect.value;
	if (state.dirty && !confirm('Es gibt ungespeicherte Änderungen. Trotzdem wechseln?')) {
		postsSelect.value = state.isNew ? '' : field('slug').value;
		return;
	}
	if (slug) openPost(slug);
	else newPost();
});
document.addEventListener('keydown', (event) => {
	if ((event.metaKey || event.ctrlKey) && event.key === 's') {
		event.preventDefault();
		save();
	}
});
window.addEventListener('beforeunload', (event) => {
	if (state.dirty) event.preventDefault();
});

newPost();
loadPosts()
	.then(async () => {
		let saved: { slug: string; mode: 'markdown' | 'word'; message: string } | null = null;
		try {
			saved = JSON.parse(sessionStorage.getItem('write:after-save') ?? 'null');
			sessionStorage.removeItem('write:after-save');
		} catch {}
		if (!saved) return;
		postsSelect.value = saved.slug;
		await openPost(saved.slug);
		if (saved.mode === 'word') await setMode('word');
		say(saved.message);
	})
	.catch((error) => say(error.message, true));
