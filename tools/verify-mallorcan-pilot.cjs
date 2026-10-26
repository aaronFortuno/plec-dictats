'use strict';
// Local audition integrity only. Never calls synthesis or validates pronunciation.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLEC_NODE_MODULES?path.join(process.env.PLEC_NODE_MODULES,'playwright'):'playwright');
const {prepare}=require('./prepare-mallorcan-pilot.cjs'),A=require('./audio-plan.cjs');
(async()=>{const write=process.argv.includes('--write');if(process.argv.slice(2).some(a=>a!=='--write'))throw Error('Ús: node tools/verify-mallorcan-pilot.cjs [--write]');
 const pilot=prepare(),browser=await chromium.launch({channel:'chrome'});try{const page=await browser.newPage();await page.goto('http://127.0.0.1:4176/output/audio/comparacio-mallorqui.html');
 const files=[];
 for(const plan of pilot.plans)for(const entry of pilot.snapshot.entries){
  const relative='output/audio/'+plan.pack.id+'/words/'+A.wordFileName(entry.text),buffer=fs.readFileSync(path.join(A.ROOT,relative));
  let nativeRate=null;for(let i=0;i<buffer.length-4;i++){const b=buffer.subarray(i,i+4),version=(b[1]>>3)&3,index=(b[2]>>2)&3;if(b[0]===255&&(b[1]&224)===224&&version!==1&&((b[1]>>1)&3)===1&&index!==3&&((b[2]>>4)&15)>0&&((b[2]>>4)&15)<15){nativeRate=({0:[11025,12000,8000],2:[22050,24000,16000],3:[44100,48000,32000]})[version][index];break;}}
  assert.equal(nativeRate,24000,'Encoded MP3 sample rate');
  const decoded=await page.evaluate(async relative=>{const response=await fetch('/'+relative.split('/').map(encodeURIComponent).join('/'));if(!response.ok)throw Error('Missing MP3');const context=new AudioContext({sampleRate:24000});try{const b=await context.decodeAudioData(await response.arrayBuffer());return {duration:b.duration,sampleRate:b.sampleRate,channels:b.numberOfChannels};}finally{await context.close();}},relative);
  assert.equal(decoded.sampleRate,24000);assert.equal(decoded.channels,1);assert(decoded.duration>0&&decoded.duration<15);
  files.push({id:entry.id,text:entry.text,voice:plan.name,pack:plan.pack.id,localPath:relative,bytes:buffer.length,sha256:crypto.createHash('sha256').update(buffer).digest('hex'),...decoded});
 }
 const feedbackFile=path.join(A.ROOT,'audio/pronunciation/ca/mallorcan-pilot-feedback.json');
 const feedback=fs.existsSync(feedbackFile)?A.readJson(feedbackFile):null;
 const result={schemaVersion:1,kind:'local-mallorcan-pilot-integrity',date:'2026-10-26',profile:pilot.snapshot.profile,reference:'Palma · editorial model pending native review',fingerprint:pilot.fingerprint,words:18,voices:pilot.plans.map(p=>p.name),filesVerified:files.length,characters:pilot.characters,linguisticReview:'pending',listeningReview:feedback?.decision||'pending',publicAudio:false,files,...(feedback?{feedback:'../ca/mallorcan-pilot-feedback.json'}:{})};
 if(write)fs.writeFileSync(path.join(A.ROOT,'audio/pronunciation/recordings/ca-mallorcan-palma-pilot-v1-result.json'),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({words:18,voices:result.voices,mp3Decoded:files.length,minSeconds:Math.min(...files.map(f=>f.duration)),maxSeconds:Math.max(...files.map(f=>f.duration)),review:'pending',synthesis:false}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
