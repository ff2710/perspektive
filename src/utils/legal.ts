// Angaben für Impressum und Datenschutz. Hier eintragen, sonst bricht der Build auf GitHub ab.
// Lokal (`npm run build`, `npm run dev`) erscheinen leere Felder als markierte Lücke.
export const legal = {
	name: 'Fidel Friczewski', // vollständiger Name: Vor- und Nachname (mit nur dem Vornamen bricht der Build auf GitHub ab)
	street: 'Markt 38', // Straße und Hausnummer (oder Postfach / c/o-Adresse)
	city: '51103 Köln', // PLZ und Ort
	email: 'f.friczewski@outlook.de', // öffentliche Kontakt-E-Mail
};

export const missing = Object.entries(legal)
	.filter(([key, value]) => !value.trim() || (key === 'name' && !value.trim().includes(' ')))
	.map(([key]) => key);

// Auf GitHub (CI=true) darf nichts unvollständig live gehen.
if (process.env.CI && missing.length) {
	throw new Error(`Impressum unvollständig: ${missing.join(', ')} fehlt in src/utils/legal.ts`);
}
