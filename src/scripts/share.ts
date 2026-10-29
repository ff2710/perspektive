/** "Beitrag teilen": Teilen-Menü des Geräts (Handy), sonst Link in die Zwischenablage. Ohne beides bleibt der Knopf versteckt. */

const box = document.querySelector<HTMLElement>('[data-share]');
const button = box?.querySelector<HTMLButtonElement>('button');
const status = box?.querySelector<HTMLElement>('[data-share-status]');

if (box && button && status && (navigator.share || navigator.clipboard)) {
	box.hidden = false;
	const label = button.textContent;
	let reset = 0;

	const say = (text: string) => {
		button.textContent = text;
		status.textContent = text;
		clearTimeout(reset);
		reset = window.setTimeout(() => {
			button.textContent = label;
			status.textContent = '';
		}, 2500);
	};

	button.addEventListener('click', async () => {
		const link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href ?? location.href;
		if (navigator.share) {
			try {
				await navigator.share({ title: document.title, url: link });
				return;
			} catch (error) {
				if ((error as DOMException).name === 'AbortError') return; // abgebrochen
			}
		}
		try {
			await navigator.clipboard.writeText(link);
			say('Link kopiert');
		} catch {
			say('Kopieren nicht möglich');
		}
	});
}
