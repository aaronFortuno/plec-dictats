'use strict';
// A bounded, offline plan. This tool never loads credentials or calls Azure.
const fs=require('node:fs'),path=require('node:path');
const A=require('./audio-plan.cjs'),T=require('./pronunciation-table.cjs'),R=require('./run-pronunciation-sample.cjs');
function prepare(){
 const metadata=A.readJson(path.join(T.ROOT,'ca-valencian-pilot.json')),data=T.load(metadata.profile);
 const selection=T.planWords(data,metadata.entries.map(e=>e.mot));
 const base=A.validatePack(A.readJson(A.DEFAULT_MANIFEST));
 const pack={...base,id:metadata.pack,dialect:data.profile.dialect,voice:metadata.voice,label:'Valencià · prova Enric pendent de validació',
  status:'pending',basePath:'assets/audio/ca/'+metadata.pack+'/',files:{},pronunciationStyle:data.profile.diction,generationPolicy:{requireIpa:true}};
 const compatible=selection.entries.filter(e=>e.azureCaEsCompatible);
 if(!compatible.length||compatible.length>24)throw Error('La prova ha de tenir entre 1 i 24 mots compatibles.');
 const sample={pack,jobs:compatible.map(e=>{const row=data.rows.find(r=>r.id===e.id),file='words/'+A.wordFileName(e.text);
  return {...e,note:row.notes,reviewStatus:'needs-review',relativePath:file,baselinePath:'output/audio/'+base.id+'/'+file};})};
 const config=R.generationConfig(sample),plan=A.buildJobs(config.seed,config.manifest,config);
 return {sample,config,summary:A.summarize(plan.jobs),excluded:selection.entries.filter(e=>!e.azureCaEsCompatible).map(e=>({text:e.text,ipa:e.ipa,reason:'Fonema absent de l’inventari Azure ca-ES admès; cal revisar el motor, no alterar la transcripció.'}))};
}
if(require.main===module){try{
 if(process.argv.slice(2).some(a=>a!=='--write')||process.argv.slice(2).length>1)throw Error('Ús: node tools/prepare-valencian-pilot.cjs [--write]. Sense opció de síntesi.');
 const result=prepare();
 if(process.argv.includes('--write')){
  const directory=path.join(A.ROOT,'output/audio/valencian-pilot');fs.mkdirSync(directory,{recursive:true});
  fs.writeFileSync(path.join(directory,'plan.json'),JSON.stringify({executable:false,profile:'ca-valencian-didactic-v1',...result},null,2)+'\n');
 }
 console.log(JSON.stringify({network:false,executable:false,pack:result.sample.pack.id,voice:result.sample.pack.voice,...result.summary,excluded:result.excluded}));
}catch(error){console.error(error.message);process.exitCode=1;}}
module.exports={prepare};
