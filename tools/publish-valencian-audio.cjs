'use strict';
// Publish only a completed, fully decoded, frozen IPA batch. No synthesis or keys.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const A=require('./audio-plan.cjs'),G=require('./generate-audio.cjs'),{prepare}=require('./prepare-valencian-batch.cjs');
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
function publish(){
 const {plan,snapshot}=prepare(),root=A.ROOT,id=plan.pack.id;
 const read=name=>A.readJson(path.join(root,name)),write=(name,data)=>fs.writeFileSync(path.join(root,name),JSON.stringify(data,null,2)+'\n');
 const status=read('output/audio/valencian-batch-status.json'),result=read('output/results/'+id+'-words.json'),settings=read('output/audio/'+id+'/settings.json'),audit=read('output/audio/valencian-decode-audit.json');
 const expectedPronunciations=snapshot.entries.map(e=>({id:e.id,text:e.text,ipa:e.ipa})).sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
 const ipaFingerprint=hash(JSON.stringify(expectedPronunciations));
 const identity={language:plan.pack.language,locale:plan.pack.locale,voice:plan.pack.voice,rate:plan.pack.rate,format:plan.pack.format,ipaFingerprint};
 if(status.phase!=='completed'||status.pack!==id||status.completed!==3299||status.total!==3299||status.tableRevision!==snapshot.tableRevision)throw Error('El lot no consta complet.');
 if(result.pack!==id||result.mode!=='words'||Object.keys(result.files).length!==3299)throw Error('Resultat incomplet.');
 if(settings.fingerprint!==hash(JSON.stringify(identity))||settings.ipaFingerprint!==ipaFingerprint)throw Error('Identitat de veu o IPA incompatible.');
 if(audit.pack!==id||audit.fingerprint!==settings.fingerprint||audit.tableRevision!==snapshot.tableRevision||audit.decoded!==3299||audit.failures.length)throw Error('Falta descodificar correctament tot el lot.');
 const review=read('output/audio/review-manifest.json').packs.find(p=>p.id===id);
 if(!review||review.fingerprint!==settings.fingerprint||Object.keys(review.ipas).length!==3299||Object.keys(review.files).length!==3299)throw Error('Falta l’índex exacte de revisió.');
 const staged=[];let bytes=0;const sha256={};
 for(const j of plan.jobs){
  if(result.files[j.id]!==j.relativePath||review.files[j.id]!==j.relativePath||review.ipas[j.id]!==j.ipa)throw Error('ID, ruta o IPA incompatible: '+j.text);
  const source=path.join(root,'output/audio',id,j.relativePath),data=fs.readFileSync(source),digest=hash(data);
  if(!G.isValidMp3(data)||digest!==audit.sha256[j.relativePath])throw Error('MP3 no verificat: '+j.text);
  sha256[j.relativePath]=digest;bytes+=data.length;staged.push({data,relative:j.relativePath});
 }
 // Every file and identity is checked before touching public assets or manifests.
 for(const item of staged){const destination=path.join(root,'assets/audio/ca',id,item.relative);fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,item.data);}
 const pack={...plan.pack,status:'ready',reviewStatus:'pending-auditory-review',fingerprint:settings.fingerprint,ipaFingerprint,tableRevision:snapshot.tableRevision,files:result.files};
 const manifest=read('audio/manifest.json');manifest.packs=manifest.packs.filter(p=>p.id!==id);manifest.packs.push(pack);write('audio/manifest.json',manifest);
 const publicReview=read('audio/review-manifest.json');publicReview.packs=publicReview.packs.filter(p=>p.id!==id);publicReview.packs.push({...review,basePath:pack.basePath,reviewStatus:'pending-auditory-review'});write('audio/review-manifest.json',publicReview);
 write('audio/valencian-publication.json',{schemaVersion:1,date:'2026-10-25',pack:id,profile:snapshot.profile,language:'ca',dialect:'valencia',coverage:3299,bytes,fingerprint:settings.fingerprint,ipaFingerprint,tableRevision:snapshot.tableRevision,review:'Pendent de contrast lingüístic i revisió auditiva individual; no hereta l’aprovació del pilot.',startedAt:status.startedAt,completedAt:status.updatedAt,decode:{decoder:audit.decoder,decoded:audit.decoded,failures:audit.failures.length,minDuration:audit.minDuration,maxDuration:audit.maxDuration,totalSeconds:audit.totalSeconds},sha256});
 console.log(JSON.stringify({published:true,pack:id,words:3299,bytes,decoded:audit.decoded,review:'pending'}));
}
if(require.main===module)publish();module.exports={publish};
