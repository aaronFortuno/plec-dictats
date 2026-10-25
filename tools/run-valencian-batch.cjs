'use strict';
const fs=require('node:fs'),path=require('node:path'),{prepare}=require('./prepare-valencian-batch.cjs');
const A=require('./audio-plan.cjs'),G=require('./generate-audio.cjs'),{loadAzureEnvironment}=require('./azure-credentials.cjs');
const DIR=path.join(A.ROOT,'output/audio'),STATUS=path.join(DIR,'valencian-batch-status.json');
async function run({execute=false}={}){
 const p=prepare();console.log(JSON.stringify({simulated:!execute,pack:p.plan.pack.id,...p.summary}));if(!execute)return {ok:true,simulated:true};
 if(fs.existsSync(path.join(DIR,'STOP')))throw Error('stop-file');
 const release=G.acquireLock(path.join(DIR,'valencian-batch-runner.lock'));
 const state={phase:'preparing',pid:process.pid,pack:p.plan.pack.id,profile:p.snapshot.profile,tableRevision:p.snapshot.tableRevision,total:p.summary.words,completed:0,startedAt:new Date().toISOString()};
 const save=()=>G.atomicWriteJson(STATUS,{...state,updatedAt:new Date().toISOString()});
 try{
  await save();
  const r=await G.runGeneration({...p.config,execute:true,confirmF0:true,retryTransient:true},{env:loadAzureEnvironment({}),fetch:globalThis.fetch,
   shouldStop:()=>fs.existsSync(path.join(DIR,'STOP')),onProgress:async progress=>{Object.assign(state,progress);await save();}});
  Object.assign(state,{phase:r.ok?'completed':'stopped',reason:r.reason||null,result:r});if(r.ok)state.completed=state.total;await save();return r;
 }catch(e){Object.assign(state,{phase:'stopped',reason:e.message==='stop-file'?'stop-file':'local-error'});await save();return {ok:false,reason:state.reason};}
 finally{release();}
}
if(require.main===module)run({execute:process.argv.includes('--execute')}).then(r=>{if(!r.ok)process.exitCode=1;}).catch(()=>{console.error('No es pot iniciar el lot valencià. Revisa estat, locks i instantània.');process.exitCode=1;});
module.exports={run,STATUS};
