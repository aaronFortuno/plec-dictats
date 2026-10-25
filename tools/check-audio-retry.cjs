'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),fsp=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const G=require('./generate-audio.cjs'),A=require('./audio-plan.cjs');
const manifest=structuredClone(A.readJson(A.DEFAULT_MANIFEST));
const seed={catalog:{entries:[{id:'p-a',text:'paper',mode:'words'}]}};
const options={seed,manifest,mode:'words',execute:true,confirmF0:true,retryTransient:true};
const response=()=>new Response(Buffer.from([0x49,0x44,0x33,1]),{headers:{'content-type':'audio/mpeg'}});
(async()=>{const root=await fsp.mkdtemp(path.join(os.tmpdir(),'plec-audio-retry-'));try{
 let counter=0;
 function fixture(){let time=Date.parse('2026-10-25T12:00:00Z');return {outputRoot:path.join(root,String(++counter)),env:{SPEECH_KEY:'fixture',SPEECH_REGION:'westeurope'},now:()=>new Date(time),sleep:async ms=>{time+=ms;},log:()=>{}};}
 const d=fixture(),requests=[],events=[];d.fetch=async()=>{requests.push(d.now().getTime());if(requests.length===1)throw Error('offline');if(requests.length===2)return new Response('',{status:503});return response();};d.onProgress=e=>events.push(e);
 let result=await G.runGeneration(options,d);assert(result.ok);assert.deepEqual(requests.slice(1).map((n,i)=>n-requests[i]),[60000,60000]);assert.equal(events.filter(e=>e.phase==='retrying').length,2);
 const cost=A.buildJobs(seed,manifest,options).jobs[0].billableCharacters;
 assert.equal(A.readJson(path.join(d.outputRoot,'audio/usage.json')).months['2026-10'].reservedCharacters,3*cost);
 result=await G.runGeneration(options,d);assert(result.ok);assert.equal(requests.length,3,'Completed MP3 is skipped');
 for(const status of [400,401,403,429]){const f=fixture();let calls=0;f.fetch=async()=>{calls++;return new Response('',{status});};const r=await G.runGeneration(options,f);assert.equal(r.reason,'http-'+status);assert.equal(calls,1);}
 const stopped=fixture();let stop=false,calls=0;stopped.fetch=async()=>{calls++;throw Error();};stopped.sleep=async()=>{stop=true;};stopped.shouldStop=()=>stop;
 result=await G.runGeneration(options,stopped);assert.equal(result.reason,'cancelled');assert.equal(calls,1);
 const budget=fixture(),ledger=G.emptyLedger();ledger.months['2026-10']={reservedCharacters:G.MONTHLY_LIMIT-cost,usedElsewhere:0};await G.atomicWriteJson(path.join(budget.outputRoot,'audio/usage.json'),ledger);calls=0;budget.fetch=async()=>{calls++;throw Error();};result=await G.runGeneration(options,budget);assert.equal(result.reason,'budget');assert.equal(calls,1);
 const local=fixture();calls=0;let saves=0;local.fetch=async()=>{calls++;return response();};local.writeCompleteFile=async(...args)=>{if(++saves===1)throw Object.assign(Error(),{code:'EBUSY'});return G.writeCompleteFile(...args);};result=await G.runGeneration(options,local);assert(result.ok);assert.equal(saves,2);assert.equal(calls,1,'Local file retry must not resynthesise or reserve another request');
 assert.equal(G.parseArguments(['--retry-transient']).retryTransient,true);
 assert.equal(require('./run-instructions-batch.cjs').wordBatchGate({phase:'retrying'},true,true),'wait');
 assert.equal(require('./run-pronunciation-sample.cjs').prerequisiteGate({phase:'retrying'},{phase:'waiting'},true,true,true),'wait');
 console.log('Audio retry: minute intervals, resumed MP3, budget per attempt, stop, non-retryable auth/quota and local-save reuse verified without network.');
 }finally{await fsp.rm(root,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
