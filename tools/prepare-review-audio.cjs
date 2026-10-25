'use strict';
// Local-only index of exact recordings, including originals and IPA auditions.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),A=require('./audio-plan.cjs'),G=require('./generate-audio.cjs'),T=require('./pronunciation-table.cjs');
const specs=[
 ['ca-central-alba-v1','ca-central-didactic-v1','Alba · original','original'],
 ['ca-central-alba-gemination-finals-v1','ca-central-didactic-v1','Alba · prova de dicció','ipa'],
 ['ca-central-alba-feedback-2-v1','ca-central-didactic-v1','Alba · quatre incidències','ipa'],
 ['ca-central-alba-diaeresis-sample-v1','ca-central-didactic-v1','Alba · dièresis','ipa'],
 ['ca-valencian-enric-pilot-v1','ca-valencian-didactic-v1','Enric · pilot valencià','ipa']
];
(async()=>{
 const words=A.readJson(A.DEFAULT_CATALOG).catalog.entries.filter(e=>e.mode==='words'),packs=[];
 for(const [id,profile,label,kind]of specs){
  const directory=path.join(A.ROOT,'output/audio',id),settingsFile=path.join(directory,'settings.json');if(!fs.existsSync(settingsFile))continue;
  const settings=A.readJson(settingsFile);if(!/^[a-f0-9]{64}$/.test(settings.fingerprint)||settings.language!=='ca')throw Error('Ajustos locals invàlids.');
  const files={};for(const e of words){const rel='words/'+A.wordFileName(e.text),file=path.join(directory,...rel.split('/'));
   if(fs.existsSync(file)&&G.isValidMp3(fs.readFileSync(file)))files[e.id]=rel;
  }
  const ipas={};
  if(kind==='ipa'){
   const table=T.load(profile),current=table.rows.filter(r=>files[r.id]).map(r=>({id:r.id,text:r.mot,ipa:r.ipa})).sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
   const digest=crypto.createHash('sha256').update(JSON.stringify(current)).digest('hex');
   if(digest===settings.ipaFingerprint)for(const row of current)ipas[row.id]=row.ipa;
  }
  packs.push({id,profile,label,kind,voice:settings.voice,fingerprint:settings.fingerprint,language:'ca',status:'ready',basePath:'output/audio/'+id+'/',files,ipas});
 }
 await G.atomicWriteJson(path.join(A.ROOT,'output/audio/review-manifest.json'),{schemaVersion:1,defaultPacks:{},packs});
 console.log('Índex local de revisió: '+packs.length+' paquets, '+packs.reduce((sum,p)=>sum+Object.keys(p.files).length,0)+' enregistraments. Sense síntesi ni publicació.');
})().catch(e=>{console.error(e.message);process.exitCode=1;});
