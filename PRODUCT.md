# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Politisch interessierte, gebildete Laien ohne Fachstudium. Sie kommen meist über einen geteilten Link (Messenger, soziale Medien), lesen einen Beitrag am Stück und oft auf dem Handy. Fachnahe Leser (Kommilitonen, Dozierende) sind willkommen, aber nicht die Zielgruppe, nach der sich Ton und Aufbau richten.

## Product Purpose

„Fidels Perspektive" (Arbeitstitel, Entscheidung 29.10.2026: „erstmal") ist der persönliche Blog von Fidel, Politikwissenschaftsstudent. Er teilt dort seine Perspektive zu aktuellen politischen Themen, an der Schnittstelle von wissenschaftlicher Erkenntnis und Meinung.

Der Blog soll drei Dinge leisten:
- Fidels eigene Stimme öffentlich machen und seine Gedanken ordnen.
- Ihn als Autor mit Haltung sichtbar machen (auch für Praktika, Jobs, Uni).
- Diskussion anstoßen: Leser sollen Argumente nachvollziehen und weiterdiskutieren können.

Erfolg heißt: ein Beitrag wird bis zum Ende gelesen, Belege lassen sich mit einem Klick prüfen, und man erkennt sofort, was Befund und was Meinung ist.

## Positioning

Wissenschaftliche Erkenntnisse und Meinung sind klar getrennt, jede Aussage ist belegt, und der Blog zeigt das in der Gestaltung sichtbar: öffentliche Quellen als Inline-Link auf der belegten Aussage, Fachliteratur als nummerierte Fußnote mit kurzer Erklärung, Meinung nur über die Formulierung erkennbar. Die Sicht ist die eines Politikwissenschaftsstudenten, nicht die einer Redaktion.

## Operating Context

- Fidel schreibt und veröffentlicht allein, selten und in langen Beiträgen (Essay-Länge), nicht im Nachrichtentakt.
- Texte entstehen zunächst in Markdown; ein lokaler Editor unter `/write` (nur im Dev-Modus) schreibt `src/content/posts/<slug>.md`. Fidel committet und pusht selbst.
- Veröffentlicht wird statisch über GitHub Pages: `https://ff2710.github.io/fidels-perspektive/`.
- Erster Testinhalt: der Bednarz-Beitrag.

## Capabilities and Constraints

- Stack: Astro (statisch), TypeScript, natives CSS mit Design-Tokens, Content Collection `posts` (Felder `title`, `description`, `pubDate`, `updatedDate?`, `tags[]`, `draft`). Details und Phasen: `PLAN.md`.
- Features v1: Dark Mode, Lesezeit, Inhaltsverzeichnis, Volltextsuche (Pagefind), Tags, RSS, Fußnoten mit Popover.
- Schriften selbst hosten, keine externen Tracker oder CDNs (Datenschutz, Deutschland).
- Sprache der Seite und der Beiträge: Deutsch.
- Impressum und Datenschutzhinweis sind nötig; welche Adressangabe öffentlich wird, hat Fidel noch nicht entschieden (Phase 7).
- Offen: genauer Seitentitel/Tagline, endgültiger Blogname.

## Brand Commitments

- Name vorerst „Fidels Perspektive", Repo `fidels-perspektive`.
- Seitenbeschreibung (aus dem Plan): „Ich bin Fidel, Politikwissenschaftsstudent und teile hier meine Perspektive zu aktuellen politischen Themen."
- Ton: persönlich, aber sachlich. Meinung ohne Label, nur über Formulierungen wie „für mich" oder „meiner Ansicht nach"; Faktensätze enthalten kein „ich".
- Kein lila Verlauf, keine Template- oder Standard-KI-Optik (bindende Vorgabe von Fidel).

## Evidence on Hand

- Ein Testbeitrag (Bednarz), der in Cowork noch auf die neue Zitierregel umgestellt wird; noch nicht im Repo.
- Keine Statistiken, Leserzahlen, Referenzen oder Testimonials. Nichts davon erfinden.
- Kein Logo, keine Fotos, keine Markenfarben vorhanden.

## Product Principles

1. Belegbarkeit vor Wirkung: jede Aussage lässt sich prüfen, Quellen stören den Lesefluss nicht.
2. Lesen steht im Mittelpunkt: der Text ist die Hauptsache, die Oberfläche tritt zurück.
3. Befund und Meinung sind für Leser immer unterscheidbar, ohne Etiketten.
4. Wenig Struktur, wenig Aufwand: der Blog soll genutzt statt immer wieder umgebaut werden.
5. Datenschutz als Standard: selbst gehostet, keine Tracker.

## Accessibility & Inclusion

Kontraste in Hell und Dunkel, Tastaturbedienung und `prefers-reduced-motion` sind Pflicht (siehe `PLAN.md`, Verifikation). Gut lesbar auf schmalen Handy-Displays.
