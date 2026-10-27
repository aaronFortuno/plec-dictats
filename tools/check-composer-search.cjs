'use strict';
const assert=require('node:assert/strict'),{create}=require('../composer-search.js');
function fixture(){const calls=[],prepared=[],engine={VARIANTS:10000,prepare:(edition,recipe)=>{prepared.push({edition,recipe});return {epoch:edition.slot,index:7};},encode:p=>JSON.stringify(p),search:(p,ids,options)=>new Promise((resolve,reject)=>calls.push({p,ids,options,resolve,reject}))};return {calls,prepared,engine,work:create({seeds:engine,randomNonce:()=>5})};}
const request=()=>({edition:{slot:2},recipe:{mode:'words',count:24,stage:'cs',tags:['accent']},required:['p-first']});
(async()=>{
 let f=fixture(),progress=[],r=request(),first=f.work.run({...r,onProgress:n=>progress.push(n)});assert(f.work.busy);r.recipe.tags.push('hac');r.required.push('p-second');assert.deepEqual(f.prepared[0].recipe.tags,['accent']);assert.deepEqual(f.calls[0].ids,['p-first']);
 const second=f.work.run({...request(),recipe:{...request().recipe,mode:'pseudo'}});assert(f.calls[0].options.signal.aborted);f.calls[0].options.onProgress(50);assert.deepEqual(progress,[]);
 f.calls[0].resolve({found:true,nonce:5,attempts:2});const stale=await first;assert.equal(stale.status,'stale');assert(!f.work.isCurrent(stale));assert(f.work.busy,'Late completion must not clear the next search');
 f.calls[1].resolve({found:true,nonce:6,attempts:3});const found=await second;assert.equal(found.status,'found');assert(f.work.isCurrent(found));assert(!f.work.busy);f.work.cancel();assert(!f.work.isCurrent(found),'Recovery/cancellation invalidates an already-resolved outcome too');
 f=fixture();first=f.work.run(request());f.calls[0].resolve({found:false,attempts:256,nextNonce:261,remaining:9744});let result=await first;assert.equal(result.status,'paused');assert(f.work.canResume);
 progress=[];const secondRun=f.work.run({...request(),resume:true,onProgress:n=>progress.push(n)});
 assert.equal(f.prepared.length,1);assert.equal(f.calls[1].options.start,261);assert.equal(f.calls[1].options.maxAttempts,9744);f.calls[1].options.onProgress(20);assert.deepEqual(progress,[276]);
 f.calls[1].resolve({found:false,attempts:9744,nextNonce:5,remaining:0});result=await secondRun;assert.equal(result.status,'exhausted');assert.equal(result.attempts,10000);assert(!f.work.canResume);f.calls[1].options.onProgress(100);assert.deepEqual(progress,[276],'Completed searches must stop publishing progress');
 f=fixture();first=f.work.run(request());f.work.cancel();f.calls[0].reject(Error('late transport failure'));assert.equal((await first).status,'stale');assert(!f.work.busy);assert(!f.work.canResume);
 f=fixture();first=f.work.run({...request(),previous:{epoch:2,index:7,nonce:5}});assert.equal(f.calls[0].options.start,6);f.calls[0].reject(Error('current failure'));result=await first;assert.equal(result.status,'error');assert.equal(result.error.message,'current failure');assert(!f.work.busy);
 f=fixture();f.engine.prepare=()=>{throw Error('No candidates');};result=await f.work.run(request());assert.equal(result.status,'error');assert(!f.work.busy);assert(!f.work.canResume);
 const S=require('../seeds-v2.js'),R=require('../catalogs/ca/editions/index.js'),edition=R.editions.find(e=>e.slot===R.current),recipe={mode:'words',stage:'cs',count:24,tags:['accent']},actual=create({seeds:S,randomNonce:()=>5});
 result=await actual.run({edition,recipe});assert.equal(result.status,'found');assert.equal(S.resolve(R.editions,result.code).entries.length,24);assert(S.resolve(R.editions,result.code).entries.every(e=>e.tags.includes('accent')));
 console.log('Composer lifecycle: stale results/progress/errors, copied filters, mode replacement, cancel/recover invalidation, exact continuation, exhaustion, errors and real seed engine passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
