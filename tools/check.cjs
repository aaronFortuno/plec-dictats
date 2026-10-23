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
for (const foldStyle of ['thirds', 'quarter']) for (const modelSide of ['left', 'right']) {
  const entries = [word('llit'), word('avesar'), word('hipotenusa')];
  const layout = K.foldLayout(foldStyle, modelSide), shapes = K.worksheet({ entries, modelSide, foldStyle });
  assert.equal(layout.panels.reduce((sum,p)=>sum+p.width,0),210);
  assert.deepEqual(shapes.filter(s=>s.type==='line'&&s.dash).map(s=>s.x),layout.folds);
  const [blankStart,blankEnd]=layout.blank;
  for(const s of shapes){
    if(s.type==='line'&&s.dash)continue;
    assert(s.x<=blankStart||s.x>=blankEnd,'Cap contingut imprès als trams buits');
    if(s.type==='line')assert((s.x<=blankStart&&s.x2<=blankStart)||(s.x>=blankEnd&&s.x2>=blankEnd),'Les ratlles no creuen els trams buits');
    if(s.type==='rect')assert(s.x+s.w<=blankStart||s.x>=blankEnd);
    assert(s.x>=0&&s.x<=210&&s.y>=0&&s.y<=297);
  }
  const label=shapes.find(s=>s.value==='ESCRIC I REVISO'),model=shapes.find(s=>s.value==='avesar');
  assert(label.x>layout.writing[0]&&label.x<layout.writing[1]);
  assert(model.x>layout.model[0]&&model.x<layout.model[1]);
  if(foldStyle==='thirds'){
    assert.deepEqual(layout.writing,[70,140]);
    assert.deepEqual(layout.foldOrder,modelSide==='left'?[140,70]:[70,140]);
  } else {
    assert.equal(layout.model[1]-layout.model[0],51);
    assert.equal(layout.writing[1]-layout.writing[0],52);
    assert.deepEqual(layout.panels.map(p=>p.width),modelSide==='left'?[51,53,54,52]:[52,54,53,51]);
    assert.deepEqual(layout.foldOrder,modelSide==='left'?[51,104]:[159,106]);
    const firstFold=51,secondFold=104;
    assert.equal(secondFold-2*firstFold,2,'Marge de 2 mm abans del segon plec');
    const foldedPacketEnd=2*secondFold-firstFold;
    assert.equal(158-foldedPacketEnd,1,'El paquet deixa 1 mm abans de la columna d’escriptura');
    const foldedModel=[2*secondFold-2*firstFold,foldedPacketEnd];
    const foldedCover=[secondFold,foldedPacketEnd];
    assert(foldedModel[0]>=foldedCover[0]&&foldedModel[1]<=foldedCover[1],'El paper buit cobreix tot el model');
  }
  assert(!shapes.some(s=>s.value==='REVISO'));
}
console.log(`Comprovacions correctes: ${C.entries.filter(e => e.mode === 'words').length} paraules i ${C.entries.filter(e => e.mode === 'pseudo').length} pseudoparaules, ${C.categories.length} focus.`);
