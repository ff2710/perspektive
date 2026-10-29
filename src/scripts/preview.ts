/**
 * Hover-Vorschau für Fußnotenzahlen und Inline-Links im Artikeltext.
 * Ein einziges Fenster, kein Netzwerkzugriff: Fußnotentext kommt aus der Seite,
 * interne Titel aus dem Link-Index, externe Links zeigen Domain und Pfad
 * (oder den Titel aus dem Markdown-Link, falls Fidel einen vergeben hat).
 */

const SHOW_DELAY = 150;
const HIDE_DELAY = 150;
const GAP = 14;
const MARGIN = 12;
const FOOTNOTE_LINE_HEIGHT = 0.95 * 16 * 1.5;

const tip = document.createElement('div');
tip.id = 'link-preview';
tip.className = 'preview';
tip.setAttribute('role', 'tooltip');
tip.hidden = true;
document.body.append(tip);

let linkIndex: Record<string, { title: string; date?: string }> = {};
try {
	linkIndex = JSON.parse(document.getElementById('link-index')?.textContent ?? '{}');
} catch {
	linkIndex = {};
}

// Der native Titel-Tooltip würde die Vorschau doppeln: Titel in ein data-Attribut verschieben.
document.querySelectorAll<HTMLAnchorElement>('.prose a[title]').forEach((a) => {
	a.dataset.previewTitle = a.title;
	a.removeAttribute('title');
});

let pointer = { x: 0, y: 0 };
let current: HTMLAnchorElement | null = null;
let showTimer = 0;
let hideTimer = 0;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));

function el(tag: string, className: string, text: string) {
	const node = document.createElement(tag);
	node.className = className;
	node.textContent = text;
	return node;
}

/** Pfad kürzen: Anfang und Ende bleiben, die Mitte wird zu „…". */
function shortPath(path: string): string {
	const clean = path.replace(/\/$/, '');
	if (clean.length <= 40) return clean || '/';
	return `${clean.slice(0, 22)}…${clean.slice(-14)}`;
}

function footnoteText(a: HTMLAnchorElement): string | null {
	let id = '';
	try {
		id = decodeURIComponent(a.hash.slice(1));
	} catch {
		return null;
	}
	const item = id ? document.getElementById(id) : null;
	if (!item) return null;
	const copy = item.cloneNode(true) as HTMLElement;
	copy.querySelectorAll('[data-footnote-backref]').forEach((node) => node.remove());
	return (copy.textContent ?? '').replace(/\s+/g, ' ').trim() || null;
}

type Content = { nodes: HTMLElement[]; footnote: boolean };

function describe(a: HTMLAnchorElement): Content | null {
	if (a.hasAttribute('data-footnote-ref')) {
		const text = footnoteText(a);
		if (!text) return null;
		const lines = clamp(Math.floor((innerHeight * 0.3) / FOOTNOTE_LINE_HEIGHT), 4, 8);
		const body = el('p', 'preview__text', text);
		body.style.setProperty('--lines', String(lines));
		return { nodes: [el('p', 'preview__host', `Fußnote ${a.textContent}`), body, el('p', 'preview__more', 'Zum Weiterlesen anklicken')], footnote: true };
	}
	if (!/^https?:$/.test(a.protocol)) return null;
	if (a.origin !== location.origin) {
		const nodes = [el('p', 'preview__host', a.hostname.replace(/^www\./, ''))];
		if (a.dataset.previewTitle) nodes.push(el('p', 'preview__title', a.dataset.previewTitle));
		if (a.pathname !== '/' || a.search) nodes.push(el('p', 'preview__path', shortPath(a.pathname + a.search)));
		return { nodes, footnote: false };
	}
	if (a.pathname === location.pathname && a.hash) return null;
	const key = a.pathname.replace(/\/?$/, '/');
	const entry = linkIndex[key];
	const note = entry ? ['Auf diesem Blog', entry.date].filter(Boolean).join(' · ') : shortPath(a.pathname);
	return {
		nodes: [el('p', 'preview__host', entry?.title ?? 'Fidels Perspektive'), el('p', 'preview__path', note)],
		footnote: false,
	};
}

