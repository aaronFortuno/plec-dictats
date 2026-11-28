'use strict';
const assert=require('node:assert/strict'),T=require('../text-dictations.js'),P=require('../prosody.js'),E=require('./prosody-estimate.cjs'),B=require('./prosody-batch.cjs');
for(const [code,batch]of [['CA001','ll01-four-rhythms-v1'],['CA002','ll02-four-rhythms-v1']]){
 const estimate=E.estimate(E.units(T.find(code))),legacy=B.compile(batch).estimate;
 for(const key of ['spokenWords','cueCount','plannedPauseSeconds','nominalSeconds','conservativeSeconds','maximumSeconds'])assert.equal(estimate[key],legacy[key],key+' matches the established planning method.');
}
const saved=require('../audio/texts/batches/ca003-ca006-prosody-proposal-v1.json'),entries=saved.entries.map(e=>T.find(e.textId)),proposal=E.proposal(entries);
assert.deepEqual(proposal,saved,'Published duration proposal must match the current plans.');assert.equal(entries.length,4);assert.equal(proposal.requests.length,4);assert.equal(proposal.minimumRequestsByDuration,4);assert.equal(proposal.singleRequest.renditions,16);assert.equal(proposal.singleRequest.withinDurationBudget,false);assert(proposal.singleRequest.nominalSeconds>900);
assert.equal(proposal.synthesisAuthorized,false);assert.equal(proposal.requestBody,null);assert.equal(proposal.newRequestsSent,0);assert.equal(proposal.inputBudgetValidated,false);assert.throws(()=>B.compile(proposal.id),/Lot desconegut/);
const seen=new Set();for(const request of proposal.requests){assert(request.estimate.withinDurationBudget);assert(request.estimate.conservativeSeconds<=390);assert.equal(request.requestBody,null);for(const version of request.versions){const key=version.entryId+':'+version.variant;assert(!seen.has(key));seen.add(key);}}
assert.equal(seen.size,16);for(const entry of entries)for(const v of P.build(entry).variants)assert(seen.has(entry.id+':'+v.id));
const pending=new Set();for(const [id,language,count,variety]of [['ca007-ca012-prosody-proposal-v1','ca',6,'Català central'],['es001-es012-prosody-proposal-v1','es',12,'Español de España']]){
 const stored=require('../audio/texts/batches/'+id+'.json'),items=stored.entries.map(e=>T.find(e.textId,language)),calculated=E.proposal(items,{id,status:'pending-prosody-validation',variety});assert.deepEqual(calculated,stored);assert.equal(stored.requests.length,count);assert(stored.minimumRequestsByDuration<=count);assert.equal(stored.voiceProposal,'Aoede');assert.equal(stored.synthesisAuthorized,false);assert.equal(stored.newRequestsSent,0);assert.equal(stored.inputBudgetValidated,false);assert.throws(()=>B.compile(id),/Lot desconegut/);
 for(const r of stored.requests){assert.equal(r.versions.length,4);assert.equal(new Set(r.versions.map(v=>v.entryId)).size,1);assert.equal(r.requestBody,null);assert(r.estimate.conservativeSeconds<=390);for(const v of r.versions){const key=v.entryId+':'+v.variant;assert(!pending.has(key));pending.add(key);}}
 assert(stored.entries.every(e=>e.teacherValidation==='approved'&&e.prosodyValidation==='pending'));
}assert.equal(pending.size,72);
assert.throws(()=>E.estimate([]),/lectura/);
console.log('Prosody estimates: legacy method parity, exact four-text/sixteen-version coverage, rejected oversized single batch, four duration-safe proposals, current manifest and no synthesis approval passed.');
