'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const A=require('./audio-plan.cjs'),M=require('../audio-manifest.js'),V=require('./verify-pseudo-audio.cjs'),P=require('./publish-pseudo-audio.cjs'),{prepare}=require('./prepare-pseudo-audio.cjs');
function fixture(){
 const batch=prepare(),results={},settings={},bytes=Buffer.alloc(400);bytes.set([0xff,0xf3,0x64,0xc4]);
 const status={phase:'completed',total:192,completed:192,readyPacks:batch.plans.map(i=>i.plan.pack.id)};
 const audit={schemaVersion:1,kind:'completed-pseudo-audio-integrity',decoder:'fixture',mode:'pseudo',total:192,decoded:192,failures:[],packs:[]};
 for(const item of batch.plans){const id=item.plan.pack.id,identity=V.expectedIdentity(item),files=Object.fromEntries(item.plan.jobs.map(j=>[j.id,j.relativePath]));results[id]={schemaVersion:1,pack:id,mode:'pseudo',files,deferred:[]};settings[id]=identity;audit.packs.push({id,profile:item.snapshot.profile,mode:'pseudo',decoded:96,...identity,files:Object.fromEntries(item.plan.jobs.map(j=>[j.id,{relativePath:j.relativePath,bytes:bytes.length,sampleRate:24000,channels:1,bitrateKbps:48,duration:2}])),sha256:Object.fromEntries(item.plan.jobs.map(j=>[j.relativePath,V.digest(bytes)]))});}
 return {batch,status,results,settings,audit,readFile:()=>bytes};
}
function unitChecks(){
 let input=fixture(),output=P.publicationPlan(input);assert.equal(output.assets.length,192);assert.equal(output.additions.length,2);assert.equal(output.publication.characters,16513);
 assert.deepEqual(V.mp3Header(input.readFile()),{sampleRate:24000,channels:1,bitrateKbps:48});assert.throws(()=>V.mp3Header(Buffer.alloc(20)));
 for(const pack of output.additions){assert.equal(pack.mode,'pseudo');assert.equal(pack.status,'ready');assert.equal(pack.reviewStatus,'pending-auditory-review');assert.equal(Object.keys(pack.files).length,96);assert(Object.keys(pack.files).every(id=>id.startsWith('s-')));}
 // Existing dictionaries, default packs and complete word objects survive unchanged.
 const before=A.readJson(A.DEFAULT_MANIFEST),untouched=JSON.stringify(before),merged=P.mergePacks(before,output.additions);assert.equal(JSON.stringify(before),untouched);assert.deepEqual(merged.defaultPacks,before.defaultPacks);for(const pack of before.packs)assert.deepEqual(merged.packs.find(p=>p.id===pack.id),pack);
 assert.throws(()=>P.mergePacks({packs:[{...output.additions[0],fingerprint:'0'.repeat(64)}]},output.additions),/identitat pública diferent/);
 input=fixture();input.status.completed=191;input.readFile=()=>{throw Error('Should not read assets');};assert.throws(()=>P.publicationPlan(input),/encara no consta complet/);
 input=fixture();input.status.readyPacks.pop();assert.throws(()=>P.publicationPlan(input),/Falta completar/);
 input=fixture();input.status.phase='stopped';assert.throws(()=>P.publicationPlan(input),/encara no consta complet/);
 input=fixture();input.audit.failures.push({reason:'decode'});assert.throws(()=>P.publicationPlan(input),/descodificar/);
 input=fixture();input.audit.decoded=191;assert.throws(()=>P.publicationPlan(input),/descodificar/);
 input=fixture();input.settings[input.batch.plans[0].plan.pack.id].voice='ca-ES-EnricNeural';assert.throws(()=>P.publicationPlan(input),/Identitat/);
 input=fixture();input.settings[input.batch.plans[0].plan.pack.id].ipaFingerprint='0'.repeat(64);assert.throws(()=>P.publicationPlan(input),/Identitat/);
 input=fixture();input.audit.packs[0].contentFingerprint='0'.repeat(64);assert.throws(()=>P.publicationPlan(input),/altres ajustos/);
 input=fixture();input.readFile=()=>Buffer.from([0xff,0xf3,0x64,0xc4]);assert.throws(()=>P.publicationPlan(input),/MP3 no verificat o canviat/);
 input=fixture();const altered=Buffer.from(input.readFile());altered[altered.length-1]=1;input.readFile=()=>altered;assert.throws(()=>P.publicationPlan(input),/MP3 no verificat o canviat/);
 input=fixture();const packId=input.batch.plans[0].plan.pack.id,wordId=Object.keys(input.results[packId].files)[0];delete input.results[packId].files[wordId];assert.throws(()=>P.publicationPlan(input),/incomplet/);
 input=fixture();input.results[packId].files[wordId]='../words/not-pseudo.mp3';assert.throws(()=>P.publicationPlan(input),/ruta/);
 input=fixture();input.results[packId].mode='words';assert.throws(()=>P.publicationPlan(input),/incomplet/);
 input=fixture();input.audit.packs[0].files[wordId].duration=0;assert.throws(()=>P.publicationPlan(input),/MP3 no verificat/);
 console.log('Pseudo publication: rejects unfinished/stopped batches, failed decoding, changed bytes, wrong voice/IPA identity, bad counts/paths/mode and preserves all existing word packs. No synthesis.');
}
function publicChecks(){
 const proof=path.join(A.ROOT,'audio/pseudo-publication.json');if(!fs.existsSync(proof))return false;
 const publication=A.readJson(proof),batch=prepare(),manifest=A.readJson(A.DEFAULT_MANIFEST),review=A.readJson(path.join(A.ROOT,'audio/review-manifest.json'));
 assert.equal(publication.mode,'pseudo');assert.equal(publication.coverage,192);assert.equal(publication.decode.decoded,192);assert.equal(publication.decode.failures,0);assert.equal(publication.packs.length,2);assert.equal(publication.characters,16513);
 for(const item of batch.plans){
  const id=item.plan.pack.id,identity=V.expectedIdentity(item),p=manifest.packs.find(p=>p.id===id),r=review.packs.find(p=>p.id===id),proof=publication.packs.find(p=>p.id===id);assert(p&&r&&proof);
  for(const record of [p,r,proof]){assert.equal(record.mode,'pseudo');assert.equal(record.dialect,item.snapshot.dialect);assert.equal(record.reviewStatus,'pending-auditory-review');for(const key of ['fingerprint','contentFingerprint','ipaFingerprint'])assert.equal(record[key],identity[key]);}
  assert.equal(p.status,'ready');assert.equal(r.status,'ready');assert.equal(p.profile,item.snapshot.profile);assert.equal(r.profile,item.snapshot.profile);assert.equal(p.basePath,'assets/audio/ca/'+id+'/');assert.equal(r.basePath,p.basePath);assert.equal(proof.coverage,96);assert.equal(proof.decode.decoded,96);assert.equal(proof.decode.failures,0);assert.equal(Object.keys(p.files).length,96);assert.equal(Object.keys(r.files).length,96);assert.equal(Object.keys(r.ipas).length,96);assert.equal(Object.keys(proof.sha256).length,96);
  for(const job of item.plan.jobs){assert.equal(p.files[job.id],job.relativePath);assert.equal(r.files[job.id],job.relativePath);assert.equal(r.ipas[job.id],job.ipa);const bytes=fs.readFileSync(path.join(A.ROOT,p.basePath,job.relativePath));assert.equal(V.digest(bytes),proof.sha256[job.relativePath]);assert.deepEqual(V.mp3Header(bytes),{sampleRate:24000,channels:1,bitrateKbps:48});}
  const coverage=M.coverage(manifest,item.snapshot.entries.map(e=>({...e,mode:'pseudo'})),'ca','https://example.test/plec/',id);assert(coverage.ready);assert.equal(coverage.missing,0);
 }
 console.log('Published pseudo audio: 192 files, SHA-256, exact frozen IPA/recording identities, separate dialect packs, review maps and complete playback coverage checked.');return true;
}
if(require.main===module){unitChecks();publicChecks();}
module.exports={unitChecks,publicChecks};
