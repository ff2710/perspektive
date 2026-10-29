# Blog – Bauplan v1

_Stand: 29.10.2026 · Planung in Cowork (Jarvis), Bau in Claude Code. Ablauf: `Cowork OS/00_Resources/coding-handoff.md`._

## Kontext

Persönlicher Blog von Fidel. Texte zwischen wissenschaftlichen Erkenntnissen und Meinung, für die interessierte, gebildete Öffentlichkeit. Seitenbeschreibung: „Ich bin Fidel, Politikwissenschaftsstudent und teile hier meine Perspektive zu aktuellen politischen Themen."

Erster Testinhalt: der Bednarz-Beitrag (Doc in Cowork, wird dort noch auf die neue Zitierregel umgestellt).

**Entscheidungen (29.10.2026):** Astro · lokaler Editor unter `/write` · Features v1: Dark Mode, Lesezeit, Inhaltsverzeichnis, Volltextsuche, Tags, RSS · Adresse über github.io.

## Stack

- **Astro** (statisch) mit Content Collections, Markdown/MDX, TypeScript.
- **Styling:** natives CSS mit Design-Tokens (CSS-Variablen). Keine UI-Library, außer `pick-ui-library` (Emil) empfiehlt sie ausdrücklich, etwa für den Editor.
- **Fußnoten:** GFM-Fußnoten (`[^1]`) über `remark-gfm`, eigenes Rendering (Popover bei Hover/Tap, Rücksprung-Link).
- **Suche:** Pagefind (direkt als `pagefind`-Paket, `npm run build` ruft es nach dem Astro-Build auf; eigene Oberfläche statt der Fertig-UI), läuft statisch. **RSS:** `@astrojs/rss`. **Sitemap:** `@astrojs/sitemap`.
- **Schriften selbst hosten** (z. B. über Fontsource), nicht von Google-Servern laden (Datenschutz in Deutschland).
- **Editor:** nur im Dev-Modus, Details in Phase 4.
- **Deploy:** GitHub Actions (`withastro/action`) → GitHub Pages. Repo `perspektive` auf Fidels Account `ff2710` (bestätigt per `gh`), erreichbar unter `https://ff2710.github.io/perspektive/`. Deshalb `base: '/perspektive'` in `astro.config.mjs`; alle internen Links über `import.meta.env.BASE_URL` bauen.

## Design-Richtung

Substack × Medium: ruhig, lesezentriert, wenig Chrome.

- Schmale Lesespalte (ca. 680 px), Serif-Fließtext, große Titel, viel Weißraum, dezente Meta-Zeile (Datum · Lesezeit · Tags).
- Startseite: Liste großer Titel mit Teaser, kein Kachelraster.
- Moderne Extras: Dark Mode ohne Flackern, sanfte Seitenübergänge (View Transitions), Fußnoten-Popover, mitlaufendes Inhaltsverzeichnis auf Desktop, optional Lesefortschritt.
- Kein lila Verlauf, keine Standard-KI-Optik. Palette und Schriftcharakter kommen aus dem Taste-Briefing, nicht aus Gewohnheit.

## Design-Bausteine (Reihenfolge und Zuständigkeit)

1. **Taste** (`design-taste-frontend`): Richtung, Palette, Schriftcharakter, Layout-Familie. Läuft zuerst.
2. **Impeccable:** `/impeccable init` erzeugt `PRODUCT.md` und `DESIGN.md`. Danach `shape`, `typeset`, `layout`. Am Ende `critique`, `audit`, `polish`.
3. **Emil Kowalski** (`emil-design-eng`, `animate`, `review-animations`, `animation-performance`): ausschließlich Bewegung, nach den Funktions-Phasen.

**Konfliktregel:** Bei Widerspruch gilt `DESIGN.md`. Alle Animationen respektieren `prefers-reduced-motion`.

**Installation** (im Projektordner, Befehle laut Projektseiten Stand 29.10.2026, bei Fehlern dort nachsehen):

```
npx skills@latest add emilkowalski/skills
npx skills add Leonxlnx/taste-skill --skill design-taste-frontend
npx impeccable install      # alternativ in Claude Code: /plugin → Impeccable
```

## Phasen (je ein Review-Häppchen)

