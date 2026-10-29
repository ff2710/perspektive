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
import { callCommand, getMarkdown, replaceAll } from '@milkdown/kit/utils';
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
let editorReady: Promise<MilkdownEditor> | null = null;
let ignoreChangesUntil = 0;
let previewTimer = 0;
let previewRun = 0;

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
		if (run === previewRun) preview.innerHTML = html; // eigenes, serverseitig gerendertes Markdown
	} catch (error) {
		if (run === previewRun) say(`Vorschau nicht möglich: ${(error as Error).message}`, true);
	}
}

// --- Dokument ---------------------------------------------------------------------------------

function setMarkdown(value: string, { updateViews = true } = {}) {
	state.markdown = value;
	if (updateViews) {
		markdownArea.value = value;
		if (editor) {
			ignoreChangesUntil = performance.now() + 700;
			editor.action(replaceAll(value));
		}
	}
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
	fillFields({ title: '', description: '', pubDate: new Date().toISOString().slice(0, 10), tags: [], draft: true }, '');
	postsSelect.value = '';
	setMarkdown('');
	state.dirty = false;
	say('Neuer Beitrag. Er startet als Entwurf.');
}

async function openPost(slug: string) {
	try {
		const data = await request(`post?slug=${encodeURIComponent(slug)}`);
		state.isNew = false;
		fillFields(data.frontmatter, slug);
		setMarkdown(data.body.trim());
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
	try {
		const result = await request('save', { method: 'POST', body: { slug, isNew: state.isNew, frontmatter: data, body: state.markdown } });
		state.isNew = false;
		state.dirty = false;
		field('slug').disabled = true;
		const message = `Gespeichert: ${result.path}. Als Nächstes: committen und pushen.`;
		// Der Dev-Server lädt die Seite nach dem Schreiben neu: Stand merken und danach wieder öffnen.
		try {
			sessionStorage.setItem('write:after-save', JSON.stringify({ slug, mode: state.mode, message }));
		} catch {}
		await loadPosts(slug);
		say(message);
	} catch (error) {
		say((error as Error).message, true);
	}
}

// --- Word-Ansicht -----------------------------------------------------------------------------

async function ensureEditor() {
	editorReady ??= createEditor(wordRoot, state.markdown, (value) => {
		if (performance.now() < ignoreChangesUntil) return;
		state.markdown = value;
		markDirty();
		schedulePreview();
	}).then((created) => (editor = created));
	return editorReady;
}

/** Holt das Markdown direkt aus der Word-Ansicht (der Listener meldet Änderungen nur verzögert). */
function syncFromWord() {
	if (state.mode !== 'word' || !editor) return;
	state.markdown = markdownArea.value = readable(editor.action(getMarkdown())).trim();
}

async function setMode(mode: 'markdown' | 'word') {
	if (mode === state.mode) return;
	if (mode === 'word') {
		state.markdown = markdownArea.value;
		ignoreChangesUntil = performance.now() + 700;
		const created = await ensureEditor();
		created.action(replaceAll(state.markdown));
	} else {
		syncFromWord();
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
		const tr = view.state.tr.replaceSelectionWith(reference.create({ label }), false);
		const end = tr.doc.content.size;
		tr.insert(end, definition.create({ label }, schema.nodes.paragraph.create()));
		tr.setSelection(TextSelection.create(tr.doc, end + 2)); // Cursor in den neuen Fußnotentext
		view.dispatch(tr.scrollIntoView());
		view.focus();
	});
}

async function runCommand(name: string) {
	const milkdown = await ensureEditor();
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
			const href = window.prompt('Adresse des Links (https://… oder /fidels-perspektive/…):');
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
		if (input.dataset.field === 'title' && state.isNew && !state.slugEdited) field('slug').value = slugify(field('title').value);
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
