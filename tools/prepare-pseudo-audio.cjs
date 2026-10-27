'use strict';
// Offline preparation and immutable per-variety inputs; no credentials or API calls.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const A=require('./audio-plan.cjs'),T=require('./pronunciation-table.cjs');
const SPECS=[['central','Alba','ca-central-pseudo-didactic-v1','ca-central-alba-pseudo-ipa-v1'],['valencia','Enric','ca-valencian-pseudo-didactic-v1','ca-valencian-enric-pseudo-ipa-v1']];
const hash=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
function prepare({write=false}={}){
 const plans=SPECS.map(([dialect,name,profileId,id])=>{
  const data=T.load(profileId);if(data.profile.mode!=='pseudo'||data.rows.length!==96||data.rows.some(r=>!r.ipa))throw Error('Falta completar el perfil de 96 pseudoparaules: '+profileId);
  const snapshot={schemaVersion:1,profile:profileId,mode:'pseudo',language:'ca',dialect,diction:data.profile.diction,catalogFingerprint:data.profile.catalogFingerprint,entries:data.rows.map(r=>({id:r.id,text:r.mot,ipa:r.ipa,status:r.estat_ipa}))};
  const snapshotPath=path.join(T.ROOT,'recordings',id+'.json');
  if(fs.existsSync(snapshotPath)){if(hash(A.readJson(snapshotPath))!==hash(snapshot))throw Error('IPA congelada incompatible: crea un nou paquet.');}
  else if(write){fs.mkdirSync(path.dirname(snapshotPath),{recursive:true});fs.writeFileSync(snapshotPath,JSON.stringify(snapshot,null,2)+'\n',{flag:'wx'});}
  const fingerprint=hash(snapshot),pack={id,language:'ca',dialect,mode:'pseudo',profile:profileId,label:(dialect==='central'?'Català central':'Valencià')+' · '+name+' · pseudoparaules · IPA en revisió',provider:'azure',locale:'ca-ES',voice:'ca-ES-'+name+'Neural',rate:'-10%',format:A.OUTPUT_FORMAT,basePath:'assets/audio/ca/'+id+'/',status:'pending-review',reviewStatus:'pending-auditory-review',contentFingerprint:fingerprint,generationPolicy:{requireIpa:true,...(dialect==='valencia'?{ipaInventory:'ca-valencian-v-experimental'}:{})},files:{}};
  const config={seed:{catalog:{language:'ca',entries:snapshot.entries.map(e=>({...e,mode:'pseudo'}))}},manifest:{schemaVersion:1,packs:[pack],defaultPacks:{ca:id}},mode:'pseudo'};
  const plan=A.buildJobs(config.seed,config.manifest,config);
  return {snapshot,snapshotPath,config,plan,summary:A.summarize(plan.jobs)};
 });
 return {plans,characters:plans.reduce((sum,p)=>sum+p.summary.characters,0),requests:plans.reduce((sum,p)=>sum+p.summary.requests,0)};
}
if(require.main===module){try{if(process.argv.slice(2).some(a=>a!=='--write'))throw Error('Ús: node tools/prepare-pseudo-audio.cjs [--write]');const p=prepare({write:process.argv.includes('--write')});console.log(JSON.stringify({network:false,requests:p.requests,characters:p.characters,packs:p.plans.map(p=>({id:p.plan.pack.id,...p.summary}))}));}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={SPECS,prepare,hash};
