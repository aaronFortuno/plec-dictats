'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const A=require('./audio-plan.cjs'),T=require('./pronunciation-table.cjs'),V=require('./valencian-g2p.cjs'),P=require('./prepare-valencian-batch.cjs'),{analyzeIpa}=require('./ipa-inventory.cjs');
const d=T.load('ca-valencian-didactic-v1'),h=A.readJson(V.HINTS||T.ROOT+'/ca/valencian-vowel-hints.json');
assert.equal(d.rows.filter(r=>r.ipa).length,3299);assert(d.rows.every(r=>r.estat_ipa!=='validada'));
for(const [word,stress]of [['canviïn',2],['estudiïn',2],['continuïn',3],['actuï',2],['atapeïts',4],['paguessin',2],['haguessin',2]])assert.equal(analyzeIpa(V.propose(word,h).ipa,{allowLabiodentalV:true}).stressedSyllable,stress,word);
assert(V.propose('paguessin',h).ipa.includes('ˈge'));assert(V.propose('monosíl·lab',h).ipa.endsWith('p'));assert(V.propose('monosíl·lab',h).ipa.includes('l.l'));
assert.equal(V.normalize('/aˈɡad͡za/'),'a.ˈgadza');
const batch=P.prepare();assert.equal(batch.plan.jobs.length,3299);assert.equal(batch.plan.pack.voice,'ca-ES-EnricNeural');assert(batch.plan.jobs.some(j=>j.ipa.includes('v')));
const pilot=A.readJson(T.ROOT+'/ca-valencian-pilot.json');for(const e of pilot.entries){const row=d.rows.find(r=>r.mot===e.mot);assert(row);assert.notEqual(row.base,'g2p-valencian-editorial-proposal','Pilot retained: '+e.mot);}
assert.equal(crypto.createHash('sha256').update(JSON.stringify(batch.snapshot.entries)).digest('hex'),batch.snapshot.tableRevision);
assert(batch.summary.characters<300000);assert(batch.plan.jobs.every(j=>j.ssml.includes('phoneme')));
const base={...batch.plan.pack,generationPolicy:{requireIpa:true}};assert.throws(()=>A.buildSsml(base,'vi','ˈvi'));assert(A.buildSsml(batch.plan.pack,'vi','ˈvi').ssml.includes('ˈvi'));
assert.throws(()=>A.validatePack({schemaVersion:1,packs:[{...batch.plan.pack,dialect:'central'}]},batch.plan.pack.id));
console.log('Valencian batch: complete draft, pilot preserved, stress corrections, endings, explicit v opt-in, frozen IPA identity and budget estimate checked. No network.');
