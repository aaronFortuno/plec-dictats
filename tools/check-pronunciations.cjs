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
const comparison = require('./prepare-pronunciation-sample.cjs');
const sample = comparison.loadSample();
assert.equal(sample.executable, false);
assert.equal(sample.jobs.length, 9);
assert.notEqual(sample.pack.id, plan.pack.id);
assert.notEqual(sample.pack.id, 'ca-central-alba-v1');
const controls = new Map(sample.jobs.map(job=>[job.text,job]));
assert.match(controls.get('col·legi').ipa, /l\.ˈl/u);
assert.match(controls.get('metàl·lic').ipa, /l\.l.*k$/u);
assert.equal(controls.get('llit').ipa, 'ˈʎit');
assert.equal(controls.get('poc').ipa, 'ˈpɔk');
assert.equal(controls.get('blanc').ipa, 'ˈblaŋk');
assert.equal(controls.get('gent').ipa, 'ˈʒent');
assert.equal(controls.get('lil·liputenc').ipa, 'lil.li.pu.ˈtɛŋk');
assert.equal(controls.get('paguessin').ipa, 'pə.ˈɣe.sin');
assert.equal(controls.get('passàvem').ipa, 'pə.ˈsa.βəm');
for (const verb of ['paguessin','passàvem']) {
  assert.equal(analyzeIpa(controls.get(verb).ipa).stressedSyllable,2);
  assert.equal(controls.get(verb).reportedByTeacher,true);
}
assert.equal(controls.get('lil·liputenc').reviewStatus, 'needs-review');
assert.equal(controls.get('lil·liputenc').reportedByTeacher, true);
assert(sample.jobs.filter(job=>!['lil·liputenc','paguessin','passàvem'].includes(job.text)).every(job=>job.reportedByTeacher===false));
assert(sample.jobs.every(job=>job.auditoryReview==='pending' && !job.ssml.includes('<break')));
const sampleMetadata = JSON.parse(fs.readFileSync(comparison.SOURCE,'utf8'));
const audioManifest = JSON.parse(fs.readFileSync(path.join(ROOT,'audio/manifest.json'),'utf8'));
const wrongSample = structuredClone(sampleMetadata); wrongSample.entries[0].mot+='x';
assert.throws(()=>comparison.buildSample(wrongSample,catalog,audioManifest));
const samePack = structuredClone(sampleMetadata); samePack.candidatePack.id=samePack.baselinePack;
assert.throws(()=>comparison.buildSample(samePack,catalog,audioManifest));
console.log(`IPA: ${plan.jobs.length} mots coberts, ID i grafia intactes, inventari, síl·labes, accents i SSML comprovats. ${plan.summary.needsReview} dubtes pendents; totes les escoltes pendents.`);
console.log('Mostra didàctica: nou mots, geminació, finals nt/nc explícits i accent dels dos verbs. Sense xarxa.');
