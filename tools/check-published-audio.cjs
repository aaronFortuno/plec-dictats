'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const A=require('./audio-plan.cjs'),G=require('./generate-audio.cjs'),M=require('../audio-manifest.js');
const root=A.ROOT,manifest=A.readJson(A.DEFAULT_MANIFEST),words=A.readJson(A.DEFAULT_CATALOG).catalog.entries.filter(e=>e.mode==='words');
const p=A.validatePack(manifest);assert.equal(p.status,'ready');assert(Object.keys(p.files).length>=3080);
const byId=new Map(words.map(w=>[w.id,w]));for(const [id,file]of Object.entries(p.files)){assert(byId.has(id));const coverage=M.coverage(manifest,[byId.get(id)],'ca','https://example.test/plec/');assert(coverage.ready);assert(coverage.urls[0].startsWith('https://example.test/plec/assets/audio/ca/'));assert(G.isValidMp3(fs.readFileSync(path.join(root,p.basePath,file))));}
const publication=A.readJson(path.join(root,'audio/central-publication.json'));assert.equal(publication.coverage,Object.keys(p.files).length);
for(const [relative,digest]of Object.entries(publication.sha256)){const bytes=fs.readFileSync(path.join(root,'assets/audio/ca',relative));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),digest);assert(G.isValidMp3(bytes));}
const review=A.readJson(path.join(root,'audio/review-manifest.json'));for(const pack of review.packs){assert(/^[a-f0-9]{64}$/.test(pack.fingerprint));for(const [id,file]of Object.entries(pack.files)){assert(byId.has(id));assert(G.isValidMp3(fs.readFileSync(path.join(root,pack.basePath,file))));}}
const instructions=A.readJson(path.join(root,'audio/instructions/manifest.json'));assert.equal(instructions.packs[0].status,'ready');assert.equal(Object.keys(instructions.packs[0].files).length,5);for(const file of Object.values(instructions.packs[0].files))assert(G.isValidMp3(fs.readFileSync(path.join(root,instructions.packs[0].basePath,file))));
console.log('Published audio: word coverage, safe project subpaths, every MP3 and SHA-256, exact review recording identity and five instructions verified.');
