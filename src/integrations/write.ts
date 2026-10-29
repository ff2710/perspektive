/**
 * Lokaler Editor unter /write: gibt es NUR im Dev-Server.
 *
 * - Die Seite wird nur im Befehl "dev" als Route eingehängt, im Build existiert sie nicht.
 * - Die Schreib-API (src/content/posts/) läuft als Middleware des Dev-Servers und ist gegen
 *   fremde Webseiten abgesichert (Host-/Origin-Prüfung, eigener Header, feste Pfade).
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import YAML from 'yaml';
import { markdownProcessor } from '../markdown.config.mjs';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);
const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
const MAX_BODY = 2 * 1024 * 1024;

type Frontmatter = {
	title: string;
	description: string;
	pubDate: string;
	updatedDate?: string;
	tags: string[];
	draft: boolean;
};

class HttpError extends Error {
	constructor(
		public status: number,
		message: string,
	) {
		super(message);
	}
}

function hostnameOf(value: string | undefined): string | null {
	if (!value) return null;
	try {
		return new URL(value.includes('://') ? value : `http://${value}`).hostname.replace(/^\[|\]$/g, '');
	} catch {
		return null;
	}
}

function assertLocal(req: import('node:http').IncomingMessage) {
	// Nur Verbindungen vom eigenen Rechner (schützt auch bei `astro dev --host` im WLAN).
	if (!req.socket.remoteAddress || !LOOPBACK.has(req.socket.remoteAddress)) throw new HttpError(403, 'Nur vom eigenen Rechner erreichbar.');
	const host = hostnameOf(req.headers.host);
	if (!host || (!LOCAL_HOSTS.has(host) && !LOCAL_HOSTS.has(`[${host}]`))) throw new HttpError(403, 'Nur lokal erreichbar.');
	// Die Herkunft muss exakt zum Host (inkl. Port) passen: andere lokale Seiten dürfen nicht schreiben.
	const origin = req.headers.origin;
	if (origin && origin !== `http://${req.headers.host}`) throw new HttpError(403, 'Fremde Herkunft.');
	// Eigener Header erzwingt bei Anfragen von fremden Seiten eine Vorabprüfung (Preflight), die wir nicht freigeben.
	if (req.headers['x-write'] !== '1') throw new HttpError(403, 'Header fehlt.');
}

async function readJson(req: import('node:http').IncomingMessage): Promise<any> {
	const chunks: Buffer[] = [];
	let size = 0;
	for await (const chunk of req) {
		size += chunk.length;
		if (size > MAX_BODY) throw new HttpError(413, 'Zu groß.');
		chunks.push(chunk);
	}
	try {
		return JSON.parse(Buffer.concat(chunks).toString('utf8'));
	} catch {
		throw new HttpError(400, 'Kein gültiges JSON.');
	}
}

function parseFile(raw: string): { frontmatter: Frontmatter; body: string } {
	const match = raw.match(FRONTMATTER);
	if (!match) return { frontmatter: { title: '', description: '', pubDate: '', tags: [], draft: true }, body: raw };
	const data = YAML.parse(match[1]) ?? {};
	const date = (value: unknown) => (value instanceof Date ? value.toISOString().slice(0, 10) : value ? String(value) : undefined);
	return {
		frontmatter: {
			title: String(data.title ?? ''),
			description: String(data.description ?? ''),
			pubDate: date(data.pubDate) ?? '',
			updatedDate: date(data.updatedDate),
			tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
			draft: Boolean(data.draft),
		},
		body: tidy(match[2]),
	};
}

/** Führende Leerzeilen und Leerraum am Ende weg; die Einrückung der ersten Zeile bleibt (Codeblock). */
const tidy = (text: string) => text.replace(/^(?:[ \t]*\r?\n)+/, '').trimEnd();

