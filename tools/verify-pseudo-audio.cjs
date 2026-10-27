'use strict';
// Integrity of the completed local pseudo corpus only; no synthesis or secrets.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const A=require('./audio-plan.cjs'),G=require('./generate-audio.cjs'),{prepare}=require('./prepare-pseudo-audio.cjs');
const AUDIT='output/audio/pseudo-decode-audit.json';
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function expectedIdentity(item){
 const pack=item.plan.pack,entries=item.snapshot.entries.map(({id,text,ipa})=>({id,text,ipa})).sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
 const ipaFingerprint=digest(JSON.stringify(entries));
 const identity={language:pack.language,locale:pack.locale,voice:pack.voice,rate:pack.rate,format:pack.format,contentFingerprint:pack.contentFingerprint,ipaFingerprint};
 return {...identity,fingerprint:digest(JSON.stringify(identity))};
}
function assertCompleted(status,batch){
 if(status.phase!=='completed'||status.total!==192||status.completed!==192||batch.plans.length!==2||batch.requests!==192)throw Error('El lot de 192 pseudoparaules encara no consta complet.');
 for(const item of batch.plans)if(!status.readyPacks?.includes(item.plan.pack.id))throw Error('Falta completar el paquet '+item.plan.pack.id+'.');
}
function validateResult(item,result,settings){
 const id=item.plan.pack.id,identity=expectedIdentity(item);
 if(item.snapshot.mode!=='pseudo'||item.plan.jobs.length!==96||item.snapshot.entries.length!==96)throw Error('La instantània no cobreix 96 pseudoparaules.');
 if(result.schemaVersion!==1||result.pack!==id||result.mode!=='pseudo'||Object.keys(result.files||{}).length!==96||result.deferred?.length)throw Error('Resultat local incomplet: '+id+'.');
 for(const [key,value] of Object.entries(identity))if(settings[key]!==value)throw Error('Identitat de veu/IPA incompatible: '+id+' ('+key+').');
 for(const job of item.plan.jobs){if(!job.id.startsWith('s-')||job.mode!=='pseudo'||result.files[job.id]!==job.relativePath||!job.relativePath.startsWith('pseudo/'))throw Error('ID o ruta de pseudoparaula incompatible: '+job.id+'.');}
 return identity;
}
function mp3Header(buffer){
 let start=0;if(buffer.subarray(0,3).toString()==='ID3')start=10+((buffer[6]&127)<<21)+((buffer[7]&127)<<14)+((buffer[8]&127)<<7)+(buffer[9]&127);
 for(let i=start;i<buffer.length-4;i++){
  const b=buffer.subarray(i,i+4),version=(b[1]>>3)&3,sampleIndex=(b[2]>>2)&3,bitrateIndex=(b[2]>>4)&15;
  if(b[0]===255&&(b[1]&224)===224&&version!==1&&((b[1]>>1)&3)===1&&sampleIndex!==3&&bitrateIndex>0&&bitrateIndex<15){
   const rates={0:[11025,12000,8000],2:[22050,24000,16000],3:[44100,48000,32000]};
   const bitrates=version===3?[0,32,40,48,56,64,80,96,112,128,160,192,224,256,320]:[0,8,16,24,32,40,48,56,64,80,96,112,128,144,160];
   return {sampleRate:rates[version][sampleIndex],channels:(b[3]>>6)===3?1:2,bitrateKbps:bitrates[bitrateIndex]};
  }
 }
 throw Error('No s’ha trobat una capçalera MPEG Layer III vàlida.');
}
async function verify({write=false}={}){
 const batch=prepare(),status=A.readJson(path.join(A.ROOT,'output/audio/pseudo-batch-status.json'));assertCompleted(status,batch);
 const inputs=batch.plans.map(item=>{const id=item.plan.pack.id,result=A.readJson(path.join(A.ROOT,'output/results/'+id+'-pseudo.json')),settings=A.readJson(path.join(A.ROOT,'output/audio/'+id+'/settings.json'));return {item,result,settings,identity:validateResult(item,result,settings)};});
 const {chromium}=require(process.env.PLEC_NODE_MODULES?path.join(process.env.PLEC_NODE_MODULES,'playwright'):'playwright');
 const browser=await chromium.launch({channel:'chrome'});
 const audit={schemaVersion:1,kind:'completed-pseudo-audio-integrity',decoder:'Chromium Web Audio, 24 kHz context; native MP3 header checked separately',date:new Date().toISOString(),mode:'pseudo',total:192,decoded:0,failures:[],packs:[]};
 try{
  const page=await browser.newPage();await page.goto('http://127.0.0.1:4176/ca/');
  for(const {item,identity} of inputs){
   const id=item.plan.pack.id,record={id,profile:item.snapshot.profile,mode:'pseudo',dialect:item.snapshot.dialect,...identity,decoded:0,files:{},sha256:{}};
   for(const job of item.plan.jobs){
    try{
     const relative='output/audio/'+id+'/'+job.relativePath,bytes=fs.readFileSync(path.join(A.ROOT,relative)),header=mp3Header(bytes);
     if(!G.isValidMp3(bytes)||header.sampleRate!==24000||header.channels!==1||header.bitrateKbps!==48)throw Error('Format MP3 natiu incompatible.');
     const decoded=await page.evaluate(async relative=>{const response=await fetch('/'+relative.split('/').map(encodeURIComponent).join('/'));if(!response.ok)throw Error('Fitxer local absent');const context=new AudioContext({sampleRate:24000});try{const b=await context.decodeAudioData(await response.arrayBuffer());return {duration:b.duration,sampleRate:b.sampleRate,channels:b.numberOfChannels};}finally{await context.close();}},relative);
     if(decoded.sampleRate!==24000||decoded.channels!==1||!Number.isFinite(decoded.duration)||decoded.duration<=0||decoded.duration>15)throw Error('Descodificació o durada incompatible.');
     record.files[job.id]={relativePath:job.relativePath,bytes:bytes.length,...header,...decoded};record.sha256[job.relativePath]=digest(bytes);record.decoded++;audit.decoded++;
    }catch(error){audit.failures.push({pack:id,id:job.id,text:job.text,reason:error.message});}
   }
   const durations=Object.values(record.files).map(file=>file.duration);record.minDuration=durations.length?Math.min(...durations):null;record.maxDuration=durations.length?Math.max(...durations):null;record.totalSeconds=durations.reduce((a,b)=>a+b,0);audit.packs.push(record);
  }
 }finally{await browser.close();}
 if(write)await G.atomicWriteJson(path.join(A.ROOT,AUDIT),audit);
 return audit;
}
if(require.main===module){const args=process.argv.slice(2);if(args.some(a=>a!=='--write')){console.error('Ús: node tools/verify-pseudo-audio.cjs [--write]');process.exitCode=1;}else verify({write:args.includes('--write')}).then(a=>{console.log(JSON.stringify({decoded:a.decoded,failures:a.failures.length,packs:a.packs.map(p=>({id:p.id,decoded:p.decoded,minDuration:p.minDuration,maxDuration:p.maxDuration})),synthesis:false}));if(a.decoded!==192||a.failures.length)process.exitCode=1;}).catch(e=>{console.error(e.message);process.exitCode=1;});}
module.exports={AUDIT,digest,expectedIdentity,assertCompleted,validateResult,mp3Header,verify};
