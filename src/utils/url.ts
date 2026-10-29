/** Baut einen internen Link unter dem Deploy-Pfad (GitHub Pages: /perspektive). */
export function url(path = '/'): string {
	const base = import.meta.env.BASE_URL.replace(/\/$/, '');
	return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
