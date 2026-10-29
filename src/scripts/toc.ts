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

	function update() {
		queued = false;
		const line = innerHeight * 0.3;
		let current: (typeof entries)[number] | null = null;
		for (const entry of entries) {
			if (entry.target.getBoundingClientRect().top <= line) current = entry;
			else break;
		}
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
