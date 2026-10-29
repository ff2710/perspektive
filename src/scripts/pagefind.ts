/** Gemeinsamer Lader für den statischen Pagefind-Index (Suchseite und Suchleiste im Kopf). */

export type PagefindData = { url: string; excerpt: string; meta: { title?: string; date?: string } };
export type Pagefind = { search(query: string): Promise<{ results: { data(): Promise<PagefindData> }[] }> };

let loaded: Pagefind | null = null;
let missing = false;

/** Lädt den Index einmal. Im Dev-Server gibt es ihn nie (dann null); live kann ein Netzfehler später wieder klappen. */
export async function loadPagefind(src: string): Promise<Pagefind | null> {
	if (loaded || missing) return loaded;
	try {
		loaded = (await import(/* @vite-ignore */ src)) as Pagefind;
	} catch {
		missing = import.meta.env.DEV;
	}
	return loaded;
}
