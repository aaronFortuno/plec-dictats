const assert = require('node:assert/strict');
const C = require('../catalog.js');
const K = require('../core.js');
const keys = C.entries.map(e => e.mode + ':' + e.text);
assert.equal(new Set(keys).size, keys.length, 'No hi ha mots duplicats');
assert.equal(new Set(C.entries.map(e => e.id)).size, C.entries.length, 'IDs únics');
for (const e of C.entries) {
  assert(K.validateCustom(e.text), `Grafia admesa: ${e.text}`);
  assert(e.tags.every(tag => C.categories.some(c => c.id === tag && c.mode === e.mode)), 'Etiquetes coherents');
  if (e.mode === 'words') {
    assert(Object.hasOwn(C.vocabularyBands, e.vocabulary) && e.vocabulary !== 'unrated');
    assert(Object.hasOwn(C.orthographyBands, e.orthography) && e.orthography !== 'unrated');
  }
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
const word = text => C.entries.find(e => e.mode === 'words' && e.text === text);
for (const [text, expected] of [['llit', [true, true, false]], ['avesar', [false, true, true]], ['hipotenusa', [false, false, true]], ['col·legi', [false, true, true]]]) {
  assert.deepEqual(['cm','cs','eso'].map(stage => K.matchesStage(word(text), stage)), expected, `Solapament de nivells: ${text}`);
}
for (const stage of Object.keys(C.stages)) {
  const tags = C.categories.filter(c => c.mode === 'words').map(c => c.id);
  const p = K.candidates(C.entries, 'words', tags, stage);
  assert(p.length >= 24);
  const generated = K.generate({ pool: p, count: 24, tags });
  assert(generated.entries.every(e => K.matchesStage(e, stage)));
}
assert(!K.matchesStage({ mode: 'words', vocabulary: 'unrated', orthography: 'unrated' }, 'cs'));
assert(K.matchesStage({ mode: 'words', vocabulary: 'unrated', orthography: 'unrated' }, 'all'));
assert(K.matchesStage(C.entries.find(e => e.mode === 'pseudo'), 'cm'));
for (const modelSide of ['left', 'right']) {
  const entries = [word('llit'), word('avesar'), word('hipotenusa')];
  const shapes = K.worksheet({ entries, modelSide });
  for (const s of shapes) {
    if (s.type === 'line' && s.dash) { assert([70, 140].includes(s.x)); continue; }
    assert(s.x < 70 || s.x >= 140, 'La franja central no té marques');
    if (s.type === 'line') assert(s.x2 <= 70 || s.x2 >= 140);
    if (s.type === 'rect') assert(s.x + s.w <= 70 || s.x >= 140);
  }
  const label = shapes.find(s => s.value === 'ESCRIC I REVISO');
  const model = shapes.find(s => s.value === 'avesar');
  assert(modelSide === 'left' ? model.x < 70 && label.x > 140 : model.x > 140 && label.x < 70);
  assert(!shapes.some(s => s.value === 'REVISO'));
}
console.log(`Comprovacions correctes: ${C.entries.filter(e => e.mode === 'words').length} paraules i ${C.entries.filter(e => e.mode === 'pseudo').length} pseudoparaules, ${C.categories.length} focus.`);
