/**
 * Suchleiste im Kopf: tippen zeigt sofort die besten Treffer, Enter öffnet die volle Suche.
 * Ohne JavaScript ist es ein normales Formular (GET auf /suche/?q=…). Nutzt den Pagefind-Index, im Dev-Server
 * gibt es ihn nicht (dann erscheint ein Hinweis, Enter geht trotzdem zur Suchseite).
 */
import { loadPagefind, type PagefindData } from './pagefind';

const form = document.querySelector<HTMLFormElement>('[data-header-search]');
const input = form?.querySelector<HTMLInputElement>('input');
const list = form?.querySelector<HTMLUListElement>('[data-header-results]');
const status = form?.querySelector<HTMLElement>('[data-header-status]');

const MAX = 5;
const dateFormat = new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeZone: 'UTC' });

if (form && input && list && status) {
	let options: HTMLAnchorElement[] = [];
	let active = -1;
	let run = 0;
	let timer = 0;

	const searchPage = (query: string) => `${form.action}?q=${encodeURIComponent(query)}`;

	function close() {
		list!.hidden = true;
		list!.replaceChildren();
		options = [];
		active = -1;
		input!.setAttribute('aria-expanded', 'false');
		input!.removeAttribute('aria-activedescendant');
	}

	function setActive(index: number) {
		active = index;
		options.forEach((option, i) => option.setAttribute('aria-selected', String(i === index)));
		if (index >= 0) {
			input!.setAttribute('aria-activedescendant', options[index].id);
			options[index].scrollIntoView({ block: 'nearest' });
		} else {
			input!.removeAttribute('aria-activedescendant');
		}
	}

	function item(child: HTMLElement) {
		const li = document.createElement('li');
		li.setAttribute('role', 'none');
		li.append(child);
		return li;
	}

	function message(text: string) {
		const p = document.createElement('p');
		p.className = 'search-box__message';
		p.textContent = text;
		list!.replaceChildren(item(p));
		list!.hidden = false;
		input!.setAttribute('aria-expanded', 'true');
		status!.textContent = text;
	}

	function render(data: PagefindData[], total: number, query: string) {
		options = data.map((entry, i) => {
			const link = document.createElement('a');
			link.id = `kopf-treffer-${i}`;
			link.href = entry.url;
			link.setAttribute('role', 'option');
			link.setAttribute('aria-selected', 'false');
			const title = document.createElement('span');
			title.className = 'search-box__title';
			title.textContent = entry.meta.title ?? entry.url;
			link.append(title);
			if (entry.meta.date) {
				const time = document.createElement('time');
				time.className = 'search-box__meta';
				time.dateTime = entry.meta.date;
				time.textContent = dateFormat.format(new Date(entry.meta.date));
				link.append(time);
			}
			return link;
		});
		const all = document.createElement('a');
		all.id = 'kopf-treffer-alle';
		all.href = searchPage(query);
		all.className = 'search-box__all';
		all.setAttribute('role', 'option');
		all.setAttribute('aria-selected', 'false');
		all.textContent = total === 1 ? 'Treffer in der Suche öffnen' : `Alle ${total} Treffer anzeigen`;
		options.push(all);
		list!.replaceChildren(...options.map(item));
		list!.hidden = false;
		active = -1;
		input!.setAttribute('aria-expanded', 'true');
		status!.textContent = `${total} Treffer. Mit den Pfeiltasten auswählen.`;
	}

	async function search() {
		const query = input!.value.trim();
		const current = ++run;
		if (!query) {
			close();
			status!.textContent = '';
			return;
		}
		const engine = await loadPagefind(form!.dataset.pagefind!);
		if (current !== run) return;
		if (!engine) {
			message(import.meta.env.DEV ? 'Treffer gibt es nur im gebauten Blog. Enter öffnet die Suche.' : 'Die Suche ist gerade nicht verfügbar.');
			return;
		}
		try {
			const { results } = await engine.search(query);
			const data = await Promise.all(results.slice(0, MAX).map((result) => result.data()));
			if (current !== run) return;
			if (results.length === 0) message(`Keine Treffer für „${query}“.`);
			else render(data, results.length, query);
		} catch {
			if (current === run) message('Die Suche ist gerade nicht verfügbar.');
		}
	}

	input.addEventListener('input', () => {
		clearTimeout(timer);
		timer = window.setTimeout(search, 120);
	});

	input.addEventListener('keydown', (event) => {
		const open = !list.hidden && options.length > 0;
		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			if (!open) {
				if (input.value.trim()) search();
				return;
			}
			event.preventDefault();
			const step = event.key === 'ArrowDown' ? 1 : -1;
			setActive(active === -1 ? (step === 1 ? 0 : options.length - 1) : (active + step + options.length) % options.length);
		} else if (event.key === 'Enter' && active >= 0) {
			event.preventDefault();
			options[active].click();
		} else if (event.key === 'Escape') {
			if (!list.hidden) {
				event.preventDefault();
				close();
			} else if (input.value) {
				input.value = '';
			} else {
				input.blur();
			}
		}
	});

	// Maus: Treffer unter dem Zeiger hervorheben; Fokus bleibt im Feld, damit ein Klick nicht erst schließt.
	list.addEventListener('mousemove', (event) => {
		const index = options.findIndex((option) => option.contains(event.target as Node));
		if (index !== -1 && index !== active) setActive(index);
	});
	list.addEventListener('mousedown', (event) => event.preventDefault());

	form.addEventListener('focusout', (event) => {
		if (!form.contains(event.relatedTarget as Node | null)) close();
	});
	input.addEventListener('focus', () => {
		if (input.value.trim() && list.hidden) search();
	});

	// "/" springt in die Suche (wie auf vielen Seiten), außer man tippt gerade irgendwo.
	document.addEventListener('keydown', (event) => {
		if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
		const target = event.target as HTMLElement | null;
		if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
		event.preventDefault();
		input.focus();
		input.select();
	});
}
