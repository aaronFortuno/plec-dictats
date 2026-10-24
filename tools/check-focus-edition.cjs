const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const S=require('../seeds-v2.js'),R=require('../catalogs/ca/editions/index.js'),C=require('../catalogs/ca/catalog.js');
const current=R.editions.find(e=>e.slot===R.current);
assert.equal(current.slot,1);assert.deepEqual(current.catalog,C);
for(const item of require('../catalogs/ca/editions/manifest.json').editions){
 const bytes=fs.readFileSync('catalogs/ca/editions/'+item.file);
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),item.sha256);
}
for(const e of C.entries.filter(e=>e.mode==='words')){
 assert.equal(e.tags.includes('accent'),/[àèéíòóú]/u.test(e.text),e.text);
 assert.equal(e.tags.includes('dieresi'),/[ïü]/u.test(e.text),e.text);
 if(!e.tags.length)assert.equal(e.focusStatus,'unassigned');
}
for(const tags of [['accent'],['dieresi'],['accent','dieresi']])for(const stage of S.STAGES){
 const recipe={mode:'words',count:24,stage,tags};
 const available=C.entries.filter(e=>e.mode==='words'&&e.tags.some(t=>tags.includes(t))&&S.matchesStage(e,stage,current.profile.stageRules));
 if(available.length<24){assert.throws(()=>S.prepare(current,recipe),/disponibles/);continue;}
 const p=S.prepare(current,recipe);
 for(const nonce of [0,1,10000,S.VARIANTS-1]){
  const code=S.encode({epoch:current.slot,recipe,nonce}),selection=S.resolve(R.editions,code);
  assert(selection.entries.every(e=>tags.some(t=>t==='accent'?/[àèéíòóú]/u.test(e.text):/[ïü]/u.test(e.text))));
  assert.deepEqual(selection.entries,S.draw(p,nonce));
 }
}
for(const file of ['seeds-v1-vectors.json','seeds-v2-vectors.json'])for(const v of require('../docs/'+file).vectors){
 assert.deepEqual(S.resolve(R.editions,v.code).entries.map(e=>e.text),v.words);
}
const old=R.editions.find(e=>e.slot===0);assert(old.catalog.entries.find(e=>e.text==='examen').tags.includes('accent'));
assert.deepEqual(C.entries.map(e=>[e.id,e.mode,e.text]),old.catalog.entries.map(e=>[e.id,e.mode,e.text]),'Focus revision never changes words, identities or source order');
assert(!current.catalog.entries.find(e=>e.text==='examen').tags.includes('accent'));
assert(current.catalog.entries.find(e=>e.text==='córrer').tags.includes('accent'));
console.log('Current focus edition: strict accent/diaeresis, OR union, all levels, immutable archives and old codes verified.');
