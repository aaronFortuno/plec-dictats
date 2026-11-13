'use strict';
const assert=require('node:assert/strict'),A=require('../audio-varieties.js'),links=require('../site-links.js'),K=require('../core.js'),S=require('../seeds-v2.js'),R=require('../catalogs/ca/editions/index.js'),manifest=require('../audio/manifest.json');
const enric=manifest.packs.find(p=>p.dialect==='valencia'),alba=manifest.packs.find(p=>p.dialect==='central'),selection=S.resolve(R.editions,'ADZ52356A');
assert.equal(A.select(manifest,'ca').pack.id,alba.id);assert.equal(A.select(manifest,'ca',{variety:'valencia'}).pack.id,enric.id);assert.equal(A.select(manifest,'ca',{voice:enric.id}).variety.id,'valencia');assert.equal(A.select(manifest,'ca',{voice:enric.id,variety:'valencia'}).pack.id,enric.id);
for(const options of [{variety:'unknown'},{variety:''},{voice:'unknown'},{variety:'central',voice:enric.id},{variety:'valencia',voice:alba.id}])assert.throws(()=>A.select(manifest,'ca',options));
assert.throws(()=>A.select({...manifest,packs:[alba]},'ca',{variety:'valencia'}));assert.throws(()=>A.select(manifest,'es',{variety:'central'}));assert.throws(()=>links.dictationURL({language:'ca',seed:selection.code,variety:'unknown'}));
const results=[];for(const variety of ['central','valencia']){const shapes=K.worksheet({entries:selection.entries,seedCode:selection.code,variety}),url=new URL(shapes.find(s=>s.url).url);assert.equal(url.searchParams.get('variety'),variety);results.push(shapes.filter(s=>s.role!=='worksheet-qr'&&s.role!=='worksheet-link'));assert.deepEqual(S.resolve(R.editions,url.searchParams.get('seed')).entries,selection.entries);}assert.deepEqual(results[0],results[1]);
console.log('Pronunciation: teacher variety maps to the exact dialect, legacy voices resolve, mismatches/missing audio never fall back, QR preserves variety, seed and word layout stay unchanged.');
assert.equal(A.forLanguage('es')[0].id,'es-es');
const spanishURL=new URL(links.dictationURL({language:'es',seed:'ES-ADZ5-2356A',variety:'es-es'}));
assert.equal(spanishURL.searchParams.get('variety'),'es-es');
assert.throws(()=>links.dictationURL({language:'es',variety:'central'}));
assert.throws(()=>links.dictationURL({language:'ca',variety:'es-es'}));
if(manifest.defaultPacks.es){
 assert.equal(A.select(manifest,'es').pack.id,manifest.defaultPacks.es);
 assert.equal(A.select(manifest,'es',{variety:'es-es'}).pack.id,manifest.defaultPacks.es);
 assert.throws(()=>A.select(manifest,'es',{voice:alba.id}));
 assert.throws(()=>A.select(manifest,'es',{mode:'pseudo'}));
}