Pro Phase: lokal committen, `code-reviewer` drüberschauen lassen (bei rein gestalterischen Diffs gezielt auf den Diff und „Design statt Funktion" eingrenzen). Push/Deploy entscheidet Fidel.

**Phase 0 – Walking Skeleton.** Astro-Projekt, Repo, GitHub-Actions-Workflow, Skills installieren, `/impeccable init`. Leere Seite „Hello" lokal lauffähig. Deploy nur nach Fidels OK.

**Phase 1 – Inhalt und Grundlayout.** Content Collection `posts` (Felder: `title`, `description`, `pubDate`, `updatedDate?`, `tags[]`, `draft`). Startseite, Post-Seite, Über-mich, Tag-Seiten. Typografie und Farben aus Taste/Impeccable. Bednarz-Beitrag als erster Testpost.

**Phase 2 – Lesefunktionen.** Fußnoten-Rendering mit Popover und Rücksprung, Inline-Links dezent, aber klar erkennbar, Inhaltsverzeichnis, Lesezeit, Dark Mode (ohne Flackern, speichert Wahl).

**Phase 3 – Auffindbarkeit.** Pagefind-Suche, RSS, Sitemap, Open-Graph-Metadaten, Seitentitel.

**Phase 4 – Editor `/write`.**
- Nur im Dev-Modus erreichbar, wird im Produktions-Build ausgeschlossen.
- Umschalter **Markdown** ⇄ **Word-Ansicht**, beide zeigen live dasselbe Dokument, daneben oder darunter gerenderte Vorschau mit derselben Pipeline wie die echte Seite.
- Speichern: kleiner Dev-Endpoint schreibt `src/content/posts/<slug>.md` inkl. Frontmatter. Fidel committet und pusht selbst.
- **Spike zuerst:** Tiptap (mit Markdown-Erweiterung) gegen Milkdown testen. Entscheidungskriterium: verlustfreie Rundreise Markdown → Word-Ansicht → Markdown, besonders bei Fußnoten, Links und Überschriften. Ergebnis kurz festhalten, dann bauen.
- Fallback, falls Fußnoten in der Word-Ansicht nicht sauber gehen: Fußnoten in der Word-Ansicht als eigener Baustein, die Markdown-Ansicht bleibt Quelle der Wahrheit.
- **Spike-Ergebnis (29.10.2026): Milkdown gewählt.** Dasselbe Beispieldokument (Überschriften, Links mit Titel, Fußnoten, Zitat, Listen, `&nbsp;`) ging durch beide Bibliotheken. Tiptap (`@tiptap/markdown`) escapte Fußnoten zu `\[^1\]` und verfälschte `&nbsp;` zu `&amp;nbsp;`; Fußnoten hätten einen selbstgebauten Baustein gebraucht. Milkdown (GFM-Preset) kennt Fußnoten als eigene Bausteine (`footnote_reference`, `footnote_definition`) und ist nach der ersten Rundreise stabil. Seine Eigenheiten sind einstellbar: Listenzeichen `-`, Trenner `---`, `&nbsp;` bleibt als `&nbsp;` lesbar. Der Fußnoten-Fallback war nicht nötig.
- **Umsetzung:** Route und Schreib-API existieren nur im Befehl `dev` (`src/integrations/write.ts`), `/write` fehlt im Build. Die Vorschau rendert serverseitig mit derselben Markdown-Konfiguration wie die Seite (`src/markdown.config.mjs`). Schreibweise des Editors: Fußnotentexte mit Leerzeile dazwischen. Rundreise-Test: `npm run check:roundtrip`.

**Phase 5 – Bewegung (Emil).** `find-animation-opportunities`, dann `animate` für Seitenübergänge, Fußnoten-Popover, Hover/Fokus-Zustände. Danach `review-animations` und `animation-performance`.

**Phase 6 – Feinschliff.** `/impeccable critique`, `audit`, `polish`. Barrierefreiheit (Kontrast, Tastatur, Fokus), Mobile, Lighthouse.

**Phase 7 – Rechtliches und Start.** Impressum und Datenschutzhinweis anlegen (Entscheidung von Fidel, welche Adressangabe er öffentlich nennen will; keine Rechtsberatung durch Claude, im Zweifel prüfen lassen). Dann Deploy nach Fidels OK.

## Schreibkonventionen für Posts

Gelten für Inhalte, nicht für Code. Der Blog muss sie gut unterstützen.

- **Öffentliche Quellen** (Zeitungsartikel, Gesetzes- und Bundestagsseiten, Pressemitteilungen, Blogs): Inline-Link direkt auf der belegten Aussage. Linktext ist die Aussage selbst, nie „hier".
- **Fachliteratur** (Studien, Fachaufsätze, Working Papers): nummerierte Fußnote mit zwei Sätzen „Was ist das, woher habe ich die Aussage" plus Link. Keine separate Quellenliste.
- **Meinung** ohne Label, nur über die Formulierung („für mich", „meiner Ansicht nach", „ich halte"). Faktensätze enthalten kein „ich".

## Verifikation

- `npm run build` läuft ohne Fehler und Warnungen, `/write` fehlt im Build-Ergebnis.
- Fußnoten-Rundreise im Editor (Markdown → Word → Markdown) ergibt identischen Text.
- Suche findet einen Testpost nach dem Build, RSS validiert.
- Dark Mode: kein Aufblitzen beim Laden, Kontraste in beiden Modi ok.
- Animationen: mit eingeschalteter Systemoption „Bewegung reduzieren" ruhig.
- Mobile (schmales Fenster) und Tastaturbedienung geprüft.

## Offen / Annahmen

- Blogname vorerst **„Fidels Perspektive"** (Entscheidung 29.10.2026, „erstmal"). Genauer Seitentitel/Tagline noch offen.
- GitHub-Repo `perspektive` ist noch nicht auf GitHub angelegt (Anlegen/Push nur nach Fidels OK).
- Impressum-Angaben (Phase 7).
- Falls später gewünscht (nicht in v1): Kommentare über giscus, Newsletter, Editor auf der Live-Seite mit GitHub-Login.
