'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const T=require('./pronunciation-table.cjs'),P=require('./pseudo-g2p.cjs'),{analyzeIpa}=require('./ipa-inventory.cjs'),A=require('./audio-plan.cjs');
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const immutableFiles=['seed-1.json','seed-2.json','seed-3.json','seed-4-basic.json'].map(file=>path.join(A.ROOT,'catalogs/ca/editions',file));
const before=immutableFiles.map(hash);
const reports=P.check();assert.equal(reports.length,3);
for(const [dialect,id] of P.PROFILES){
 const data=T.load(id),source=data.catalog.entries.filter(e=>e.mode==='pseudo');
 assert.equal(data.profile.mode,'pseudo');assert.equal(data.rows.length,96);assert.equal(new Set(data.rows.map(r=>r.id)).size,96);
 assert.deepEqual(new Set(data.rows.map(r=>r.id)),new Set(source.map(r=>r.id)));
 assert(data.rows.every(r=>r.id.startsWith('s-')&&r.estat_ipa==='pendent-contrast'&&r.revisor===''&&r.data_revisio===''&&r.ipa));
 assert.deepEqual(reports.find(r=>r.profile===id).sourceOrder,source.map(e=>e.id));
 assert(data.rows.every(r=>r.notes.includes('no pronunciació de diccionari')&&r.notes.includes('ortografia normativa única')));
 // Independent orthographic expectations: final consonant, written accent,
 // plain words in a vowel and an unusual initial cluster must remain audible.
 for(const [word,stress] of [['nupi',1],['tapú',2],['nufà',2],['dofípol',2],['blanufeta',3],['platoll',2]])assert.equal(analyzeIpa(P.propose(word,dialect).ipa,{allowLabiodentalV:true}).stressedSyllable,stress,word+' '+dialect);
 assert.equal(P.propose('sclaf',dialect).ipa,'ˈsklaf');
 assert(P.propose('grisp',dialect).ipa.endsWith('ɾisp'));
 assert(P.propose('cunyi',dialect).ipa.includes('ɲ'));
 assert(P.propose('platoll',dialect).ipa.endsWith('toʎ'),'An o hint must not substitute e');
 assert(P.propose('cralop',dialect).ipa.endsWith('lop'));
 assert.equal(P.propose('platoll',dialect).hint.value,'ó');
 assert.equal(P.propose('fepo',dialect).hint.value,'é');
 const planned=T.planWords(data,P.PILOT);assert.equal(planned.mode,'pseudo');assert.equal(planned.entries.length,8);assert.equal(planned.executable,false);
 const bad=structuredClone(data.rows);bad[0].id=data.catalog.entries.find(e=>e.mode==='words').id;assert.throws(()=>T.validate(bad,data.profile,data.catalog));
 assert.throws(()=>T.validate(data.rows,{...data.profile,mode:'words'},data.catalog));
 assert.throws(()=>T.validate([],{...data.profile,mode:'invented'},data.catalog));
 const row=data.rows[0],pack={rate:'-10%',locale:'ca-ES',voice:'ca-ES-AlbaNeural'};
 assert.equal(P.estimate([row]),A.buildSsml(pack,row.mot,row.ipa).billableCharacters);
}
assert.equal(P.propose('dopali','central').ipa,'du.ˈpa.li');assert.equal(P.propose('dopali','valencia').ipa,'do.ˈpa.li');
assert(P.propose('xanufi','central').ipa.startsWith('ʃə'));assert(P.propose('xanufi','valencia').ipa.startsWith('t͡ʃa'));
assert(P.propose('jufell','central').ipa.startsWith('ʒ'));assert(P.propose('jufell','valencia').ipa.startsWith('d͡ʒ'));
assert(P.propose('pirotet','mallorqui').ipa.includes('ˈtət'));
assert.equal(T.profile('ca-mallorcan-pseudo-didactic-v1').audioStatus,'on-hold');
// Existing word exports stay byte-for-byte derivable from their original TSV.
for(const id of ['ca-central-didactic-v1','ca-valencian-didactic-v1','ca-mallorcan-didactic-v1'])T.exportData(T.load(id),true);
assert.deepEqual(immutableFiles.map(hash),before);
console.log(JSON.stringify({pseudoPerProfile:96,profiles:3,validated:0,centralCharacters:reports[0].estimatedCharacters,valencianCharacters:reports[1].estimatedCharacters,network:false,synthesis:false,immutableEditions:true}));
