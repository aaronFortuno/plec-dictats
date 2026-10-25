// Comprovació fora de línia de focusLabels a core.worksheet (T009).
'use strict';
const assert = require('node:assert/strict');
const { worksheet, foldLayout } = require('../core.js');

const entries = Array.from({ length: 24 }, (_, i) => ({ id: i + 1, text: `mot${i + 1}`, tags: ['t'], mode: 'words' }));
const raw = ['Velar', 'Aspre', 'velar', 'Velar', '  ', 'Trenchant', 'Suau', 'Gemma', 'Nasal', 'Líquida', 'Fricatiu', 'Africat', 'Oclusiu', 'Bilabial', 'Dental', 'Palatal', 'Gutural', 'Extra'];
const expected = ['Velar', 'Aspre', 'velar', 'Trenchant', 'Suau', 'Gemma', 'Nasal', 'Líquida', 'Fricatiu', 'Africat', 'Oclusiu', 'Bilabial', 'Dental', 'Palatal', 'Gutural', 'Extra'];

for (const foldStyle of ['thirds', 'quarter']) {
  for (const modelSide of ['left', 'right']) {
    const layout = foldLayout(foldStyle, modelSide);
    const shapes = worksheet({ entries, foldStyle, modelSide, focusLabels: raw });
    const focus = shapes.filter(s => s.role === 'practice-focus');
    const rest = shapes.filter(s => s.role !== 'practice-focus');

    // Capçalera + 16 etiquetes deduplicades, sense buits.
    assert.equal(focus.length, 17, `${foldStyle}/${modelSide}: nombre de formes`);
    assert.equal(focus[0].value, 'FOCUS DE PRÀCTICA');
    assert.deepEqual(focus.slice(1).map(s => s.value), expected, `${foldStyle}/${modelSide}: deduplicació i ordre`);

    // Panell buit més ample amb marges interns de 5 mm.
    const [b0, b1] = layout.blank;
    const cuts = [b0, ...layout.folds.filter(x => x > b0 && x < b1), b1];
    let px = b0, pw = 0;
    for (let i = 0; i < cuts.length - 1; i++) {
      if (cuts[i + 1] - cuts[i] > pw) { pw = cuts[i + 1] - cuts[i]; px = cuts[i]; }
    }
    const lo = px + 5, hi = px + pw - 5;
    for (const s of focus) {
      assert.ok(s.x >= lo && s.x <= hi, `${foldStyle}/${modelSide}: dins del panell (${s.x})`);
      assert.ok(s.maxWidth > 0 && s.x + s.maxWidth <= hi, `${foldStyle}/${modelSide}: maxWidth dins del panell`);
      assert.ok(!layout.folds.some(f => f >= s.x && f <= s.x + s.maxWidth), `${foldStyle}/${modelSide}: no toca cap plec`);
      assert.ok(s.y >= 65 && s.y < 260, `${foldStyle}/${modelSide}: dins de la franja vertical`);
      assert.equal(s.size, 8);
      assert.equal(s.color, '#777777');
    }

    // Sense etiquetes: sortida idèntica al comportament original.
    const plain = worksheet({ entries, foldStyle, modelSide });
    assert.ok(!plain.some(s => s.role === 'practice-focus'));
    assert.deepEqual(rest, plain, `${foldStyle}/${modelSide}: formes originals inalterades`);
  }
}
console.log('check-focus-sheet: OK');
