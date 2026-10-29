---
target: Gesamter Blog (Startseite, Beitrag, Themen, Suche, Über mich)
total_score: 24
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 3
target_identity: "file:/Users/fidel/Documents/1 - PERSÖNLICH/Hobbys & Freizeit/Digitales/AI/dev-workspace/blog/src/pages/index.astro"
target_fingerprint: "sha256:c7ca5329a9e916102ef35eab3e955401f444b1c5cf603feb39aa925dc630bf0e"
target_path: /Users/fidel/Documents/1 - PERSÖNLICH/Hobbys & Freizeit/Digitales/AI/dev-workspace/blog/src/pages/index.astro
timestamp: 2026-10-29T16-31-45Z
slug: src-pages-index-astro
---
Method: dual-agent (A: Design-Review, B: Detektor und Messung)

Design-Gesundheit 24/32 (75 %, gut). Heuristik 7 und 10 n/a (Lese-Seite).
Scores: 1=3, 2=4, 3=3, 4=3, 5=3, 6=3, 8=3, 9=2.

Spezifität: überwiegend eigen, Eigenheit sitzt auf der Startseite und im Belegsystem; Beitragsseite austauschbar; Innenseiten fast neutral (ca. 7/10).
Detektor: 0 Funde (Code und Overlay auf 3 Seiten), keine Falsch-Positive.

Prioritäts-Probleme:
1. [P1] Scroll-Effekte im Build tot: Minifizierer verschmilzt animation + animation-timeline zur Kurzschreibweise, Chrome 152 verwirft sie (verifiziert). -> harden
2. [P1] Belege im Hellmodus zu leise: Unterstreichung Salbei ca. 1,5:1, Fußnotenzahl 12 px. Fix: Blau-Unterstreichung #3A86FF, Zahl #1B5FC4. -> colorize
3. [P1] Handy: Bedienziele < 44 px (Fußnotenzahl 7x14, Rücksprung 15x16, Pills 27, Navigation 34, Suche/Schalter 35, Fußlinks 16), keine Touch-Vorschau, Sprung ans Ende. -> adapt
4. [P2] Mobiler Kopf frisst Einstieg (erster Absatz bei 518 px), Startseite 320 px: 3 px Überlauf (Schriftzug nowrap). -> layout
5. [P2] Produktziele ohne Oberfläche: keine 404, kein Archiv, kein Weg zu Widerspruch/Teilen, kein og:image. -> shape

Weitere Messwerte (B): Schalterrand 2,1:1 hell / 2,6:1 dunkel (< 3:1), Suchfeld-Fläche 1,1:1. Alle Textkontraste bestanden (min. 5,16:1). Überschriften, lang, Titel, Landmarks, Tab-Reihenfolge, Fokus in Ordnung.

Alternativen zu bewussten Entscheidungen (A): Balken in Waldgrün; Mint in Marken-Grünfamilie (#DCEFE3); Weiterlesen-Band dunkel invertieren und bei einem Eintrag kleineres Polster; Himmelblau = Beleg/Interaktion (Link-Unterstreichung); Schalter mobil 44 px; Archivo schmaler (font-stretch 85 %, Gewicht 700); Wortabstand 0.06em bei großen Titeln.
