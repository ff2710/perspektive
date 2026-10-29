/**
 * Fußnotenblock am Artikelende ein- und ausklappen.
 *
 * Progressive Enhancement: Im ausgelieferten HTML steht der Block offen (ohne JavaScript,
 * für die Suche und beim Drucken). Erst dieses Skript macht aus der Überschrift einen Button
 * und klappt den Block zu. `hidden="until-found"` lässt die Seitensuche des Browsers
 * (Cmd+F) den Block trotzdem öffnen.
 */

const section = document.querySelector<HTMLElement>('section[data-footnotes]');
const heading = section?.querySelector('h2');
const list = section?.querySelector('ol');

if (section && heading && list) {
	const count = list.querySelectorAll(':scope > li').length;
	list.id ||= 'footnote-list';

	const button = document.createElement('button');
	button.type = 'button';
	button.className = 'footnotes__toggle';
	button.setAttribute('aria-controls', list.id);

	const label = document.createElement('span');
	label.textContent = `${heading.textContent?.trim()} (${count})`;
	button.append(label);
	button.insertAdjacentHTML(
		'beforeend',
		'<svg class="footnotes__arrow" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" focusable="false"><path d="M2 4.25 6 8.25l4-4" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>',
	);
	heading.replaceChildren(button);
	section.classList.add('footnotes--enhanced');

	const isOpen = () => button.getAttribute('aria-expanded') === 'true';

	function open() {
		list!.removeAttribute('hidden');
		button.setAttribute('aria-expanded', 'true');
	}

	function close() {
		list!.setAttribute('hidden', 'until-found');
		button.setAttribute('aria-expanded', 'false');
	}

	function openIfTargeted() {
		let id: string;
		try {
			id = decodeURIComponent(location.hash.slice(1));
		} catch {
			return; // kaputter Hash (z. B. "#%"): einfach ignorieren
		}
		if (id && list!.contains(document.getElementById(id))) open();
	}

	button.addEventListener('click', () => (isOpen() ? close() : open()));
	list.addEventListener('beforematch', open);
	window.addEventListener('hashchange', openIfTargeted);

	close();
	openIfTargeted();

	// Klick auf eine Fußnotenzahl im Text: Block aufklappen, der Browser springt dann zur Fußnote.
	document.addEventListener('click', (event) => {
		const ref = (event.target as Element | null)?.closest?.('a[data-footnote-ref]');
		if (ref && !isOpen()) open();
	});
}
