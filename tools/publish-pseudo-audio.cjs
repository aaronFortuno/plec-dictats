'use strict';
// All 192 local recordings must pass verification before any public mutation.
const fs=require('node:fs'),path=require('node:path');
const A=require('./audio-plan.cjs'),G=require('./generate-audio.cjs'),{prepare}=require('./prepare-pseudo-audio.cjs');
const V=require('./verify-pseudo-audio.cjs'),{replaceFileSync}=require('./local-files.cjs');
function mergePacks(manifest,additions){for(const pack of additions){const previous=manifest.packs.find(p=>p.id===pack.id);if(previous&&previous.fingerprint!==pack.fingerprint)throw Error('No es pot substituir una identitat pública diferent: '+pack.id+'.');}const ids=new Set(additions.map(p=>p.id));return {...manifest,packs:[...manifest.packs.filter(p=>!ids.has(p.id)),...additions]};}
function publicationPlan({batch,status,results,settings,audit,readFile}){
 V.assertCompleted(status,batch);
 if(audit.schemaVersion!==1||audit.kind!=='completed-pseudo-audio-integrity'||audit.mode!=='pseudo'||audit.total!==192||audit.decoded!==192||audit.failures?.length!==0||audit.packs?.length!==2)throw Error('Falta verificar i descodificar els 192 MP3.');
 const additions=[],reviews=[],assets=[],publicPacks=[];
 for(const item of batch.plans){
  const id=item.plan.pack.id,identity=V.validateResult(item,results[id],settings[id]),audited=audit.packs.find(p=>p.id===id);
  if(!audited||audited.profile!==item.snapshot.profile||audited.mode!=='pseudo'||audited.decoded!==96||Object.keys(audited.files||{}).length!==96||Object.keys(audited.sha256||{}).length!==96)throw Error('Auditoria incompleta: '+id+'.');
  for(const [key,value]of Object.entries(identity))if(audited[key]!==value)throw Error('L’auditoria pertany a altres ajustos: '+id+'.');
  const files={},ipas={},sha256={};let bytes=0;
  for(const job of item.plan.jobs){
   const meta=audited.files[job.id],data=readFile(id,job.relativePath),digest=V.digest(data);
   if(!meta||meta.relativePath!==job.relativePath||meta.bytes!==data.length||meta.sampleRate!==24000||meta.channels!==1||meta.bitrateKbps!==48||!Number.isFinite(meta.duration)||meta.duration<=0||meta.duration>15||!G.isValidMp3(data)||audited.sha256[job.relativePath]!==digest)throw Error('MP3 no verificat o canviat: '+job.text+'.');
   files[job.id]=job.relativePath;ipas[job.id]=job.ipa;sha256[job.relativePath]=digest;bytes+=data.length;assets.push({id,relativePath:job.relativePath,data});
  }
  const pack={...item.plan.pack,status:'ready',reviewStatus:'pending-auditory-review',fingerprint:identity.fingerprint,ipaFingerprint:identity.ipaFingerprint,files};
  additions.push(pack);reviews.push({id,profile:item.snapshot.profile,mode:'pseudo',dialect:item.snapshot.dialect,label:pack.label,kind:'ipa',voice:pack.voice,fingerprint:identity.fingerprint,contentFingerprint:identity.contentFingerprint,ipaFingerprint:identity.ipaFingerprint,language:'ca',status:'ready',reviewStatus:'pending-auditory-review',basePath:pack.basePath,files,ipas});
  publicPacks.push({id,profile:item.snapshot.profile,mode:'pseudo',dialect:item.snapshot.dialect,voice:pack.voice,coverage:96,bytes,fingerprint:identity.fingerprint,contentFingerprint:identity.contentFingerprint,ipaFingerprint:identity.ipaFingerprint,reviewStatus:'pending-auditory-review',decode:{decoded:96,failures:0,minDuration:audited.minDuration,maxDuration:audited.maxDuration,totalSeconds:audited.totalSeconds},sha256});
 }
 return {additions,reviews,assets,publication:{schemaVersion:1,date:new Date().toISOString().slice(0,10),language:'ca',mode:'pseudo',coverage:192,characters:batch.characters,review:'Propostes editorials i revisió auditiva obertes; integritat tècnica no és correcció de pronunciació ni ortografia normativa única.',startedAt:status.startedAt,completedAt:status.updatedAt,decode:{decoder:audit.decoder,decoded:192,failures:0},packs:publicPacks}};
}
function writeJson(relative,value){const file=path.join(A.ROOT,relative),temporary=file+'.part';fs.writeFileSync(temporary,JSON.stringify(value,null,2)+'\n');replaceFileSync(temporary,file);}
function publish(){
 const read=relative=>A.readJson(path.join(A.ROOT,relative)),batch=prepare(),status=read('output/audio/pseudo-batch-status.json');
 V.assertCompleted(status,batch);
 const results={},settings={};for(const item of batch.plans){const id=item.plan.pack.id;results[id]=read('output/results/'+id+'-pseudo.json');settings[id]=read('output/audio/'+id+'/settings.json');}
 const planned=publicationPlan({batch,status,results,settings,audit:read(V.AUDIT),readFile:(id,relative)=>fs.readFileSync(path.join(A.ROOT,'output/audio',id,relative))});
 const manifest=mergePacks(read('audio/manifest.json'),planned.additions),review=mergePacks(read('audio/review-manifest.json'),planned.reviews);
 // All inputs, exact identities and digests have been checked above. The public
 // word packs/defaults remain intact; each new pseudo pack has its own directory.
 for(const asset of planned.assets){const file=path.join(A.ROOT,'assets/audio/ca',asset.id,asset.relativePath);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file+'.part',asset.data);replaceFileSync(file+'.part',file);}
 writeJson('audio/pseudo-publication.json',planned.publication);writeJson('audio/review-manifest.json',review);writeJson('audio/manifest.json',manifest);
 console.log(JSON.stringify({published:true,packs:planned.additions.map(p=>p.id),decoded:192,review:'pending-auditory-review',synthesis:false}));return planned.publication;
}
if(require.main===module){try{if(process.argv.length!==2)throw Error('Ús: node tools/publish-pseudo-audio.cjs');publish();}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={mergePacks,publicationPlan,publish};
