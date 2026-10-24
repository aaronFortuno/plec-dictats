'use strict';
// Offline teacher audition index. Does not activate public/student manifests.
const fs=require('node:fs'),path=require('node:path');
const A=require('./audio-plan.cjs'),G=require('./generate-audio.cjs');
(async()=>{
  const catalog=A.readJson(A.DEFAULT_CATALOG).catalog,base=A.validatePack(A.readJson(A.DEFAULT_MANIFEST));
  const byId=new Map(catalog.entries.filter(e=>e.mode==='words').map(e=>[e.id,e]));
  const files={};
  for(const id of [base.id,'ca-central-alba-gemination-finals-v1','ca-central-alba-feedback-2-v1','ca-central-alba-diaeresis-sample-v1']){
    const folder=path.join(A.ROOT,'output/audio',id),resultFile=path.join(A.ROOT,'output/results',id+'-words.json');
    if(!fs.existsSync(resultFile))continue;
    const settings=A.readJson(path.join(folder,'settings.json')),result=A.readJson(resultFile);
    if(result.pack!==id||!settings.fingerprint||['language','locale','voice','rate','format'].some(key=>settings[key]!==base[key]))throw Error('Paquet de prova incompatible.');
    for(const [entryId,relative] of Object.entries(result.files)){
      const entry=byId.get(entryId);
      if(!entry||relative!=='words/'+A.wordFileName(entry.text))throw Error('ID o ruta de prova incorrectes.');
      if(!G.isValidMp3(fs.readFileSync(path.join(folder,...relative.split('/')))))throw Error('MP3 de prova incorrecte.');
      files[entryId]=id+'/'+relative;
    }
  }
  await G.atomicWriteJson(path.join(A.ROOT,'output/audio/catalog-preview-manifest.json'),{
    schemaVersion:1,defaultPacks:{[base.language]:'ca-central-catalog-preview'},
    packs:[{...base,id:'ca-central-catalog-preview',label:'Català central · prova local en revisió',status:'ready',basePath:'output/audio/',files}]
  });
  console.log('Catàleg local: '+Object.keys(files).length+' àudios disponibles per a revisió. Cap síntesi ni publicació.');
})().catch(error=>{console.error(error.message);process.exitCode=1;});
