'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const S = require('../seeds-v2.js');
const D = require('../dictation.js');
const edition = require('../catalogs/ca/editions/seed-1.json');
const expected = ['humilitat','herba','herbari','adherent','ulls','humitat','hora','anhelar','història','tothora','tothom','humana','huracà','himalaià','hoste','harmònic'];
for (const code of ['TCD7-AAAAA', '52E-4S3']) {
  const selected = D.resolveSelection(S, [edition], code, 'ca', edition.catalog.revision);
  assert.deepEqual(selected.entries.map(entry => entry.text), expected);
  assert.throws(() => D.resolveSelection(S, [edition], code, 'es'));
  assert.throws(() => D.resolveSelection(S, [edition], code, 'ca', 'ca-other'));
}
assert.throws(() => D.resolveSelection(S, [edition], 'O0I1LU', 'ca'));
const entries = [{id:'one'}, {id:'two'}];
const base = 'https://example.org/plec-dictats/';
const make = () => ({schemaVersion:1, defaultPacks:{ca:'central'}, packs:[{
  id:'central',language:'ca',status:'ready',basePath:'assets/audio/ca/central/',
  files:{one:'words/avió.mp3',two:'words/col·legi.mp3'}
}]});
let manifest = make();
let coverage = D.coverage(manifest, entries, 'ca', base);
assert.equal(coverage.ready,true);
assert.equal(coverage.missing,0);
assert.deepEqual(coverage.urls,[base+'assets/audio/ca/central/words/avi%C3%B3.mp3',base+'assets/audio/ca/central/words/col%C2%B7legi.mp3']);
delete manifest.packs[0].files.two;
coverage = D.coverage(manifest,entries,'ca',base);
assert.equal(coverage.ready,false);
assert.equal(coverage.missing,1);
assert.equal(coverage.urls[1],null);
manifest = make(); manifest.packs[0].status='pending';
assert.equal(D.coverage(manifest,entries,'ca',base).ready,false);
assert.throws(()=>D.coverage(make(),entries,'ca',base,'unknown'));
manifest = make();manifest.packs[0].language='es';
assert.throws(()=>D.coverage(manifest,entries,'ca',base));
for(const invalid of ['../escape.mp3','/escape.mp3','https://other.test/a.mp3','//other.test/a.mp3','words/%2e%2e/x.mp3','words\\x.mp3','words/x.mp3?x=1','words/x.mp3#x','words/x.txt','words/./x.mp3','words/x\n.mp3']){
  manifest=make();manifest.packs[0].files.one=invalid;
  assert.throws(()=>D.coverage(manifest,entries,'ca',base),undefined,invalid);
}
for(const invalid of ['../assets/','/assets/','https://other.test/','//other.test/','assets/%2e/','assets\\audio/','assets/audio']){
  manifest=make();manifest.packs[0].basePath=invalid;
  assert.throws(()=>D.coverage(manifest,entries,'ca',base),undefined,invalid);
}
for(const invalid of [null, [], 'files']){
  manifest=make();manifest.packs[0].files=invalid;
  assert.throws(()=>D.coverage(manifest,entries,'ca',base));
}
const root=path.resolve(__dirname,'..');
for(const page of ['ca/index.html','ca/dictat/index.html','ca/pronunciacions/index.html']){
  const html=fs.readFileSync(path.join(root,page),'utf8');
  assert(!html.includes('__CONFIG__')&&!html.includes('__REGISTRY__')&&!html.includes('__COMPOSER__'));
  for(const match of html.matchAll(/(?:src|href)="([^\"]+)"/g)){
    const ref=match[1];if(/^(?:https?:|lightning:|#)/.test(ref))continue;
    assert(fs.existsSync(path.resolve(root,path.dirname(page),ref.split('?')[0])),'Local resource '+ref);
  }
}
const studentHtml=fs.readFileSync(path.join(root,'ca/dictat/index.html'),'utf8');
assert(!studentHtml.includes('app.js')&&!studentHtml.includes('pdf-lib')&&!studentHtml.includes('/catalog.js'));
console.log('Dictat: codis antics/nous, llengua, ordre, cobertura, veu, rutes segures i entrada estàtica correctes.');
