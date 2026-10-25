'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const A=require('./audio-plan.cjs'),T=require('./pronunciation-table.cjs'),G=require('./generate-audio.cjs'),{loadAzureEnvironment}=require('./azure-credentials.cjs');
const ID='ca-central-alba-completion-v1',SNAPSHOT=path.join(T.ROOT,'recordings/'+ID+'.json'),DIR=path.join(A.ROOT,'output/audio');
function prepare({create=false}={}){
 const base=A.validatePack(A.readJson(A.DEFAULT_MANIFEST),'ca-central-alba-v1');
 if(!fs.existsSync(SNAPSHOT)){
  if(!create)throw Error('Falta preparar la instantània de compleció.');
  const table=T.load('ca-central-didactic-v1'),entries=table.rows.filter(r=>!base.files[r.id]).map(r=>({id:r.id,text:r.mot,ipa:r.ipa,mode:'words'}));
  if(entries.length!==219||entries.some(e=>!e.ipa))throw Error('Selecció de mots pendents inesperada.');
  const data={schemaVersion:1,profile:table.profile.id,pack:ID,tableRevision:crypto.createHash('sha256').update(JSON.stringify(entries)).digest('hex'),review:'Propostes IPA centrals pendents de contrast i escolta.',entries};
  fs.writeFileSync(SNAPSHOT,JSON.stringify(data,null,2)+'\n',{flag:'wx'});
 }
 const snapshot=A.readJson(SNAPSHOT);if(snapshot.pack!==ID||crypto.createHash('sha256').update(JSON.stringify(snapshot.entries)).digest('hex')!==snapshot.tableRevision)throw Error('Instantània incompatible.');
 const pack={...base,id:ID,label:'Català central · Alba · compleció IPA',files:{},basePath:'assets/audio/ca/'+ID+'/',status:'pending',generationPolicy:{requireIpa:true}};
 const config={seed:{catalog:{language:'ca',entries:snapshot.entries}},manifest:{schemaVersion:1,defaultPacks:{ca:ID},packs:[pack]},mode:'words'};
 return {snapshot,config,plan:A.buildJobs(config.seed,config.manifest,config)};
}
async function run(execute=false){const p=prepare({create:process.argv.includes('--snapshot')});console.log(JSON.stringify({simulated:!execute,pack:ID,...A.summarize(p.plan.jobs)}));if(!execute)return {ok:true,simulated:true};
 const release=G.acquireLock(path.join(DIR,'central-completion-runner.lock')),state={phase:'preparing',pid:process.pid,pack:ID,profile:p.snapshot.profile,tableRevision:p.snapshot.tableRevision,total:p.plan.jobs.length,completed:0,startedAt:new Date().toISOString()};
 const save=()=>G.atomicWriteJson(path.join(DIR,'central-completion-status.json'),{...state,updatedAt:new Date().toISOString()});
 try{await save();const r=await G.runGeneration({...p.config,execute:true,confirmF0:true,retryTransient:true},{fetch:globalThis.fetch,env:loadAzureEnvironment({}),shouldStop:()=>fs.existsSync(path.join(DIR,'STOP')),onProgress:async progress=>{Object.assign(state,progress);await save();}});Object.assign(state,{phase:r.ok?'completed':'stopped',reason:r.reason||null,result:r});if(r.ok)state.completed=state.total;await save();return r;}
 catch{state.phase='stopped';state.reason='local-error';await save();return {ok:false,reason:state.reason};}finally{release();}
}
if(require.main===module)run(process.argv.includes('--execute')).then(r=>{if(!r.ok)process.exitCode=1;}).catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={prepare,run,ID,SNAPSHOT};
