/**
 * Volltextsuche: eigene Oberfläche auf dem statischen Pagefind-Index.
 * Der Index entsteht erst beim Build (`npm run build` ruft pagefind auf), im Dev-Server gibt es ihn nicht.
 */

import { loadPagefind, type Pagefind, type PagefindData } from './pagefind';

const form = document.querySelector<HTMLFormElement>('[data-search]');
const input = form?.querySelector<HTMLInputElement>('input');
const status = document.querySelector<HTMLElement>('[data-search-status]');
const list = document.querySelector<HTMLOListElement>('[data-search-results]');

const MAX_RESULTS = 20;
const dateFormat = new Intl.DateTimeFormat('de-DE', { dateStyle: 'long', timeZone: 'UTC' });

if (form && input && status && list) {
	let run = 0;
	let timer = 0;

	function render(data: PagefindData[]) {
		list!.replaceChildren(
			...data.map((item) => {
				const li = document.createElement('li');
				li.className = 'post-list__item';

				const title = document.createElement('h2');
				title.className = 'post-list__title';
				const link = document.createElement('a');
				link.href = item.url;
				link.textContent = item.meta.title ?? item.url;
				title.append(link);

				const excerpt = document.createElement('p');
				excerpt.className = 'search__excerpt';
				excerpt.innerHTML = item.excerpt; // Pagefind liefert escapten Text mit <mark> um die Treffer

				li.append(title, excerpt);
				if (item.meta.date) {
					const meta = document.createElement('p');
					meta.className = 'meta';
					const time = document.createElement('time');
					time.dateTime = item.meta.date;
					time.textContent = dateFormat.format(new Date(item.meta.date));
					meta.append(time);
					li.append(meta);
				}
				return li;
			}),
		);
	}

	async function search() {
		const query = input!.value.trim();
		const current = ++run;

		const url = new URL(location.href);
		if (query) url.searchParams.set('q', query);
		else url.searchParams.delete('q');
		history.replaceState(null, '', url);

		if (!query) {
			list!.replaceChildren();
			status!.textContent = '';
			return;
		}

		const engine = await loadPagefind(form!.dataset.pagefind!);
		if (current !== run) return; // inzwischen wurde etwas Neueres getippt
		if (!engine) {
			status!.textContent = import.meta.env.DEV
				? 'Die Suche gibt es nur im gebauten Blog (npm run build, dann npm run preview).'
				: 'Die Suche ist gerade nicht verfügbar. Bitte versuche es später noch einmal.';
			return;
		}

		let results: Awaited<ReturnType<Pagefind['search']>>['results'];
		let data: PagefindData[];
		try {
			({ results } = await engine.search(query));
			data = await Promise.all(results.slice(0, MAX_RESULTS).map((result) => result.data()));
		} catch {
			if (current === run) status!.textContent = 'Die Suche ist gerade nicht verfügbar. Bitte versuche es später noch einmal.';
			return;
		}
		if (current !== run) return;

		render(data);
		status!.textContent =
			results.length === 0
				? `Keine Treffer für „${query}“. Versuche einen anderen Begriff.`
				: `${results.length} Treffer für „${query}“${results.length > MAX_RESULTS ? ` (die ersten ${MAX_RESULTS} werden gezeigt)` : ''}.`;
	}

	input.addEventListener('input', () => {
		clearTimeout(timer);
		timer = window.setTimeout(search, 150);
	});
	form.addEventListener('submit', (event) => {
		event.preventDefault();
		clearTimeout(timer);
		search();
	});

	const initial = new URL(location.href).searchParams.get('q');
	if (initial) {
		input.value = initial;
		search();
	}
	if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
		input.focus(); // auf Touch-Geräten nicht: die Tastatur würde die Treffer verdecken
	}
}
