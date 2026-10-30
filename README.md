# Perspektive

Persönlicher Blog (Astro, statisch). Bauplan: `PLAN.md`, Konventionen: `CLAUDE.md`. Live: https://ff2710.github.io/perspektive/

## Beitrag schreiben und veröffentlichen (jedes Mal)

Alle Befehle tippst du im Terminal, im Ordner des Blogs (`dev-workspace/blog`). In der Claude-Desktop-App öffnest du das Terminal als Tab neben dem Gespräch.

**1. Editor starten**

```sh
npm run dev
```

Das Terminal bleibt danach „belegt" und zeigt eine Adresse. Das ist richtig so: der Server läuft, solange du schreibst. Beenden mit `Strg + C`.

**2. Editor im Browser öffnen**

http://localhost:4321/perspektive/write (wenn der Port belegt ist, steht im Terminal eine andere Nummer, dann diese nehmen).

**3. Beitrag anlegen oder öffnen**

- Neuer Beitrag: oben „Neu".
- Bestehender Beitrag: oben in der Auswahl „Beitrag" wählen.

**4. Felder ausfüllen**

Titel · Beschreibung (kursive Einleitung unter dem Titel) · Dateiname (wird die Adresse) · Datum · Themen (mit Komma getrennt) · Haken bei „Entwurf", solange der Text nicht fertig ist.

**5. Text schreiben**

Links in Markdown oder in der „Word-Ansicht" (umschaltbar, mit Knöpfen für Überschrift, Fett, Link, Fußnote). Rechts siehst du die Vorschau, so wie der Beitrag später aussieht.

- Öffentliche Quelle: Link direkt auf die belegte Aussage.
- Fachliteratur: nummerierte Fußnote mit zwei Sätzen Erklärung plus Link.
- Meinung nur durch Formulierung („für mich", „meiner Ansicht nach").

**6. Speichern**

Oben „Speichern". Das schreibt die Datei `src/content/posts/<Dateiname>.md`. Speichere zwischendurch oft.

**7. Prüfen, bevor es live geht**

```sh
npm run build
npm run preview
```

Dann http://localhost:4321/perspektive/ (oder die Adresse im Terminal) öffnen und den Beitrag ansehen. `npm run build` bricht mit einer Fehlermeldung ab, wenn etwas kaputt ist. Der Entwurfs-Haken ist hier noch gesetzt, dann siehst du den Beitrag nicht, das ist Absicht (zum Ansehen im Editor genügt die Vorschau rechts).

**8. Veröffentlichen**

1. Im Editor den Haken bei „Entwurf" entfernen und speichern.
2. Claude Code sagen: „Beitrag veröffentlichen". Claude committet und pusht **erst nach deinem OK**. Oder selbst im Terminal:

```sh
git add src/content
git commit -m "Neuer Beitrag: <Titel>"
git push
```

3. Etwa eine Minute warten. Fortschritt: https://github.com/ff2710/perspektive/actions (grüner Haken = fertig). Danach ist der Beitrag unter https://ff2710.github.io/perspektive/ sichtbar.

**Beitrag später ändern:** gleiche Schritte ab 1, in Schritt 8 nur committen und pushen. **Beitrag zurückziehen:** im Editor den Haken „Entwurf" setzen, speichern, committen, pushen.

**Wichtig:** Der Editor `/write` gibt es nur lokal. Auf der Live-Seite existiert er nicht. Wenn der Dev-Server nicht startet, einmal `npm install` ausführen.

## Weitere Befehle

```sh
npm install              # einmalig, bzw. nach neuen Paketen
npm run build            # statischer Build nach dist/ (inkl. Suchindex)
npm run check:roundtrip  # prüft, dass die Word-Ansicht keinen Beitrag verändert
```

Impressum-Angaben stehen in `src/utils/legal.ts`. Fehlt dort etwas, bricht der Build auf GitHub ab.
