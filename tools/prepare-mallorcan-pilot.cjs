'use strict';
// Bounded, offline preparation. No credentials or synthesis in this module.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const A=require('./audio-plan.cjs'),T=require('./pronunciation-table.cjs');
const SNAPSHOT=path.join(T.ROOT,'recordings/ca-mallorcan-palma-pilot-v1.json');
const VOICES=['Joana','Alba','Enric'];
function prepare({write=false}={}){
 const candidates=A.readJson(path.join(T.ROOT,'ca/mallorcan-pilot-candidates.json')),data=T.load('ca-mallorcan-didactic-v1');
 let snapshot;
 if(fs.existsSync(SNAPSHOT))snapshot=A.readJson(SNAPSHOT);
 else{
  const rows=T.planWords(data,candidates.entries.map(e=>e.text)).entries;
  snapshot={schemaVersion:1,id:'ca-mallorcan-palma-pilot-v1',profile:data.profile.id,reference:'Palma · model editorial formal/didàctic en revisió, no una descripció de tots els parlants.',catalogFingerprint:data.profile.catalogFingerprint,linguisticStatus:'pending',audioStatus:'pending-listening',voices:VOICES,entries:rows.map(e=>({id:e.id,text:e.text,ipa:e.ipa}))};
  if(write){fs.mkdirSync(path.dirname(SNAPSHOT),{recursive:true});fs.writeFileSync(SNAPSHOT,JSON.stringify(snapshot,null,2)+'\n',{flag:'wx'});}
 }
 if(snapshot.schemaVersion!==1||snapshot.id!=='ca-mallorcan-palma-pilot-v1'||snapshot.profile!==data.profile.id||snapshot.catalogFingerprint!==data.profile.catalogFingerprint||snapshot.entries.length!==18||JSON.stringify(snapshot.voices)!==JSON.stringify(VOICES))throw Error('Identitat incompatible de la mostra mallorquina.');
 const identities=new Map(data.catalog.entries.map(e=>[e.id,e.text]));
 if(new Set(snapshot.entries.map(e=>e.id)).size!==18||snapshot.entries.some(e=>identities.get(e.id)!==e.text))throw Error('ID o grafia incompatible.');
 const fingerprint=crypto.createHash('sha256').update(JSON.stringify(snapshot)).digest('hex');
 const plans=VOICES.map(name=>{
  const id='ca-mallorcan-palma-'+name.toLowerCase()+'-pilot-v1';
  const pack={id,language:'ca',dialect:'mallorqui',locale:'ca-ES',voice:'ca-ES-'+name+'Neural',provider:'azure',rate:'-10%',format:A.OUTPUT_FORMAT,basePath:'assets/audio/ca/'+id+'/',files:{},status:'pending-listening',profile:snapshot.profile,reference:'Palma',contentFingerprint:fingerprint,generationPolicy:{requireIpa:true,ipaInventory:'ca-mallorcan-v-experimental'}};
  const config={seed:{catalog:{language:'ca',entries:snapshot.entries.map(e=>({...e,mode:'words'}))}},manifest:{schemaVersion:1,defaultPacks:{ca:id},packs:[pack]},mode:'words'};
  const plan=A.buildJobs(config.seed,config.manifest,config);
  return {name,pack,config,jobs:plan.jobs,...A.summarize(plan.jobs)};
 });
 return {snapshot,fingerprint,plans,requests:plans.reduce((n,p)=>n+p.jobs.length,0),characters:plans.reduce((n,p)=>n+p.characters,0)};
}
if(require.main===module){try{if(process.argv.slice(2).some(a=>a!=='--write'))throw Error('Ús: node tools/prepare-mallorcan-pilot.cjs [--write]');const p=prepare({write:process.argv.includes('--write')});console.log(JSON.stringify({network:false,executable:false,voices:VOICES,words:p.snapshot.entries.length,requests:p.requests,characters:p.characters,fingerprint:p.fingerprint}));}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={prepare,SNAPSHOT};
