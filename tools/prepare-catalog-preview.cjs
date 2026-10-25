'use strict';
// Offline teacher audition index. Does not activate public/student manifests.
const fs=require('node:fs'),path=require('node:path');
const A=require('./audio-plan.cjs'),G=require('./generate-audio.cjs');
(async()=>{
  const publicManifest=A.readJson(A.DEFAULT_MANIFEST),catalog=A.readJson(A.DEFAULT_CATALOG).catalog,base=A.validatePack(publicManifest);
  const compatible=settings=>settings.fingerprint&&['language','locale','voice','rate','format'].every(key=>settings[key]===base[key]);
  const byId=new Map(catalog.entries.filter(e=>e.mode==='words').map(e=>[e.id,e]));
  const files={};
  const reviews=new Map([
    ['ca-central-alba-feedback-2-v1','ca-central-feedback-2-review.json'],
    ['ca-central-alba-diaeresis-sample-v1','ca-central-diaeresis-sample-review.json']
  ]);
  for(const id of [base.id,'ca-central-alba-gemination-finals-v1','ca-central-alba-feedback-2-v1','ca-central-alba-diaeresis-sample-v1']){
    const folder=path.join(A.ROOT,'output/audio',id),resultFile=path.join(A.ROOT,'output/results',id+'-words.json');
    if(!fs.existsSync(resultFile))continue;
    const settings=A.readJson(path.join(folder,'settings.json')),result=A.readJson(resultFile);
    if(result.pack!==id||!compatible(settings))throw Error('Paquet de prova incompatible.');
    const rejected=new Set();
    if(reviews.has(id)){
      const review=A.readJson(path.join(A.ROOT,'audio/pronunciation',reviews.get(id)));
      if(review.schemaVersion!==1||review.pack!==id||review.voice!==settings.voice||!Array.isArray(review.entries))throw Error('Revisió auditiva incompatible.');
      for(const row of review.entries){
        if(byId.get(row.id)?.text!==row.mot||!['improved','unresolved','original-preferred'].includes(row.outcome))throw Error('Mot o resultat de revisió incorrecte.');
        if(row.outcome!=='improved')rejected.add(row.id);
      }
    }
    for(const [entryId,relative] of Object.entries(result.files)){
      const entry=byId.get(entryId);
      if(!entry||relative!=='words/'+A.wordFileName(entry.text))throw Error('ID o ruta de prova incorrectes.');
      if(!G.isValidMp3(fs.readFileSync(path.join(folder,...relative.split('/')))))throw Error('MP3 de prova incorrecte.');
      if(rejected.has(entryId)){
        // Initial auditions may exist on disk but be absent from the later batch result.
        const originalFolder=path.join(A.ROOT,'output/audio',base.id),originalFile=path.join(originalFolder,...relative.split('/'));
        if(!files[entryId]&&fs.existsSync(originalFile)){
          if(!compatible(A.readJson(path.join(originalFolder,'settings.json')))||!G.isValidMp3(fs.readFileSync(originalFile)))throw Error('Original de prova incompatible.');
          files[entryId]=base.id+'/'+relative;
        }
        continue;
      }
      files[entryId]=id+'/'+relative;
    }
  }
  await G.atomicWriteJson(path.join(A.ROOT,'output/audio/catalog-preview-manifest.json'),{
    schemaVersion:1,defaultPacks:{[base.language]:'ca-central-catalog-preview'},
    packs:[{...base,id:'ca-central-catalog-preview',label:'Català central · prova local en revisió',status:'ready',basePath:'output/audio/',files},...publicManifest.packs.filter(p=>p.dialect!=='central'&&p.status==='ready')]
  });
  console.log('Catàleg local: '+Object.keys(files).length+' àudios disponibles per a revisió. Cap síntesi ni publicació.');
})().catch(error=>{console.error(error.message);process.exitCode=1;});
