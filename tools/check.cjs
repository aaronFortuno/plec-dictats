const assert = require('node:assert/strict');
const C = require('../catalog.js');
const K = require('../core.js');
const keys = C.entries.map(e => e.mode + ':' + e.text);
assert.equal(new Set(keys).size, keys.length, 'No hi ha mots duplicats');
assert.equal(new Set(C.entries.map(e => e.id)).size, C.entries.length, 'IDs únics');
for (const e of C.entries) {
  assert(K.validateCustom(e.text), `Grafia admesa: ${e.text}`);
  assert(e.tags.every(tag => C.categories.some(c => c.id === tag && c.mode === e.mode)), 'Etiquetes coherents');
}
for (const mode of ['words', 'pseudo']) {
  const tags = C.categories.filter(c => c.mode === mode).map(c => c.id);
  const pool = K.candidates(C.entries, mode, tags);
  for (const count of [8, 12, 16, 20, 24]) {
    const first = K.generate({ pool, count, tags }).entries;
    const second = K.generate({ pool, count, tags, seen: first.map(e => e.id), locked: [first[0]] }).entries;
    assert.equal(first.length, count); assert.equal(new Set(first.map(e => e.id)).size, count);
    assert(second.some(e => e.id === first[0].id), 'Respecta els fixats');
    assert.equal(second.filter(e => first.some(f => f.id === e.id)).length, 1, 'No repeteix mots nous');
    for (const shapes of [K.worksheet({ entries: first, mode }), K.teacherSheet({ entries: first, mode }, C.categories)]) {
      for (const s of shapes) {
        assert(s.x >= 0 && s.x <= 210 && s.y >= 0 && s.y <= 297, 'Contingut dins de l’A4');
        if (s.type === 'line') assert(s.x2 <= 210 && s.y2 <= 297);
      }
    }
  }
  for (const tag of tags) {
    const p = K.candidates(C.entries, mode, [tag]);
    assert(p.length >= 24, `Com a mínim 24 elements al focus ${tag}`);
    assert(K.generate({ pool: p, count: 24, tags: [tag] }).entries.every(e => e.tags.includes(tag)));
  }
  const p = pool.slice(0, 10);
  assert.throws(() => K.generate({ pool: p, count: 24, tags }), /prou/);
  const exhausted = K.generate({ pool: p, count: 8, seen: p.map(e => e.id), tags });
  assert.equal(exhausted.reused, 8, 'Informa quan recupera mots utilitzats');
}
assert(!K.validateCustom('<script>')); assert(!K.validateCustom('dues paraules')); assert(K.validateCustom('col·legi')); assert(K.validateCustom('raïm'));
console.log(`Comprovacions correctes: ${C.entries.filter(e => e.mode === 'words').length} paraules i ${C.entries.filter(e => e.mode === 'pseudo').length} pseudoparaules, ${C.categories.length} focus.`);
