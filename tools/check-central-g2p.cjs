'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),T=require('./pronunciation-table.cjs'),C=require('./central-g2p.cjs'),{analyzeIpa}=require('./ipa-inventory.cjs'),P=require('./run-central-completion.cjs');
const data=T.load('ca-central-didactic-v1'),hints=JSON.parse(fs.readFileSync(T.ROOT+'/ca/central-vowel-hints.json')),byWord=new Map(data.rows.map(r=>[r.mot,r]));
assert.equal(data.rows.length,3299);assert(data.rows.every(r=>r.ipa&&r.estat_ipa!=='validada'));
for(const [word,stress] of [['canviïn',2],['estudiïn',2],['continuïn',3],['actuï',2],['atapeïts',4],['paguessin',2],['haguessin',2]])assert.equal(analyzeIpa(C.propose(word,hints).ipa).stressedSyllable,stress,word);
assert(C.propose('isòtop',hints).ipa.endsWith('tup'));assert(C.propose('monosíl·lab',hints).ipa.includes('l.l'));assert(C.propose('lil·liputenc',hints).ipa.endsWith('ŋk'));
assert.equal(byWord.get('isòtop').ipa,'i.ˈzɔ.tup');assert.notEqual(byWord.get('isòtop').base,'g2p-central-editorial-proposal');
const p=P.prepare();assert.equal(p.plan.jobs.length,219);assert(p.plan.jobs.every(j=>j.ipa&&j.ssml.includes('phoneme')));assert.equal(p.plan.pack.voice,'ca-ES-AlbaNeural');assert(p.snapshot.entries.every(e=>byWord.get(e.text).ipa===e.ipa));
console.log('Central IPA: full draft coverage, preserved editorial rows, reduction, stress, gemination/finals and frozen 219-word completion checked. No synthesis.');
