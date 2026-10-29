# blog

Persönlicher Blog von Fidel (Politik, Wissenschaft × Meinung). Bauplan, Phasen und Entscheidungen: `PLAN.md` — dort zuerst lesen.

## Stack und Konventionen

- Astro (statisch), TypeScript, natives CSS mit Design-Tokens, Content Collection `posts`.
- Deploy über GitHub Pages (GitHub Actions). Editor `/write` nur im Dev-Modus, nie im Produktions-Build.
- Schriften selbst hosten, keine externen Tracker oder CDNs für Fonts.
- Design: `DESIGN.md` und `PRODUCT.md` (Impeccable) sind maßgeblich. Reihenfolge der Skills: Taste → Impeccable → Emil (nur Bewegung). Animationen respektieren `prefers-reduced-motion`.

## Arbeitsregeln

- Pro Feature-Häppchen lokal committen. **Push und Deploy nur nach Fidels ausdrücklichem OK** (Commit ≠ Deploy).
- Nach jedem Block `code-reviewer`. Bei rein gestalterischen oder kleinen Diffs den Reviewer gezielt auf genau diesen Diff eingrenzen und sagen, dass es um Design statt Funktion geht.
- Erklärungen einfach halten, Fidel ist kein Berufsentwickler: Klarheit vor Cleverness, im Zweifel weniger neue Struktur und mehr Bestehendes nutzen.
- Bei Unsicherheit über Design-Richtung nachfragen, statt auf Standardmuster zurückzufallen (kein lila Verlauf, keine Template-Optik).

## Schreibkonventionen der Posts

Der Blog muss diese Regeln gut darstellen (Details in `PLAN.md`):

- Öffentliche Quellen als Inline-Link auf der belegten Aussage, Fachliteratur als nummerierte Fußnote mit kurzer Erklärung. Keine separate Quellenliste.
- Meinung nur durch Formulierung gekennzeichnet, kein Label wie „Meine Meinung:".
