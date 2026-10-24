const assert=require('node:assert/strict'),S=require('../seeds-v2.js'),V1=require('../seeds.js');
const E=[require('../catalogs/ca/editions/seed-1.json')],recipe={mode:'words',count:24,stage:'cs',tags:S.WORD_FOCUSES};
assert.equal(S.VARIANTS,24300000);assert.equal(S.EPOCHS,9);
for(const vector of require('../docs/seeds-v2-vectors.json').vectors){
 const got=S.resolve(E,vector.code);assert.deepEqual(got.recipe,vector.recipe);assert.equal(got.nonce,vector.nonce);
 assert.deepEqual(got.entries.map(e=>e.id),vector.ids);assert.deepEqual(got.entries.map(e=>e.text),vector.words);
}
for(const vector of require('../docs/seeds-v1-vectors.json').vectors){
 const got=S.resolve(E,vector.code);assert.equal(got.protocol,1);assert.deepEqual(got.entries.map(e=>e.text),vector.words);
}
for(let index=0;index<S.RECIPES;index++)for(const[epoch,nonce]of[[0,0],[0,S.VARIANTS-1],[8,0],[8,S.VARIANTS-1]]){
 const code=S.encode({epoch,recipe:index,nonce}),got=S.decode(code.toLowerCase().replace('-',' '));
 assert.equal(got.epoch,epoch);assert.equal(got.index,index);assert.equal(got.nonce,nonce);assert.equal(got.protocol,2);
}
assert.throws(()=>S.decode('OOOO-00000'));assert.throws(()=>S.decode('ABC-2345'));assert.throws(()=>S.encode({epoch:9,recipe,nonce:0}));
assert.throws(()=>S.resolve(E,S.encode({epoch:8,recipe,nonce:0})),/edició/);
for(const mode of ['words','pseudo'])for(const count of S.COUNTS)for(const stage of mode==='words'?S.STAGES:['all']){
 const r={mode,count,stage,tags:mode==='words'?S.WORD_FOCUSES:S.PSEUDO_FOCUSES},p=S.prepare(E[0],r);
 const required=p.pool.slice(0,3).map(e=>e.id),matches=S.matcher(p,required);
 for(const nonce of [0,1,2222,2223,98271,1000000,S.VARIANTS-1]){
  const got=S.resolve(E,S.encode({epoch:0,recipe:r,nonce})),expected=V1.draw(p,nonce);
  assert.deepEqual(got.entries,expected);assert.equal(new Set(got.entries.map(e=>e.id)).size,count);
  assert.equal(matches(nonce),required.every(id=>expected.some(e=>e.id===id)),'Optimised matcher must exactly match the complete draw');
 }
}
const p=S.prepare(E[0],recipe),ids=['perquè','orquestra'].map(text=>p.pool.find(e=>e.text===text)?.id);assert(ids.every(Boolean));
const found=S.searchSync(p,ids);assert(found.found);assert(found.attempts>V1.VARIANTS,'Regression pair was missing from the complete old domain');
assert(ids.every(id=>found.entries.some(e=>e.id===id)));assert.deepEqual(found.entries,S.resolve(E,S.encode({epoch:0,recipe,nonce:found.nonce})).entries);
// Exactly 24 available candidates guarantee that every selected focus can share
// membership; selected focuses use OR and never impose category quotas.
const union=S.prepare(E[0],{...recipe,stage:'all'});
assert.equal(union.pool.length,3299);assert(union.pool.some(e=>e.tags.length===1),'All focuses admit words that cover only one focus');
assert(union.pool.every(e=>e.tags.some(t=>recipe.tags.includes(t))));
assert.throws(()=>S.searchSync(p,['not-in-pool']),/fora/);assert.throws(()=>S.searchSync(p,p.pool.slice(0,6).map(e=>e.id)),/cinc/);
const rare=p.pool.slice(0,5).map(e=>e.id);
(async()=>{
 const first=await S.search(p,rare,{start:S.VARIANTS-1000,maxAttempts:2000,budgetMs:Number.MIN_VALUE});
 assert(!first.found);assert(first.remaining>0);assert.equal(first.attempts,256);assert.equal(first.nextNonce,(S.VARIANTS-1000+first.attempts)%S.VARIANTS);
 const tail=S.searchSync(p,rare,{start:first.nextNonce,maxAttempts:first.remaining});
 assert.equal(first.attempts+tail.attempts,2000);assert.equal(tail.remaining,0,'A continued range ends without repeating or skipping variants');
 const controller=new AbortController();controller.abort();await assert.rejects(S.search(p,ids,{signal:controller.signal}),/cancel/);
 const mid=new AbortController();let progress=0;
 await assert.rejects(S.search(p,rare,{signal:mid.signal,budgetMs:Infinity,onProgress:n=>{progress=n;mid.abort();}}),/cancel/);assert(progress>0);
 const asyncFound=await S.search(p,ids,{budgetMs:Infinity});assert.deepEqual(asyncFound,found);
 console.log(JSON.stringify({message:'Protocol 2: 327,900 codec round trips, protocol 1 compatibility, exact matcher, real target pair, bounded batches, continuation and cancellation passed.',regressionCode:S.encode({epoch:0,recipe,nonce:found.nonce}),attempts:found.attempts,words:found.entries.map(e=>e.text)}));
})().catch(e=>{console.error(e);process.exitCode=1;});
