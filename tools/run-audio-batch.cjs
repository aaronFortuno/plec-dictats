'use strict';
// Lot complet de paraules amb la política del paquet. Només --execute inicia xarxa.
const fs=require('node:fs'),path=require('node:path');
const {ROOT,buildJobs,readJson,DEFAULT_CATALOG,DEFAULT_MANIFEST,summarize}=require('./audio-plan.cjs');
const {loadAzureEnvironment}=require('./azure-credentials.cjs');
const {runGeneration}=require('./generate-audio.cjs');
const {replaceFileSync}=require('./local-files.cjs');
const directory=path.join(ROOT,'output/audio');
const statusPath=path.join(directory,'batch-status.json');
const stopPath=path.join(directory,'STOP');
const seed=readJson(DEFAULT_CATALOG),manifest=readJson(DEFAULT_MANIFEST);
const options={seed,manifest,mode:'words'};
const plan=buildJobs(seed,manifest,options);
const estimate=summarize(plan.jobs);
if(!process.argv.includes('--execute')){
 console.log(JSON.stringify({simulated:true,...estimate,deferred:plan.deferred.length}));
}else{
 const state={pack:plan.pack.id,phase:'preparing',startedAt:new Date().toISOString(),total:plan.jobs.length,completed:0,downloaded:0,skipped:0,deferred:plan.deferred.length,estimatedCharacters:estimate.characters};
 let stopped=false,ownsStatus=false;
 function save(){if(!ownsStatus)return;const temp=statusPath+'.part';fs.writeFileSync(temp,JSON.stringify({...state,updatedAt:new Date().toISOString()},null,2)+'\n');replaceFileSync(temp,statusPath);}
 process.on('SIGINT',()=>{stopped=true;});process.on('SIGTERM',()=>{stopped=true;});
 (async()=>{
   fs.mkdirSync(directory,{recursive:true});
   // No sobreescriguis el seguiment d'un altre lot encara actiu.
   const lockPath=path.join(directory,'batch-runner.lock');
   let lock;
   try{lock=fs.openSync(lockPath,'wx');}catch{throw new Error('Hi ha un lot o un bloqueig anterior.');}
   try{
     ownsStatus=true;fs.writeFileSync(lock,JSON.stringify({pid:process.pid,startedAt:state.startedAt}));save();
     const result=await runGeneration({...options,execute:true,confirmF0:true,usedElsewhere:0},{
       env:loadAzureEnvironment({}),fetch:globalThis.fetch,
       shouldStop:()=>stopped||fs.existsSync(stopPath),
       onProgress:progress=>{Object.assign(state,progress,{phase:'running'});save();}
     });
     Object.assign(state,{phase:result.ok?'completed':result.reason==='cancelled'?'stopped':'failed',reason:result.reason||null,localErrorCode:result.localErrorCode||null,finishedAt:new Date().toISOString()});save();
     if(!result.ok)process.exitCode=1;
   }finally{fs.closeSync(lock);fs.unlinkSync(lockPath);}
 })().catch(()=>{state.phase='failed';state.finishedAt=new Date().toISOString();state.reason='local-setup-error';save();console.error('Lot aturat per un error local; no es mostren credencials.');process.exitCode=1;});
}
