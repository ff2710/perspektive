/**
 * Inhaltsverzeichnis: markiert den Abschnitt, in dem man gerade liest (aria-current="location").
 *
 * Arbeitet mit IntersectionObserver statt mit einem Scroll-Handler: Der Browser meldet nur, wenn eine
 * Überschrift die Linie (30 % von oben) überquert. So wird beim Scrollen nichts gemessen und kein
 * Layout erzwungen, das Lesen bleibt flüssig.
 */

const toc = document.querySelector<HTMLElement>('[data-toc]');

if (toc) {
	const entries = [...toc.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')].flatMap((link) => {
		try {
			const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
			return target ? [{ link, target, above: false }] : [];
		} catch {
			return []; // kaputte Kodierung: Eintrag überspringen
		}
	});

	let atEnd = false;
	let last: (typeof entries)[number] | null | undefined;

	function update() {
		// Die letzte Überschrift, die über der Linie liegt; ganz am Ende des Beitrags zählt der letzte Eintrag.
		let current: (typeof entries)[number] | null = atEnd && entries.length ? entries[entries.length - 1] : null;
		if (!current) for (const entry of entries) if (entry.above) current = entry;
		if (current === last) return;
		last = current;
		for (const entry of entries) {
			if (entry === current) entry.link.setAttribute('aria-current', 'location');
			else entry.link.removeAttribute('aria-current');
		}
	}

	// Die Beobachtungszone reicht von weit über dem Fenster bis zur Linie (30 % von oben). Eine Überschrift "schneidet"
	// sie genau dann, wenn ihre Oberkante über der Linie liegt. Das ist ein einfacher Zustandswechsel und
	// funktioniert auch bei großen Sprüngen (Bild-Taste, Anker, schnelle Geste).
	const headings = new IntersectionObserver(
		(changes) => {
			for (const change of changes) {
				const entry = entries.find((e) => e.target === change.target);
				if (entry) entry.above = change.isIntersecting;
			}
			update();
		},
		{ rootMargin: '10000px 0px -70% 0px' },
	);
	for (const entry of entries) headings.observe(entry.target);

	// Ende des Beitrags erreicht (der Fußbereich kommt ins Bild): der letzte Eintrag gilt.
	const end = document.querySelector('.article__foot');
	if (end) {
		new IntersectionObserver((changes) => {
			atEnd = changes.some((change) => change.isIntersecting);
			update();
		}).observe(end);
	}
}
