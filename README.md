# Fidels Perspektive

Persönlicher Blog (Astro, statisch). Bauplan: `PLAN.md`, Konventionen: `CLAUDE.md`.

```sh
npm install
npm run dev      # lokal auf http://localhost:4321/perspektive/
npm run build    # statischer Build nach dist/
```

## Editor

Beiträge schreibt man im lokalen Editor, der nur im Dev-Server läuft:

```sh
npm run dev   # dann http://localhost:4321/perspektive/write öffnen
```

Der Editor zeigt links Markdown oder die Word-Ansicht (umschaltbar) und rechts die Vorschau. „Speichern“ schreibt `src/content/posts/<name>.md`. Committen und Pushen machst du selbst. Die Suche braucht den gebauten Blog (`npm run build`, dann `npm run preview`). `npm run check:roundtrip` prüft, dass die Word-Ansicht keinen Beitrag verändert.
