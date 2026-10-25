'use strict';
// Twenty-word audition only, shared quota and locks; simulation is the default.
const fs=require('node:fs'),path=require('node:path');
const A=require('./audio-plan.cjs'),G=require('./generate-audio.cjs'),R=require('./run-pronunciation-sample.cjs');
const {prepare}=require('./prepare-valencian-pilot.cjs'),{loadAzureEnvironment}=require('./azure-credentials.cjs');
const {replaceFileSync}=require('./local-files.cjs');
async function run({execute=false,confirmF0=false}={}){
 const pilot=prepare();console.log(JSON.stringify({simulated:!execute,...pilot.summary,pack:pilot.sample.pack.id,excluded:pilot.excluded.map(e=>e.text)}));
 if(!execute)return {ok:true,simulated:true};
 if(!confirmF0)throw Error('Cal confirmar F0 amb --confirm-f0.');
 const root=path.join(A.ROOT,'output'),directory=path.join(root,'audio');
 if(R.prerequisites(root)!=='ready')throw Error('previous-batch-not-completed-or-locked');
 if(fs.existsSync(path.join(directory,'STOP')))throw Error('stop-file');
 const release=G.acquireLock(path.join(directory,'valencian-pilot-runner.lock'));
 const state={phase:'running',pack:pilot.sample.pack.id,total:pilot.sample.jobs.length,completed:0,review:'pending',startedAt:new Date().toISOString()};
 const save=()=>{const file=path.join(directory,'valencian-pilot-status.json');fs.writeFileSync(file+'.part',JSON.stringify(state,null,2)+'\n');replaceFileSync(file+'.part',file);};
 try{
  await save();
  let html=R.reviewHtml(pilot.sample).replaceAll('pronunciation-sample-status.json','valencian-pilot-status.json');
  html=html.replace('Comparació de pronunciacions','Valencià · prova amb Enric').replace('Comparació de pronunciacions','Valencià · prova amb Enric');
  html=html.replace('Model didàctic: accent correcte, ela geminada llarga i finals nt/nc explícits. Les proves no estan aprovades ni substitueixen els originals. No s’afegeixen vocals ni pauses dins del mot.','Vint propostes IPA valencianes amb Enric, pendents de contrast lingüístic i escolta. La veu no està validada com a valenciana. L’original de comparació és el model central amb Alba. Vi i vaca queden fora d’aquesta prova per la v labiodental no documentada en ca-ES.');
  fs.writeFileSync(path.join(directory,'comparacio-valencia.html'),html);
  const result=await G.runGeneration({...pilot.config,execute:true,confirmF0:true,retryTransient:true},{env:loadAzureEnvironment({}),fetch:globalThis.fetch,
   shouldStop:()=>fs.existsSync(path.join(directory,'STOP')),onProgress:progress=>{Object.assign(state,progress);save();}});
  state.phase=result.ok?'completed':'stopped';state.reason=result.reason||null;
  if(result.ok)state.completed=state.total;await save();return result;
 }catch{state.phase='stopped';state.reason='local-error';await save();return {ok:false,reason:state.reason};}
 finally{release();}
}
if(require.main===module){const args=process.argv.slice(2);
 if(args.some(a=>!['--execute','--confirm-f0'].includes(a))){console.error('Ús: node tools/run-valencian-pilot.cjs [--execute --confirm-f0]');process.exitCode=1;}
 else run({execute:args.includes('--execute'),confirmF0:args.includes('--confirm-f0')}).then(r=>{if(!r.ok)process.exitCode=1;}).catch(()=>{console.error('No es pot preparar o iniciar el pilot valencià.');process.exitCode=1;});
}
module.exports={run};
