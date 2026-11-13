/* Create the first Spanish seed edition from the approved basic vocabulary. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const profile = require('../locales/es/config.json');
const { publishOutputs } = require('./generated-output.cjs');
const root = path.resolve(__dirname, '..');
const base = 'catalogs/es/';
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
const json = data => JSON.stringify(data, null, 2) + '\n';
const collator = new Intl.Collator('es');
const words = fs.readFileSync(path.join(root, base, 'vocabulario-basico.txt'), 'utf8').trim().split(/\r?\n/);
assert.equal(words.length, 350);
assert.equal(new Set(words).size, words.length);
assert.deepEqual(words, [...words].sort(collator.compare));
assert(words.every(word => new RegExp(profile.wordPattern, 'u').test(word)));

const conjugated = new Set('acompañadas aprendimos bucearon cayeron corríamos creció creyeron dibujaste dijeron disfrazados escribieron estuviste explicábamos habíamos hablando habrían hicieron jugábamos leíste llamaste llegué limpiaron llevaron mirábamos organizadas pintadas pintados recogieron reíamos saltabais sonreímos subieron traían viajaremos'.split(' '));
const infinitives = new Set('abrir ayudar bailar beber buscar cantar cerrar comer compartir contar correr dibujar dormir escuchar escribir esperar estudiar explicar hablar hacer jugar lavar leer llevar mirar nadar ordenar pintar preguntar regalar responder romper salir saltar vivir'.split(' '));
const definitions = [
  ['tilde', 'Con tilde', 'Palabras con tilde, incluidos los hiatos', /[áéíóú]/u],
  ['sin-tilde', 'Sin tilde', 'Palabras cuya escritura no lleva tilde', /^[^áéíóú]+$/u],
  ['h', 'H', 'H inicial o intercalada, fuera del dígrafo ch', /(?:^|[^c])h/u],
  ['gj', 'G / J', 'J o g ante e, i', /j|g[eéií]/u],
  ['bv', 'B / V', 'Palabras con b o v', /[bv]/u],
  ['rr', 'R / RR', 'R inicial, rr y r entre vocales', /^r|rr|[aeiouáéíóú]r[aeiouáéíóú]/u],
  ['cquz', 'C / Z / QU', 'C fuera de ch, z o qu', /c(?!h)|z|qu/u],
  ['ggu', 'G / GU / GÜ', 'G ante a, o, u y las grafías gu o gü', /g[aáoóuúü]/u],
  ['lly', 'LL / Y', 'Palabras con ll o y', /ll|y/u],
  ['enye-ch', 'Ñ / CH', 'Palabras con ñ o ch', /ñ|ch/u],
  ['x', 'X', 'Palabras con x', /x/u],
  ['verbos', 'Formas verbales', 'Infinitivos y otras formas verbales', null]
];
assert.deepEqual(definitions.map(([id]) => id), profile.seedFocuses);
const categories = definitions.map(([id, label, title]) => ({ id, label, title, mode: 'words' }));
const entries = words.map(text => {
  let id = 2166136261;
  for (const char of 'words:' + text) id = Math.imul(id ^ char.codePointAt(0), 16777619);
  const tags = definitions.filter(([, , , pattern]) => pattern ? pattern.test(text) : conjugated.has(text) || infinitives.has(text)).map(([tag]) => tag);
  const orthography = conjugated.has(text) || (tags.includes('tilde') && tags.length >= 3) || tags.includes('x')
    ? 'high' : tags.length > 1 || tags.includes('tilde') ? 'medium' : 'low';
  return { id: 'p-' + (id >>> 0).toString(36), text, mode: 'words', vocabulary: 'basic', orthography, basicVocabulary: true, tags };
});
const source = { schemaVersion: 1, language: 'es', edition: 'es-2026-01-basic', status: 'draft', reviewedByTeacher: false, version: 1, categories, entries };
const fingerprint = hash(JSON.stringify({ source, profile }));
const revision = source.edition + '.' + fingerprint.slice(0, 16);
const snapshot = json({
  protocol: 2, slot: 0, language: 'es', salt: 1448712133, selection: { vocabulary: 'basic' },
  catalog: { ...source, fingerprint, revision }, profile
});
const file = 'seed-1-basic.json';
const snapshotPath = base + 'editions/' + file;
if (fs.existsSync(path.join(root, snapshotPath))) {
  assert.equal(fs.readFileSync(path.join(root, snapshotPath), 'utf8'), snapshot, 'Create a new edition to change the Spanish pilot.');
}
publishOutputs(root, new Map([
  [base + 'catalog.json', json(source)],
  [snapshotPath, snapshot],
  [base + 'editions/manifest.json', json({ current: 0, basic: 0, basicWordCount: 350, editions: [{ slot: 0, file, sha256: hash(snapshot), revision }] })]
]));
