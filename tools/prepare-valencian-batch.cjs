'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const A=require('./audio-plan.cjs'),T=require('./pronunciation-table.cjs');
const SNAPSHOT=path.join(T.ROOT,'recordings/ca-valencian-enric-ipa-v1.json');
function prepare({create=false}={}){
 if(!fs.existsSync(SNAPSHOT)){
  if(!create)throw Error('Cal preparar primer la instantània IPA del lot.');
  const table=T.load('ca-valencian-didactic-v1');if(table.rows.some(r=>!r.ipa))throw Error('Falta IPA.');
  const entries=table.rows.map(r=>({id:r.id,text:r.mot,ipa:r.ipa,mode:'words'}));
  const revision=crypto.createHash('sha256').update(JSON.stringify(entries)).digest('hex');
  const data={schemaVersion:1,profile:table.profile.id,pack:'ca-valencian-enric-ipa-v1',tableRevision:revision,review:'Propostes fonètiques pendents de contrast lingüístic i revisió auditiva.',entries};
  fs.mkdirSync(path.dirname(SNAPSHOT),{recursive:true});fs.writeFileSync(SNAPSHOT,JSON.stringify(data,null,2)+'\n',{flag:'wx'});
 }
 const snapshot=A.readJson(SNAPSHOT),entries=snapshot.entries;
 if(snapshot.schemaVersion!==1||snapshot.pack!=='ca-valencian-enric-ipa-v1'||crypto.createHash('sha256').update(JSON.stringify(entries)).digest('hex')!==snapshot.tableRevision)throw Error('Instantània de lot incompatible.');
 const base=A.validatePack(A.readJson(A.DEFAULT_MANIFEST),'ca-central-alba-v1');
 const pack={...base,id:snapshot.pack,voice:'ca-ES-EnricNeural',dialect:'valencia',label:'Valencià · Enric · IPA en revisió',status:'pending',files:{},basePath:'assets/audio/ca/'+snapshot.pack+'/',pronunciationStyle:'didactic-explicit',generationPolicy:{requireIpa:true,ipaInventory:'ca-valencian-v-experimental'}};
 const config={seed:{catalog:{language:'ca',entries}},manifest:{schemaVersion:1,defaultPacks:{ca:pack.id},packs:[pack]},mode:'words'};
 const plan=A.buildJobs(config.seed,config.manifest,config);return {snapshot,config,plan,summary:A.summarize(plan.jobs)};
}
if(require.main===module){const p=prepare({create:process.argv.includes('--snapshot')});console.log(JSON.stringify({pack:p.plan.pack.id,...p.summary,revision:p.snapshot.tableRevision}));}
module.exports={prepare,SNAPSHOT};