function targetFor(node: EventTarget | null): HTMLAnchorElement | null {
	if (!(node instanceof Element)) return null;
	const a = node.closest<HTMLAnchorElement>('.prose a[href]');
	return a && !a.hasAttribute('data-footnote-backref') ? a : null;
}

const viewportWidth = () => document.documentElement.clientWidth;

function place(a: HTMLAnchorElement, at: 'pointer' | 'element') {
	const w = tip.offsetWidth;
	const h = tip.offsetHeight;
	let x: number;
	let y: number;
	if (at === 'pointer') {
		x = pointer.x + GAP;
		y = pointer.y + GAP;
		if (x + w > viewportWidth() - MARGIN) x = pointer.x - w - GAP;
		if (y + h > innerHeight - MARGIN) y = pointer.y - h - GAP;
	} else {
		const rect = a.getBoundingClientRect();
		x = rect.left;
		y = rect.bottom + 8;
		if (y + h > innerHeight - MARGIN) y = rect.top - h - 8;
	}
	tip.style.left = `${clamp(x, MARGIN, viewportWidth() - w - MARGIN)}px`;
	tip.style.top = `${clamp(y, MARGIN, innerHeight - h - MARGIN)}px`;
}

function show(a: HTMLAnchorElement, at: 'pointer' | 'element') {
	const content = describe(a);
	if (current) hide();
	if (!content) return;
	tip.replaceChildren(...content.nodes);
	tip.classList.toggle('is-footnote', content.footnote);
	tip.classList.remove('is-clipped', 'is-visible');
	tip.hidden = false;
	const text = tip.querySelector<HTMLElement>('.preview__text');
	if (text && text.scrollHeight > text.clientHeight + 1) tip.classList.add('is-clipped');
	place(a, at);
	if (!a.hasAttribute('aria-describedby') && !content.footnote) {
		a.setAttribute('aria-describedby', tip.id);
		a.dataset.previewDescribed = '';
	}
	current = a;
	requestAnimationFrame(() => tip.classList.add('is-visible'));
}

function hide() {
	clearTimeout(showTimer);
	clearTimeout(hideTimer);
	if (current && current.dataset.previewDescribed !== undefined) {
		current.removeAttribute('aria-describedby');
		delete current.dataset.previewDescribed;
	}
	current = null;
	tip.hidden = true;
	tip.classList.remove('is-visible', 'is-clipped');
}

function scheduleHide() {
	clearTimeout(hideTimer);
	hideTimer = window.setTimeout(hide, HIDE_DELAY);
}

document.addEventListener(
	'pointermove',
	(event) => {
		pointer = { x: event.clientX, y: event.clientY };
	},
	{ passive: true },
);

document.addEventListener('pointerover', (event) => {
	if (event.pointerType === 'touch') return;
	if (tip.contains(event.target as Node)) return;
	const a = targetFor(event.target);
	if (!a) return;
	pointer = { x: event.clientX, y: event.clientY };
	clearTimeout(hideTimer);
	if (a === current) return;
	clearTimeout(showTimer);
	showTimer = window.setTimeout(() => show(a, 'pointer'), SHOW_DELAY);
});

document.addEventListener('pointerout', (event) => {
	if (event.pointerType === 'touch') return;
	const a = targetFor(event.target);
	if (!a || a.contains(event.relatedTarget as Node | null)) return;
	clearTimeout(showTimer);
	if (tip.contains(event.relatedTarget as Node | null)) return;
	scheduleHide();
});

tip.addEventListener('pointerenter', () => clearTimeout(hideTimer));
tip.addEventListener('pointerleave', scheduleHide);

document.addEventListener('focusin', (event) => {
	const a = targetFor(event.target);
	if (!a || !a.matches(':focus-visible')) return;
	clearTimeout(showTimer);
	showTimer = window.setTimeout(() => show(a, 'element'), SHOW_DELAY);
});

document.addEventListener('focusout', (event) => {
	if (targetFor(event.target)) hide();
});

document.addEventListener('keydown', (event) => {
	if (event.key === 'Escape' && !tip.hidden) hide();
});

document.addEventListener('pointerdown', (event) => {
	if (!tip.contains(event.target as Node)) hide();
});
window.addEventListener('scroll', () => !tip.hidden && hide(), { passive: true });
