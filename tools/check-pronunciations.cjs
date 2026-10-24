'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { ROOT, countCharacters } = require('./audio-plan.cjs');
const { METADATA, SOURCE, analyzeIpa, parseTsv, validateRows, buildPhonemeSsml, loadPlan } = require('./prepare-ipa.cjs');

const plan = loadPlan();
const metadata = JSON.parse(fs.readFileSync(METADATA, 'utf8'));
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, metadata.catalogPath), 'utf8')).catalog;
const rows = parseTsv(fs.readFileSync(SOURCE, 'utf8'));
const byWord = new Map(plan.jobs.map(job => [job.text, job]));
assert.equal(plan.jobs.length, 227);
assert.equal(plan.executable, false);
assert.equal(plan.pack.id, 'ca-central-alba-ipa-v1');
assert.notEqual(plan.pack.id, 'ca-central-alba-v1');
assert.equal(plan.pack.rate, '-10%');
// Stress and hiatus regressions, including words whose ï is not stressed.
for (const [word, syllables, stressedSyllable] of [
  ['atapeït', 4, 4], ['conduïdes', 4, 3], ['agraïm', 3, 3],
  ['canviïn', 3, 1], ['intuïtiu', 4, 4], ['raïm', 2, 2],
  ['aigüera', 3, 2], ['qüestió', 3, 3], ['esglaï', 3, 2], ['reïna', 3, 2]
]) {
  const job = byWord.get(word);
  assert.equal(job.syllables, syllables, word);
  assert.equal(job.stressedSyllable, stressedSyllable, word);
}
assert.match(byWord.get('aigüera').ipa, /ɣw/u);
assert.match(byWord.get('argüir').ipa, /gu\.ˈi/u);
assert.match(byWord.get('increïble').ipa, /b\.bl/u);
assert.match(byWord.get('fortuïtament').ipa, /ˌ/u);
for (const job of plan.jobs) {
  assert.match(job.ssml, /<phoneme alphabet="ipa" ph="[^"]+">/u);
  assert.ok(job.ssml.includes(`>${job.text}</phoneme>`));
  assert.equal(job.billableCharacters, countCharacters(job.billableBody));
  assert.equal(job.auditoryReview, 'pending');
}
for (const invalid of ['ətəpəˈit', 'ə..ˈit', 'ə.ˈɫit', 'ə.ˈɡit', 'ə.ˈiit', '/ə.ˈit/', 'ə.it', 'ˈə.ˈit', 'ə.iˈt', 'ə.ˈit ']) {
  assert.throws(() => analyzeIpa(invalid), undefined, invalid);
}
assert.throws(() => validateRows(rows.slice(1), catalog, metadata));
const duplicate = rows.map(row => ({ ...row })); duplicate[0] = duplicate[1];
assert.throws(() => validateRows(duplicate, catalog, metadata));
const wrongSpelling = rows.map(row => ({ ...row })); wrongSpelling[0].mot += 'x';
assert.throws(() => validateRows(wrongSpelling, catalog, metadata));
const wrongSource = rows.map(row => ({ ...row }));
wrongSource.find(row => row.mot === 'reïna').fonts = 'https://www.diccionari.cat/catala-angles/reina';
assert.throws(() => validateRows(wrongSource, catalog, metadata));
const escaped = buildPhonemeSsml(plan.pack, { mot: '<mot&"', ipa: 'ˈmot' });
assert.ok(escaped.ssml.includes('&lt;mot&amp;&quot;'));
assert.ok(rows.every((row, index) => !index || rows[index - 1].mot.localeCompare(row.mot, 'ca') <= 0));
console.log(`IPA: ${plan.jobs.length} mots coberts, ID i grafia intactes, inventari, síl·labes, accents i SSML comprovats. ${plan.summary.needsReview} dubtes pendents; totes les escoltes pendents.`);