/** Gültiges Kalenderdatum (JJJJ-MM-TT), also auch kein 2026-02-31. */
function validDate(value: unknown): value is string {
	if (typeof value !== 'string' || !DATE.test(value)) return false;
	const date = new Date(`${value}T00:00:00Z`);
	return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function serialize(frontmatter: Frontmatter, body: string, existing?: string): string {
	// Bei einem vorhandenen Beitrag das alte Frontmatter als Grundlage nehmen: unbekannte Felder und Kommentare bleiben.
	let doc = new YAML.Document({});
	const old = existing?.match(FRONTMATTER);
	if (old) {
		const parsed = YAML.parseDocument(old[1]);
		if (parsed.errors.length === 0 && YAML.isMap(parsed.contents)) doc = parsed;
	}
	doc.set('title', frontmatter.title);
	doc.set('description', frontmatter.description);
	doc.set('pubDate', frontmatter.pubDate);
	if (frontmatter.updatedDate) doc.set('updatedDate', frontmatter.updatedDate);
	else doc.delete('updatedDate');
	const tags = doc.createNode(frontmatter.tags) as YAML.YAMLSeq;
	tags.flow = true;
	doc.set('tags', tags);
	doc.set('draft', frontmatter.draft);
	return `---\n${doc.toString({ lineWidth: 0, flowCollectionPadding: false }).trimEnd()}\n---\n\n${tidy(body)}\n`;
}

function validate(input: any): { slug: string; frontmatter: Frontmatter; body: string } {
	const slug = String(input?.slug ?? '');
	if (!SLUG.test(slug) || slug.length > 80) throw new HttpError(400, 'Ungültiger Dateiname (nur a–z, 0–9 und Bindestriche).');
	const fm = input?.frontmatter ?? {};
	const title = String(fm.title ?? '').trim();
	const description = String(fm.description ?? '').trim();
	if (!title) throw new HttpError(400, 'Der Titel fehlt.');
	if (!description) throw new HttpError(400, 'Die Beschreibung fehlt.');
	if (!validDate(fm.pubDate)) throw new HttpError(400, 'Das Datum fehlt oder ist ungültig.');
	if (fm.updatedDate && !validDate(fm.updatedDate)) throw new HttpError(400, 'Das Aktualisierungsdatum ist ungültig.');
	const tags = (Array.isArray(fm.tags) ? fm.tags : []).map((t: unknown) => String(t).trim()).filter(Boolean);
	return {
		slug,
		frontmatter: { title, description, pubDate: fm.pubDate, updatedDate: fm.updatedDate || undefined, tags, draft: Boolean(fm.draft) },
		body: String(input?.body ?? ''),
	};
}

export function write(): AstroIntegration {
	let postsDir = '';
	let base = '';
	let renderer: Awaited<ReturnType<typeof markdownProcessor.createRenderer>> | undefined;

	return {
		name: 'fidels-write',
		hooks: {
			'astro:config:setup': ({ command, config, injectRoute, updateConfig }) => {
				if (command !== 'dev') return; // im Build gibt es keinen Editor
				updateConfig({ vite: { server: { cors: false } } });
				postsDir = path.join(fileURLToPath(config.root), 'src/content/posts');
				base = config.base.replace(/\/$/, '');
				injectRoute({ pattern: '/write', entrypoint: './src/dev/write.astro' });
			},
			'astro:server:setup': ({ server }) => {
				server.middlewares.use(async (req, res, next) => {
					const url = new URL(req.url ?? '/', 'http://localhost');
					// Vite entfernt den Basispfad evtl. schon vor der Middleware: beide Schreibweisen zulassen.
					const pathname = base && url.pathname.startsWith(`${base}/`) ? url.pathname.slice(base.length) : url.pathname;
					if (!pathname.startsWith('/write-api/')) return next();
					const send = (status: number, body: unknown) => {
						res.statusCode = status;
						res.setHeader('Content-Type', 'application/json; charset=utf-8');
						res.setHeader('Cache-Control', 'no-store');
						res.end(JSON.stringify(body));
					};
					try {
						assertLocal(req);
						const route = pathname.slice('/write-api/'.length);

						if (req.method === 'GET' && route === 'posts') {
							const files = (await fs.readdir(postsDir)).filter((f) => f.endsWith('.md'));
							const posts = await Promise.all(
								files.map(async (file) => {
									const slug = file.slice(0, -3);
									try {
										const { frontmatter } = parseFile(await fs.readFile(path.join(postsDir, file), 'utf8'));
										return { slug, title: frontmatter.title, pubDate: frontmatter.pubDate, draft: frontmatter.draft };
									} catch {
										return { slug, title: `(Fehler im Kopfbereich von ${file})`, pubDate: '', draft: true };
									}
								}),
							);
							return send(200, { posts: posts.sort((a, b) => b.pubDate.localeCompare(a.pubDate)) });
						}

						if (req.method === 'GET' && route === 'post') {
							const slug = url.searchParams.get('slug') ?? '';
							if (!SLUG.test(slug)) throw new HttpError(400, 'Ungültiger Dateiname.');
							try {
								return send(200, { slug, ...parseFile(await fs.readFile(path.join(postsDir, `${slug}.md`), 'utf8')) });
							} catch {
								throw new HttpError(404, 'Beitrag nicht gefunden.');
							}
						}

						if (req.method === 'POST' && route === 'preview') {
							const { markdown } = await readJson(req);
							renderer ??= await markdownProcessor.createRenderer({});
							const result = await renderer.render(String(markdown ?? ''));
							return send(200, { html: result.code });
						}

						if (req.method === 'POST' && route === 'save') {
							const input = await readJson(req);
							const { slug, frontmatter, body } = validate(input);
							const file = path.join(postsDir, `${slug}.md`);
							if (path.dirname(file) !== postsDir) throw new HttpError(400, 'Ungültiger Pfad.');
							if (input.isNew) {
								try {
									await fs.writeFile(file, serialize(frontmatter, body), { encoding: 'utf8', flag: 'wx' }); // wx: nie überschreiben
								} catch (error) {
									if ((error as NodeJS.ErrnoException).code === 'EEXIST') throw new HttpError(409, 'Diese Datei gibt es schon. Anderen Dateinamen wählen oder den Beitrag über die Liste öffnen.');
									throw error;
								}
							} else {
								const info = await fs.lstat(file).catch(() => null);
								if (!info) throw new HttpError(404, 'Beitrag nicht gefunden.');
								if (info.isSymbolicLink()) throw new HttpError(400, 'Verknüpfungen werden nicht überschrieben.');
								await fs.writeFile(file, serialize(frontmatter, body, await fs.readFile(file, 'utf8')), 'utf8');
							}
							return send(200, { path: `src/content/posts/${slug}.md` });
						}

						throw new HttpError(404, 'Unbekannte Anfrage.');
					} catch (error) {
						if (error instanceof HttpError) return send(error.status, { error: error.message });
						console.error('[write]', error);
						return send(500, { error: 'Unerwarteter Fehler (siehe Terminal).' });
					}
				});
			},
		},
	};
}
