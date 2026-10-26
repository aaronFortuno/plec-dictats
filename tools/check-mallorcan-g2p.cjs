'use strict';
const assert=require('node:assert/strict');
const T=require('./pronunciation-table.cjs');
const M=require('./mallorcan-g2p.cjs');
const A=require('./audio-plan.cjs');
const {analyzeIpa}=require('./ipa-inventory.cjs');
const data=T.load(M.PROFILE);
T.exportData(data,true);
M.exportReview(data,true);
assert.equal(data.rows.length,3299);
assert(data.rows.every(row=>row.varietat==='mallorqui'&&row.revisor===''&&row.data_revisio===''&&row.estat_ipa!=='validada'));

// Independent lexical exemplars in UIB GALMIC and EBAP B2, not golden outputs
// obtained by running the converter itself. Some exemplars are outside this bank.
for(const [word,expected] of [['cera','ˈsə.ɾə'],['pera','ˈpə.ɾə'],['ple','ˈplə'],['sec','ˈsək'],['fred','ˈfɾət'],['ceba','ˈsə.bə'],['abella','ə.ˈbə.ʎə']]){
  assert.equal(M.propose(word).ipa,expected,word);
}
// Formal Mallorcan preserves unstressed o outside harmony and distinguishes /v/.
assert.equal(M.propose('paràbola').ipa,'pə.ˈɾa.bo.lə');
assert.equal(M.propose('passàvem').ipa,'pə.ˈsa.vəm');
assert.equal(M.propose('vi').ipa,'ˈvi');
assert.throws(()=>analyzeIpa(M.propose('vi').ipa));
assert.equal(T.planWords(data,['vi']).entries[0].azureCaEsCompatible,false);
// Harmony and explicitly sourced lexical exceptions are not global o→u.
assert.equal(M.propose('conill').ipa,'ku.ˈniʎ');
assert(M.propose('cobert').ipa.startsWith('ku.'));
assert(M.propose('obert').ipa.startsWith('u.'));
// UIB and EBAP describe intervocalic bl/gl gemination in these formal registers.
assert.equal(M.propose('amable').ipa,'ə.ˈmab.blə');
assert(M.propose('agradable').ipa.includes('b.bl'));
assert.equal(M.propose('arreglar').ipa,'ə.rəg.ˈgla');
// The lexical vowel in escola is undecided: no fabricated or borrowed IPA.
assert.equal(M.propose('escola').ipa,'');
assert.throws(()=>M.propose('escola',{entries:{escola:{hint:'invalid'}}}));
for(const [word,stress] of [['atapeït',4],['canviïn',2],['continuïn',3],['estudiïn',2],['passàvem',2]]){
  assert.equal(analyzeIpa(M.propose(word).ipa,{allowLabiodentalV:true}).stressedSyllable,stress,word);
}
assert.equal(M.propose('camp').ipa,'ˈkamp');
assert.equal(M.propose('sant').ipa,'ˈsant');
assert.equal(M.propose('tanc').ipa,'ˈtaŋk');
assert(M.propose('brànquia').ipa.includes('ŋ'));
assert(M.propose('monosíl·lab').ipa.includes('l.l'));

const queue=M.reviewQueue(data);
assert.equal(queue.basic.length,350);
assert(queue.pending.length>0&&queue.basic.some(row=>!row.ipa));
assert.equal(queue.summary.withIpa+queue.summary.withoutIpa,3299);
assert.equal(queue.summary.basicWithIpa+queue.summary.basicWithoutIpa,350);
assert(queue.pending.every(row=>row.ipa===null&&row.status==='pendent'&&row.azureCaEsCompatible===null));
assert(queue.basic.every(row=>row.basicVocabulary));
assert.equal(queue.characterEstimates.available.words,queue.summary.withIpa);
assert.equal(queue.characterEstimates.basic.words,queue.summary.basicWithIpa);
assert.deepEqual(M.estimateCharacters([{mot:'escola',ipa:''}]),{words:0,characters:0});
// Check the offline estimate against the protected planner for compatible IPA,
// while retaining /v/ proposals as cost data without constructing a false pack.
for(const mot of ['casa','francès','cobert']){
  const ipa=M.propose(mot).ipa,planned=A.buildSsml({rate:'-10%',locale:'ca-ES',voice:'ca-ES-AlbaNeural'},mot,ipa);
  assert.equal(M.estimateCharacters([{mot,ipa}]).characters,planned.billableCharacters);
}
assert(M.estimateCharacters([{mot:'vi',ipa:'ˈvi'}]).characters>0);
const pilot=M.pilotCandidates(data),traits=new Set(pilot.entries.flatMap(entry=>entry.traits));
assert.equal(pilot.entries.length,18);
assert.equal(new Set(pilot.entries.map(entry=>entry.id)).size,18);
assert(pilot.basicWords>=pilot.entries.length/2);
assert.equal(pilot.executable,false);assert.equal(pilot.voice,null);assert.equal(pilot.pack,null);
for(const trait of ['neutra-tonica','o-atona-conservada','harmonitzacio-o-u','b-bilabial','v-labiodental','geminacio-bl','geminacio-gl','dieresi-hiat-tonic','dieresi-hiat-atonic','final-mp','final-nc','final-nt','ela-geminada'])assert(traits.has(trait),trait);
assert(pilot.entries.some(entry=>entry.azureCaEsCompatible===false));
assert.equal(pilot.estimate.characters,M.estimateCharacters(pilot.entries.map(entry=>({mot:entry.text,ipa:entry.ipa}))).characters);
const catalogWords=data.catalog.entries.filter(row=>row.mode==='words');
assert.deepEqual(new Set(data.rows.map(row=>row.id)),new Set(catalogWords.map(row=>row.id)));
const badRows=structuredClone(data.rows);badRows[0].varietat='central';
assert.throws(()=>T.validate(badRows,data.profile,data.catalog));
// Previous tables keep their identities and export bytes; this profile is additive.
for(const id of ['ca-central-didactic-v1','ca-valencian-didactic-v1'])T.exportData(T.load(id),true);
console.log(JSON.stringify({profile:M.PROFILE,...queue.summary,network:false,synthesis:false}));
