# Design: Fidels Perspektive

Verbindlich für alles Gestalterische. Quellen: `DESIGN-BRIEF.md` (Fidels Briefing), `PRODUCT.md`, Fidels Wahl vom 29.10.2026 (Mischung aus A und C: **G3, K4, H3, S2**, Palette „Keimling und Himmel"). Bei Widerspruch zu `PLAN.md` gilt diese Datei. Animationen kommen erst in Phase 5.

## Leitidee

Magazin-Wucht von Surplus, Lesekomfort von Medium, Bildumgang von Nike Stories. Klar, streitbar, belegt: schwere Schlagzeilen, ruhiger Fließtext, Haarlinien statt Kästen, eine kühle grüne Farbwelt mit Himmelblau als Kontrast. Der Blog funktioniert ohne Bilder; wo ein Bild fehlt, trägt eine Typo-Fläche.

## Briefs der Seitentypen (Shape, kompakt)

**Startseite (Modus: Read/Einstieg).** Leser kommt über einen Link, will wissen, was das ist und was es Neues gibt.
- Kopf: Schriftzug, Seitenbeschreibung darunter, Navigation (Themen, Über mich; Suche folgt in Phase 3), Haarlinie.
- Aufmacher: neuester Beitrag auf heller Mint-Fläche mit grünem Balken, großer Titel, Teaser, Meta-Zeile, Themen-Pills **unter** dem Titel.
- Rechts daneben (mobil darunter): „Zuletzt", kompakte Serif-Liste mit Haarlinien.
- Darunter: Themen-Rubriken als große Links mit Anzahl; weitere Beiträge im 2–3-spaltigen Raster mit Haarlinien, sobald es mehr als einen gibt.
- Leere Zustände (keine Beiträge, Thema ohne Beiträge): ein kurzer sachlicher Satz.

**Artikelseite (Modus: Read).** Leser liest am Stück, oft am Handy.
- Lesespalte 680 px, Titel groß, kursive Einleitung, Meta-Zeile, Pills darunter. Kein Titelbild nötig.
- Fließtext 20/32 px Serif, Initiale am Textanfang, Inline-Links unterstrichen, Fußnoten klein und anklickbar (Popover in Phase 2).
- Ende: Themen-Pills, Autorenkasten, „Weiterlesen".

**Themen- und Über-mich-Seiten.** Wie die Startseite, aber ruhiger: Liste mit Haarlinien, Über mich als Lesespalte.

**Anti-Ziele:** keine Kästen mit Schatten, keine Etiketten über Überschriften (Eyebrows), kein Abo-/Folgen-Element, kein Lila, keine Stockfotos, Meinung wird nie grafisch markiert.

## Farben

Quelle: Palette „Keimling und Himmel" (`#FFFEFB #D7F9F1 #9BE7FF #3A86FF #2D6A4F`), kombiniert mit Salbei (G3) und Himmelblau (K4). Alle Textpaarungen ≥ 4,5:1 (gemessen).

| Rolle | Token | Hell | Dunkel |
|---|---|---|---|
| Seitengrund | `--paper` | `#FFFEFB` | `#101913` |
| Text | `--ink` | `#0F1A14` | `#E9EFE8` |
| Gedämpfter Text | `--muted` | `#5A665E` (5,9:1) | `#9AA89E` |
| Haarlinien | `--line` | `#C9D3CC` | `#2E3D34` |
| Fläche (Zitat, Autor) | `--surface` | `#F2F5F1` | `#1A2620` |
| Aufmacher-Fläche (H3) | `--feature` | `#D7F9F1` (Mint) | `#1A2620` |
| Akzent-Füllung (Balken, Pills auf Dunkel) | `--accent` | `#A9DFC0` (Salbei) | `#A9DFC0` |
| Pill-Hintergrund | `--accent-tint` | `#E4F4EA` | `#1F3A2A` |
| Grüner Text (Initiale, Fußnotenzahl, Pill-Schrift) | `--accent-text` | `#2D6A4F` (6,3:1) | `#A9DFC0` |
| Kontrast: Hover, Fokus, Auswahl | `--contrast` | `#1B5FC4` (6,0:1; Füllung `#3A86FF`) | `#8DB8FF` |
| Markierung / Textauswahl | `--mark` | `#9BE7FF` | `#1F4D66` |

Regeln: Grün trägt die Marke (Pills, Balken, Initiale), Blau reagiert (Hover, Fokus, Textauswahl, Fußnoten-Hover). Blau `#3A86FF` nur als Füllung, als Text immer `--contrast`. Hell und Dunkel gleichwertig, Standard folgt dem System, Umschalter in Phase 2.

## Typografie

- **Schlagzeilen und Schriftzug:** Archivo Variable, Gewicht **650**, normale Breite, Laufweite −0.03 bis −0.035em, Zeilenhöhe 1.0–1.1. Maximal 6rem.
- **Fließtext, Einleitungen, Listen-Titel:** Source Serif 4 Variable, Fließtext 1.25rem/1.6, Einleitung kursiv 1.3rem.
- **Meta, Navigation, Pills, Fußnotenzahlen:** Archivo, 0.8–0.95rem, Gewicht 500–650.
- Selbst gehostet über Fontsource (`@fontsource-variable/archivo`, `@fontsource-variable/source-serif-4`), keine Google-Server.
- Deutsche Typografie: „Anführungszeichen“, Gedankenstriche, `lang="de"`, `hyphens: auto` im Fließtext, nichtumbrechende Leerzeichen bei Zahlen und Einheiten.
- Skala (rem): 0.8 · 0.95 · 1.25 · 1.7 · 2.5–3.4 (Titel) · 3.4–6 (Aufmacher, Schriftzug).

## Layout

- Seitenbreite max. 1200 px, Seitenrand `clamp(1rem, 4vw, 3rem)`. Lesespalte 680 px.
- Haarlinien (1 px, `--line`; unter Kopf und Listenköpfen in `--ink`) statt Kästen. Keine Schatten, kein Glas, keine Verläufe.
- Aufmacher (H3): `--feature`-Fläche, 0.6rem breiter Balken in `--accent` an der linken Kante, Titel in `--ink`.
- Abstände: Abschnitte 4–6rem auseinander, innerhalb 0.75–1.5rem. Mehr Raum über Überschriften als darunter.
- Pills: Vollrunde Kapsel, `--accent-tint` mit `--accent-text`, **nie über einem Titel**.
- Buttons/Links: Inline-Links unterstrichen (3 px in `--accent`, Hover `--contrast`), Navigation ohne Unterstreichung, Fokus-Ring 2 px `--contrast` mit Abstand.

## Bilder

Keine nötig. Wenn vorhanden: groß, randlos, ruhiger Beschnitt, Alt-Text Pflicht, Quellenzeile darunter. Ohne Bild trägt die Typo-Fläche den Aufmacher.

## Browser-Oberflächen

Textauswahl in `--mark`, Caret in `--contrast`, Scrollbar-Farbe aus Palette, Fokus-Ringe sichtbar, Ziffern in Tabellen tabellarisch.

## Bewegung

Erst Phase 5 (Emil). Bis dahin nur CSS-Übergänge auf Farbe (150 ms), alles hinter `prefers-reduced-motion`.
