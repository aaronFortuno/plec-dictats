'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const A=require('./audio-plan.cjs'),G=require('./generate-audio.cjs'),M=require('../audio-manifest.js');
const root=A.ROOT,manifest=A.readJson(A.DEFAULT_MANIFEST),words=A.readJson(A.DEFAULT_CATALOG).catalog.entries.filter(e=>e.mode==='words');
const p=A.validatePack(manifest);assert.equal(p.status,'ready');assert(Object.keys(p.files).length>=3080);
const byId=new Map(words.map(w=>[w.id,w]));for(const [id,file]of Object.entries(p.files)){assert(byId.has(id));const coverage=M.coverage(manifest,[byId.get(id)],'ca','https://example.test/plec/');assert(coverage.ready);assert(coverage.urls[0].startsWith('https://example.test/plec/assets/audio/ca/'));assert(G.isValidMp3(fs.readFileSync(path.join(root,p.basePath,file))));}
const publication=A.readJson(path.join(root,'audio/central-publication.json'));assert.equal(publication.coverage,Object.keys(p.files).length);
if(publication.completion){const c=publication.completion,snapshot=A.readJson(path.join(root,'audio/pronunciation/recordings',c.pack+'.json')),reviewPack=A.readJson(path.join(root,'audio/review-manifest.json')).packs.find(p=>p.id===c.pack);assert.equal(c.decoded,219);assert.equal(c.failures,0);assert.equal(c.tableRevision,snapshot.tableRevision);assert.equal(c.fingerprint,reviewPack.fingerprint);assert.equal(Object.keys(p.files).length,3299);for(const e of snapshot.entries)assert.equal(reviewPack.ipas[e.id],e.ipa);}
for(const [relative,digest]of Object.entries(publication.sha256)){const bytes=fs.readFileSync(path.join(root,'assets/audio/ca',relative));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),digest);assert(G.isValidMp3(bytes));}
const pseudos=A.readJson(A.DEFAULT_CATALOG).catalog.entries.filter(e=>e.mode==='pseudo'),pseudoById=new Map(pseudos.map(e=>[e.id,e]));
const review=A.readJson(path.join(root,'audio/review-manifest.json'));for(const pack of review.packs){assert(!pack.mode||['words','pseudo'].includes(pack.mode));const reviewById=pack.mode==='pseudo'?pseudoById:byId;assert(/^[a-f0-9]{64}$/.test(pack.fingerprint));for(const [id,file]of Object.entries(pack.files)){assert(reviewById.has(id));assert(G.isValidMp3(fs.readFileSync(path.join(root,pack.basePath,file))));}}
const instructions=A.readJson(path.join(root,'audio/instructions/manifest.json'));assert.equal(instructions.packs[0].status,'ready');assert.equal(Object.keys(instructions.packs[0].files).length,5);for(const file of Object.values(instructions.packs[0].files))assert(G.isValidMp3(fs.readFileSync(path.join(root,instructions.packs[0].basePath,file))));
console.log('Published audio: word coverage, safe project subpaths, every MP3 and SHA-256, exact review recording identity and five instructions verified.');
require('./check-pseudo-publication.cjs').publicChecks();
const spanishId=manifest.defaultPacks.es;
if(spanishId){
 const spanish=A.readJson(path.join(root,'audio/spanish-publication.json'));
 const {pack:expected,plan,batch}=require('./run-spanish-audio.cjs');
 const pack=A.validatePack(manifest,expected.id),jobs=plan();
 const spanishWords=require('../catalogs/es/editions/seed-1-basic.json').catalog.entries;
 const coverage=M.coverage(manifest,spanishWords,'es','https://example.test/plec/');
 assert(coverage.ready&&coverage.urls.every(url=>url.startsWith('https://example.test/plec/assets/audio/es/')));
 assert.equal(pack.id,expected.id);
 assert.equal(pack.fingerprint,spanish.fingerprint);
 assert.equal(pack.reviewStatus,'pending-auditory-review');
 assert.equal(Object.keys(pack.files).length,350);
 assert.equal(spanish.decode.decoded,350);
 for(const job of jobs){
  assert.equal(pack.files[job.id],job.relativePath);
  const bytes=fs.readFileSync(path.join(root,pack.basePath,job.relativePath));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),spanish.sha256[job.relativePath]);
  assert(G.isValidMp3(bytes));
 }
 console.log('Spanish publication: 350 MP3 digests, review status and full language-specific student coverage verified.');
 if(spanishId!==expected.id){
  const expansion=A.readJson(path.join(root,'audio/spanish-expansion-publication.json'));
  const {pack:addition,edition}=batch(true),expanded=A.validatePack(manifest,addition.id);
  const full=M.coverage(manifest,edition.catalog.entries,'es','https://example.test/plec/');
  assert(full.ready);
  assert.equal(full.pack.id,spanishId);
  assert.equal(expansion.decode.decoded,706);
  assert.equal(expansion.catalogue,edition.catalog.revision);
  assert.equal(expanded.fingerprint,expansion.fingerprint);
  assert.equal(Object.keys(expanded.files).length,706);
  assert.equal(Object.keys(full.pack.files).length,1056);
  for(const job of plan(true)){
   const relative=expanded.files[job.id];
   assert.equal(relative,job.relativePath);
   assert.equal(full.pack.basePath+full.pack.files[job.id],expanded.basePath+relative);
   const audio=fs.readFileSync(path.join(root,expanded.basePath,relative));
   assert.equal(crypto.createHash('sha256').update(audio).digest('hex'),expansion.sha256[relative]);
   assert(G.isValidMp3(audio));
  }
  for(const [id,file] of Object.entries(pack.files))assert.equal(full.pack.basePath+full.pack.files[id],pack.basePath+file);
  console.log('Spanish expansion: 706 new recordings and all 1,056 words covered, including the original 350 audio URLs.');
 }
}
const valencianFile=path.join(root,'audio/valencian-publication.json');
if(fs.existsSync(valencianFile)){
 const v=A.readJson(valencianFile),pack=manifest.packs.find(p=>p.id===v.pack),r=review.packs.find(p=>p.id===v.pack),snapshot=A.readJson(path.join(root,'audio/pronunciation/recordings',v.pack+'.json'));
 assert(pack&&r);assert.equal(pack.voice,'ca-ES-EnricNeural');assert.equal(pack.reviewStatus,'pending-auditory-review');assert.equal(pack.fingerprint,v.fingerprint);assert.equal(r.fingerprint,v.fingerprint);assert.equal(v.coverage,3299);assert.equal(v.decode.decoded,3299);assert.equal(v.decode.failures,0);assert.equal(v.tableRevision,snapshot.tableRevision);
 const coverage=M.coverage(manifest,words,'ca','https://example.test/plec/',pack.id);assert(coverage.ready);assert.equal(coverage.missing,0);
 for(const entry of snapshot.entries){assert.equal(r.ipas[entry.id],entry.ipa);const relative=pack.files[entry.id];assert.equal(relative,r.files[entry.id]);const data=fs.readFileSync(path.join(root,pack.basePath,relative));assert.equal(crypto.createHash('sha256').update(data).digest('hex'),v.sha256[relative]);assert(G.isValidMp3(data));}
 console.log('Valencian publication: 3,299 files, SHA-256, frozen IPA, exact review identity and full student coverage verified.');
}
