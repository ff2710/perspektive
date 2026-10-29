/** Inhaltsverzeichnis: markiert den Abschnitt, in dem man gerade liest (aria-current="location"). */

const toc = document.querySelector<HTMLElement>('[data-toc]');

if (toc) {
	const entries = [...toc.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')].flatMap((link) => {
		try {
			const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
			return target ? [{ link, target }] : [];
		} catch {
			return []; // kaputte Kodierung: Eintrag überspringen
		}
	});

	let queued = false;
	let last: (typeof entries)[number] | null | undefined;

	function update() {
		queued = false;
		const line = innerHeight * 0.3;
		let current: (typeof entries)[number] | null = null;
		for (const entry of entries) {
			if (entry.target.getBoundingClientRect().top <= line) current = entry;
			else break;
		}
		// Ganz unten steht die letzte Überschrift evtl. nie über der Linie: dann zählt der letzte Eintrag.
		if (entries.length && innerHeight + scrollY >= document.documentElement.scrollHeight - 2) current = entries[entries.length - 1];
		if (current === last) return;
		last = current;
		for (const entry of entries) {
			if (entry === current) entry.link.setAttribute('aria-current', 'location');
			else entry.link.removeAttribute('aria-current');
		}
	}

	function queue() {
		if (queued) return;
		queued = true;
		requestAnimationFrame(update);
	}

	addEventListener('scroll', queue, { passive: true });
	addEventListener('resize', queue);
	update();
}
