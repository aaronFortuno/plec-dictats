const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const S=require('../seeds.js'),E=[require('../catalogs/ca/editions/seed-1.json')];
const recipe={mode:'words',count:24,stage:'cs',tags:S.WORD_FOCUSES};
const manifest=require('../catalogs/ca/editions/manifest.json');
assert.equal(crypto.createHash('sha256').update(fs.readFileSync('catalogs/ca/editions/seed-1.json')).digest('hex'),manifest.editions[0].sha256,'Archive must never change');
assert.deepEqual(require('../catalogs/ca/editions/index.js').editions,E,'Browser bundle matches the archived source');
assert.equal(S.ALPHABET.length,30);assert.equal(S.RECIPES,81975);assert.equal(S.VARIANTS,2223);
for(const vector of require('../docs/seeds-v1-vectors.json').vectors){
 const recovered=S.resolve(E,vector.code);
 assert.deepEqual(recovered.recipe,vector.recipe);assert.equal(recovered.nonce,vector.nonce);
 assert.deepEqual(recovered.entries.map(e=>e.id),vector.ids,'Preserve every word and its position');
 assert.deepEqual(recovered.entries.map(e=>e.text),vector.words);
}
const all=new Set();
for(let i=0;i<S.RECIPES;i++){
 assert.equal(S.recipeIndex(S.recipeAt(i)),i);
 for(const [epoch,nonce] of [[0,0],[0,2222],[3,0],[3,2222]]){
  const code=S.encode({epoch,recipe:i,nonce}),decoded=S.decode(code.toLowerCase().replace('-',' '));
  assert.equal(decoded.index,i);assert.equal(decoded.epoch,epoch);assert.equal(decoded.nonce,nonce);
  assert(!all.has(code));all.add(code);
 }
}
assert.throws(()=>S.decode('O0I-1LU'));
assert.throws(()=>S.resolve(E,S.encode({epoch:3,recipe,nonce:0})),/edició/);
assert.throws(()=>S.recipeIndex({...recipe,tags:[]}));
assert.throws(()=>S.recipeIndex({...recipe,tags:['custom']}));
assert.equal(S.recipeIndex({...recipe,tags:['essa','accent']}),S.recipeIndex({...recipe,tags:['accent','essa','accent']}),'Filter ordering does not change the recipe');
const prepared=S.prepare(E[0],recipe),code=S.encode({epoch:0,recipe,nonce:0});
assert.equal(code,'A7W-STC');
assert.deepEqual(S.resolve(E,code).entries.slice(0,4).map(e=>e.text),['diumenge','reduïda','empollar','lletges'],'Permanent regression vector');
for(const mode of ['words','pseudo'])for(const count of S.COUNTS)for(const stage of mode==='words'?S.STAGES:['all']){
 const r={mode,count,stage,tags:mode==='words'?S.WORD_FOCUSES:S.PSEUDO_FOCUSES},p=S.prepare(E[0],r);
 for(const nonce of [0,1,42,2222]){
  const entries=S.draw(p,nonce);assert.equal(entries.length,count);assert.equal(new Set(entries.map(e=>e.id)).size,count);
  assert.deepEqual(entries,S.resolve(E,S.encode({recipe:r,epoch:0,nonce})).entries);
  assert(entries.every(e=>p.pool.includes(e)));
 }
}
const expected=S.draw(prepared,127),required=expected.slice(0,5).map(e=>e.id);
const found=S.searchSync(prepared,required);
assert(found.found);assert(found.attempts<=S.VARIANTS);assert(required.every(id=>found.entries.some(e=>e.id===id)));
assert.deepEqual(found.entries,S.resolve(E,S.encode({epoch:0,recipe,nonce:found.nonce})).entries,'Search cannot inject requested words');
assert.throws(()=>S.searchSync(prepared,['not-in-pool']),/fora/);
assert.throws(()=>S.searchSync(prepared,expected.slice(0,6).map(e=>e.id)),/cinc/);
const narrow=S.prepare(E[0],{mode:'words',count:8,stage:'cs',tags:['signes']});
// Choose an absent combination by enumerating the finite domain, then ensure failure terminates.
let failed=null,failingIds=null;
for(let offset=0;offset<30&&!failed;offset++){
 const ids=Array.from({length:5},(_,i)=>narrow.pool[(offset+i*7)%narrow.pool.length].id);
 const result=S.searchSync(narrow,ids);if(!result.found){failed=result;failingIds=ids;}
}
assert(failed);assert.equal(failed.attempts,S.VARIANTS);
(async()=>{
 const asyncFound=await S.search(prepared,required,{start:0});assert.deepEqual(asyncFound,found);
 const controller=new AbortController();controller.abort();await assert.rejects(S.search(prepared,required,{signal:controller.signal}),/cancel/);
 const midSearch=new AbortController();let progress=0;
 await assert.rejects(S.search(narrow,failingIds,{signal:midSearch.signal,chunk:1,onProgress:n=>{progress=n;midSearch.abort();}}),/cancel/);
 assert.equal(progress,1,'Cancels an in-flight search between chunks');
 // Changing the live bank has no effect on archived code recovery.
 const live=require('../catalog.js'),backup=live.entries;live.entries=[];assert.equal(S.resolve(E,code).entries[0].text,'diumenge');live.entries=backup;
 console.log('Seeds: 327.900 round trips, immutable snapshot, golden vector, modes, filters, unique draws, bounded search and cancellation passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
